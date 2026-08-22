import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { colors, type } from '../constants/theme';
import type { ProgressionMetric, ProgressionPoint } from '../types';

interface ProgressionChartProps {
  points: ProgressionPoint[];
  metric: ProgressionMetric;
  onDotPress: (sessionId: string) => void;
}

// Layout constants for the chart's internal SVG coordinate space.
// The width is responsive (fills the screen minus the wrap's 8px horizontal
// padding × 2, floored at 320 for narrow splitscreen), while the height is
// fixed. Scale stays ~1.0 on phones, so fonts render at true size.
const MIN_VIEW_WIDTH = 320;
const VIEW_HEIGHT = 240;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const GRIDLINE_COUNT = 5;

const METRIC_LABEL: Record<ProgressionMetric, string> = {
  e1rm: 'lbs (est. 1RM)',
  weight: 'lbs',
  reps: 'reps',
  volume: 'lbs (volume)',
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

function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
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
  const { width: windowWidth } = useWindowDimensions();
  const viewWidth = Math.max(windowWidth - 16, MIN_VIEW_WIDTH);
  const plotWidth = viewWidth - PAD_LEFT - PAD_RIGHT;
  const plotHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const { xPositions, yPositions, gridValues, xTickIndices, prFlags } = useMemo(() => {
    const values = points.map((p) => valueForMetric(p, metric));
    const { min, max } = computeBounds(values);
    const range = max - min || 1;

    const xPositions = points.map((_, i) => {
      if (points.length === 1) return PAD_LEFT + plotWidth / 2;
      return PAD_LEFT + (i / (points.length - 1)) * plotWidth;
    });
    const yPositions = values.map((v) => {
      const t = (v - min) / range;
      return PAD_TOP + (1 - t) * plotHeight;
    });

    const gridValues: number[] = [];
    for (let i = 0; i < GRIDLINE_COUNT; i++) {
      const t = i / (GRIDLINE_COUNT - 1);
      gridValues.push(min + t * range);
    }

    // A PR summit is a point strictly above every earlier value in the series
    // (same "beats the existing best" rule as the best-set tracking).
    let runningMax = Number.NEGATIVE_INFINITY;
    const prFlags = values.map((v) => {
      const isPr = runningMax > Number.NEGATIVE_INFINITY && v > runningMax;
      if (v > runningMax) runningMax = v;
      return isPr;
    });

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

    return { xPositions, yPositions, gridValues, xTickIndices, prFlags };
  }, [points, metric, plotWidth, plotHeight]);

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
      <Svg width="100%" height={VIEW_HEIGHT} viewBox={`0 0 ${viewWidth} ${VIEW_HEIGHT}`}>
        <Rect
          x={PAD_LEFT}
          y={PAD_TOP}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          stroke={colors.border}
          strokeWidth={1}
        />
        {gridValues.map((_, i) => {
          const t = i / (GRIDLINE_COUNT - 1);
          const y = PAD_TOP + (1 - t) * plotHeight;
          return (
            <Line
              key={`grid-${i}`}
              x1={PAD_LEFT}
              x2={PAD_LEFT + plotWidth}
              y1={y}
              y2={y}
              stroke={colors.borderSubtle}
              strokeWidth={1}
            />
          );
        })}
        {gridValues.map((v, i) => {
          const t = i / (GRIDLINE_COUNT - 1);
          const y = PAD_TOP + (1 - t) * plotHeight;
          return (
            <SvgText
              key={`ylabel-${i}`}
              x={PAD_LEFT - 6}
              y={y + 3}
              fontSize={10}
              fill={colors.textTertiary}
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
            stroke={colors.ink}
            strokeWidth={2}
            strokeDasharray="6 4"
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
              isPr={prFlags[i]}
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
  isPr: boolean;
  tickLabel: string;
  showTickLabel: boolean;
  onPress: () => void;
}

function ChartDot({ cx, cy, isPr, tickLabel, showTickLabel, onPress }: ChartDotProps) {
  // Hit area is an invisible rect around the dot — react-native-svg doesn't
  // ship Pressable natively, so we render the dot and label as SVG and put
  // a transparent Rect over a 24x24 area as the tap target.
  return (
    <>
      {isPr ? (
        <Path d={starPath(cx, cy, 5.5, 2.2)} fill={colors.brass} />
      ) : (
        <Circle cx={cx} cy={cy} r={3} fill={colors.ink} />
      )}
      {showTickLabel ? (
        <SvgText
          x={cx}
          y={VIEW_HEIGHT - 6}
          fontSize={10}
          fill={colors.textTertiary}
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
    ...type.caption,
    color: colors.textTertiary,
    marginLeft: 36,
    marginBottom: 4,
  },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { ...type.body, color: colors.textTertiary, textAlign: 'center' },
});
