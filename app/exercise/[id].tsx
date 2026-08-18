import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getExerciseById } from '../../db/queries/exercises';
import {
  getBestE1rmSet,
  getBestSet,
  getExerciseProgress,
  getMostRepsSet,
} from '../../db/queries/tracking';
import { ProgressionChart } from '../../components/ProgressionChart';
import { colors, type } from '../../constants/theme';
import { formatWeightLabel } from '../../utils/format';
import type {
  BestLastResult,
  Exercise,
  ProgressionMetric,
  ProgressionPoint,
  SetTypeFilter,
} from '../../types';

const METRICS: Array<{ key: ProgressionMetric; label: string }> = [
  { key: 'e1rm', label: '1RM' },
  { key: 'weight', label: 'Weight' },
  { key: 'reps', label: 'Reps' },
  { key: 'volume', label: 'Volume' },
];

const SET_TYPES: Array<{ key: SetTypeFilter; label: string }> = [
  { key: 'working', label: 'Working' },
  { key: 'all', label: 'All' },
  { key: 'warmup', label: 'Warmup' },
];

export default function ExerciseProgressionScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [heaviest, setHeaviest] = useState<BestLastResult | null>(null);
  const [mostReps, setMostReps] = useState<BestLastResult | null>(null);
  const [bestE1rm, setBestE1rm] = useState<BestLastResult | null>(null);
  const [points, setPoints] = useState<ProgressionPoint[]>([]);
  const [metric, setMetric] = useState<ProgressionMetric>('e1rm');
  const [setType, setSetType] = useState<SetTypeFilter>('working');

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const ex = await getExerciseById(db, id);
    setExercise(ex);
    if (ex) navigation.setOptions({ title: ex.name });
    if (!ex) {
      setLoading(false);
      return;
    }
    const [h, r, e, pts] = await Promise.all([
      getBestSet(db, id, setType),
      getMostRepsSet(db, id, setType),
      getBestE1rmSet(db, id, setType),
      getExerciseProgress(db, id, setType),
    ]);
    setHeaviest(h);
    setMostReps(r);
    setBestE1rm(e);
    setPoints(pts);
    setLoading(false);
  }, [db, id, setType, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDotPress(sessionId: string) {
    router.push(`/history/${sessionId}`);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Exercise not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.subtitle}>
          {exercise.category ?? '—'}
          {exercise.is_assisted ? ' · assisted' : ''}
        </Text>
      </View>

      <View style={styles.recordsRow}>
        <RecordCell label="Heaviest" data={heaviest} />
        <RecordCell label="Most reps" data={mostReps} />
        <RecordCell label="Best 1RM" data={bestE1rm} />
      </View>

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Metric</Text>
      </View>
      <View style={styles.tabRow}>
        {METRICS.map((m) => (
          <Pressable
            key={m.key}
            style={[styles.tab, metric === m.key && styles.tabActive]}
            onPress={() => setMetric(m.key)}
          >
            <Text style={[styles.tabText, metric === m.key && styles.tabTextActive]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Set type</Text>
      </View>
      <View style={styles.tabRow}>
        {SET_TYPES.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, setType === t.key && styles.tabActive]}
            onPress={() => setSetType(t.key)}
          >
            <Text style={[styles.tabText, setType === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chartWrap}>
        <ProgressionChart points={points} metric={metric} onDotPress={handleDotPress} />
      </View>
    </ScrollView>
  );
}

interface RecordCellProps {
  label: string;
  data: BestLastResult | null;
}

function RecordCell({ label, data }: RecordCellProps) {
  return (
    <View style={styles.recordCell}>
      <Text style={styles.recordLabel}>{label}</Text>
      {data ? (
        <>
          <Text style={styles.recordValue}>
            {formatWeightLabel(data.weight)} × {data.reps}
          </Text>
          <Text style={styles.recordDate}>
            {new Date(data.created_at).toLocaleDateString()}
          </Text>
        </>
      ) : (
        <Text style={styles.recordValueEmpty}>—</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...type.display, fontSize: 20, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.inkSoft, fontSize: 13, marginTop: 4 },
  recordsRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: colors.borderSubtle,
  },
  recordCell: { flex: 1, alignItems: 'center' },
  recordLabel: { color: colors.textTertiary, fontSize: 11, marginBottom: 4 },
  recordValue: { ...type.tabular, fontSize: 15, fontWeight: '600', color: colors.ink },
  recordValueEmpty: { fontSize: 15, fontWeight: '600', color: colors.textDisabled },
  recordDate: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },
  sectionLabel: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  sectionLabelText: { color: colors.textTertiary, fontSize: 11, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  tabText: { color: colors.inkSoft, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: colors.paper, fontWeight: '600' },
  chartWrap: { paddingVertical: 8 },
  empty: { padding: 12, color: colors.textTertiary, textAlign: 'center' },
});
