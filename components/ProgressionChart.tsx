import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import type { ProgressionMetric, ProgressionPoint } from '../types';

interface ProgressionChartProps {
  points: ProgressionPoint[];
  metric: ProgressionMetric;
  onDotPress: (sessionId: string) => void;
}

// Layout constants for the chart's internal SVG coordinate space.
// We render into a fixed viewBox and let the parent scale via width.
const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 180;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PLOT_WIDTH = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM;
const GRIDLINE_COUNT = 5;

const METRIC_LABEL: Record<ProgressionMetric, string> = {
  e1rm: 'kg (est. 1RM)',
  weight: 'kg',
  reps: 'reps',
  volume: 'kg (volume)',
};

function valueForMetric(p: ProgressionPoint, metric: ProgressionMetric): number {
  switch (metric) {
    case 'e1rm':
      return p.bestE1rm;
    case 'weight':
      return p.bestWeight;
    case 'reps':
      return p.bestReps;
    case 'volume':
      return p.volume;
  }
}

function formatTickValue(n: number, metric: ProgressionMetric): string {
  if (metric === 'reps') return String(Math.round(n));
  // One decimal max, drop the trailing .0
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// "Nice" axis bounds: round the max up and min down to a tidy number of
// gridlines. For a single-point chart, we still want a readable range
// around the value.
function computeBounds(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 };
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  if (rawMin === rawMax) {
    // Single distinct value: pad symmetrically.
    const v = rawMin;
    if (v === 0) return { min: 0, max: 1 };
    const pad = Math.max(Math.abs(v) * 0.1, 1);
    return { min: Math.max(0, v - pad), max: v + pad };
  }
  const range = rawMax - rawMin;
  const pad = range * 0.1;
  return { min: Math.max(0, rawMin - pad), max: rawMax + pad };
}

export function ProgressionChart({ points, metric, onDotPress }: ProgressionChartProps) {
  const { xPositions, yPositions, gridValues, xTickIndices } = useMemo(() => {
    const values = points.map((p) => valueForMetric(p, metric));
    const { min, max } = computeBounds(values);
    const range = max - min || 1;

    const xPositions = points.map((_, i) => {
      if (points.length === 1) return PAD_LEFT + PLOT_WIDTH / 2;
      return PAD_LEFT + (i / (points.length - 1)) * PLOT_WIDTH;
    });
    const yPositions = values.map((v) => {
      const t = (v - min) / range;
      return PAD_TOP + (1 - t) * PLOT_HEIGHT;
    });

    const gridValues: number[] = [];
    for (let i = 0; i < GRIDLINE_COUNT; i++) {
      const t = i / (GRIDLINE_COUNT - 1);
      gridValues.push(min + t * range);
    }

    // 3 date ticks: first, middle, last.
    const xTickIndices: number[] = [];
    if (points.length > 0) {
      xTickIndices.push(0);
      if (points.length >= 3) {
        xTickIndices.push(Math.floor((points.length - 1) / 2));
      }
      if (points.length >= 2) {
        xTickIndices.push(points.length - 1);
      }
    }

    return { xPositions, yPositions, gridValues, xTickIndices };
  }, [points, metric]);

  if (points.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>
          No history yet. Log this exercise in a session to see progression.
        </Text>
      </View>
    );
  }

  const polylinePoints = xPositions
    .map((x, i) => `${x},${yPositions[i]}`)
    .join(' ');

  return (
    <View style={styles.wrap}>
      <Text style={styles.axisLabel}>{METRIC_LABEL[metric]}</Text>
      <Svg width="100%" height={VIEW_HEIGHT} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Rect
          x={PAD_LEFT}
          y={PAD_TOP}
          width={PLOT_WIDTH}
          height={PLOT_HEIGHT}
          fill="transparent"
          stroke="#eee"
          strokeWidth={1}
        />
        {gridValues.map((_, i) => {
          const t = i / (GRIDLINE_COUNT - 1);
          const y = PAD_TOP + (1 - t) * PLOT_HEIGHT;
          return (
            <Line
              key={`grid-${i}`}
              x1={PAD_LEFT}
              x2={PAD_LEFT + PLOT_WIDTH}
              y1={y}
              y2={y}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
          );
        })}
        {gridValues.map((v, i) => {
          const t = i / (GRIDLINE_COUNT - 1);
          const y = PAD_TOP + (1 - t) * PLOT_HEIGHT;
          return (
            <SvgText
              key={`ylabel-${i}`}
              x={PAD_LEFT - 6}
              y={y + 3}
              fontSize={9}
              fill="#999"
              textAnchor="end"
            >
              {formatTickValue(v, metric)}
            </SvgText>
          );
        })}
        {points.length >= 2 ? (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#0a7cff"
            strokeWidth={1.5}
          />
        ) : null}
        {points.map((p, i) => {
          const cx = xPositions[i];
          const cy = yPositions[i];
          const tickLabel = formatDate(p.startedAt);
          return (
            <ChartDot
              key={p.sessionId}
              cx={cx}
              cy={cy}
              tickLabel={tickLabel}
              showTickLabel={xTickIndices.includes(i)}
              onPress={() => onDotPress(p.sessionId)}
            />
          );
        })}
      </Svg>
    </View>
  );
}

interface ChartDotProps {
  cx: number;
  cy: number;
  tickLabel: string;
  showTickLabel: boolean;
  onPress: () => void;
}

function ChartDot({ cx, cy, tickLabel, showTickLabel, onPress }: ChartDotProps) {
  // Hit area is an invisible rect around the dot — react-native-svg doesn't
  // ship Pressable natively, so we render the dot and label as SVG and put
  // a transparent Rect over a 24x24 area as the tap target.
  return (
    <>
      <Circle cx={cx} cy={cy} r={3} fill="#0a7cff" />
      {showTickLabel ? (
        <SvgText
          x={cx}
          y={VIEW_HEIGHT - 6}
          fontSize={9}
          fill="#999"
          textAnchor="middle"
        >
          {tickLabel}
        </SvgText>
      ) : null}
      <Rect
        x={cx - 12}
        y={cy - 12}
        width={24}
        height={24}
        fill="transparent"
        onPress={onPress}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingTop: 8 },
  axisLabel: {
    fontSize: 11,
    color: '#999',
    marginLeft: 36,
    marginBottom: 4,
  },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { color: '#999', textAlign: 'center' },
});
