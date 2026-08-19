import { useSQLiteContext } from 'expo-sqlite';
import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createRoutine,
  getRoutine,
  updateRoutine,
} from '../db/queries/routines';
import { ExercisePickerModal } from './ExercisePickerModal';
import { colors, type } from '../constants/theme';
import type { Exercise } from '../types';

interface Props {
  routineId?: string;
}

export default function RoutineEditor({ routineId }: Props) {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<Exercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isEdit = Boolean(routineId);

  useEffect(() => {
    (async () => {
      if (routineId) {
        const existing = await getRoutine(db, routineId);
        if (existing) {
          setName(existing.name);
          setSelected(existing.exercises.map((re) => re.exercise_id));
          setSelectedDetails(
            existing.exercises
              .map((re) => re.exercise)
              .filter((e): e is Exercise => Boolean(e)),
          );
          navigation.setOptions({ title: existing.name });
        }
      }
      setLoading(false);
    })();
  }, [routineId, db, navigation]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    try {
      if (routineId) {
        await updateRoutine(db, routineId, { name: trimmed, exerciseIds: selected });
      } else {
        await createRoutine(db, { name: trimmed, exerciseIds: selected });
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/routines');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save routine');
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    setSelected((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  }

  function removeAt(index: number) {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePickerSelect(exercise: Exercise) {
    setSelected((prev) =>
      prev.includes(exercise.id) ? prev : [...prev, exercise.id],
    );
    setSelectedDetails((prev) =>
      prev.some((e) => e.id === exercise.id) ? prev : [...prev, exercise],
    );
  }

  const exerciseNameById = new Map(selectedDetails.map((e) => [e.id, e.name]));

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.label}>Routine name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Day 1"
          placeholderTextColor={colors.inkSoft}
          value={name}
          onChangeText={setName}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Exercises ({selected.length})
        </Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => setPickerOpen(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <FlatList
        style={styles.list}
        data={selected}
        keyExtractor={(id, idx) => `${id}-${idx}`}
        renderItem={({ item, index }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemIndex}>{index + 1}.</Text>
            <Text style={styles.listItemName}>
              {exerciseNameById.get(item) ?? item}
            </Text>
            <View style={styles.listItemActions}>
              <Pressable onPress={() => moveUp(index)} style={styles.iconBtn}>
                <Text>↑</Text>
              </Pressable>
              <Pressable onPress={() => moveDown(index)} style={styles.iconBtn}>
                <Text>↓</Text>
              </Pressable>
              <Pressable onPress={() => removeAt(index)} style={styles.iconBtn}>
                <Text style={{ color: colors.oxblood }}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No exercises added yet.</Text>
        }
      />

      <View style={styles.footer}>
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {isEdit ? 'Save changes' : 'Create routine'}
          </Text>
        </Pressable>
      </View>

      <ExercisePickerModal
        visible={pickerOpen}
        excludeIds={selected}
        autoCloseOnSelect={false}
        onSelect={handlePickerSelect}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  form: { padding: 16 },
  label: { fontSize: 13, color: colors.inkSoft, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: colors.oxblood, marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { fontWeight: '600', fontSize: 15, color: colors.ink },
  addBtn: {
    backgroundColor: colors.paperDeep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: { color: colors.ink, fontWeight: '600' },
  list: { flex: 1 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemIndex: { ...type.tabular, width: 28, color: colors.textTertiary },
  listItemName: { flex: 1, fontSize: 16, color: colors.ink },
  listItemActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  empty: { padding: 24, textAlign: 'center', color: colors.textTertiary },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: {
    backgroundColor: colors.ink,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.paper, fontWeight: '600', fontSize: 16 },
});
