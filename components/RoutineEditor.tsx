import { useSQLiteContext } from 'expo-sqlite';
import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DragList from 'react-native-draglist';

import {
  createRoutine,
  deleteRoutine,
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
  const [listEpoch, setListEpoch] = useState(0);

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

  function confirmDelete() {
    if (!routineId) return;
    Alert.alert(
      'Delete routine?',
      `"${name}" and its exercise list will be permanently removed. Sessions you already logged with it are kept. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRoutine(db, routineId);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/routines');
            }
          },
        },
      ],
    );
  }

  function reorder(from: number, to: number) {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= selected.length ||
      to >= selected.length
    ) {
      return;
    }
    const next = [...selected];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSelected(next);
    // Remount the DragList: on Fabric (new arch) the dropped cell's native
    // layer keeps stale drag transforms and renders blank until the next
    // drag. A fresh mount rebuilds every cell deterministically.
    setListEpoch((e) => e + 1);
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

      <DragList
        key={listEpoch}
        style={styles.list}
        containerStyle={styles.listContainer}
        data={selected}
        keyExtractor={(item) => item}
        onReordered={reorder}
        renderItem={({ item, index, onDragStart, onDragEnd, isActive }) => (
          <Pressable
            style={[styles.listItem, isActive && styles.listItemHover]}
            onLongPress={onDragStart}
            onPressOut={onDragEnd}
            delayLongPress={150}
          >
            <Text style={styles.listItemIndex}>{index + 1}.</Text>
            <Text style={styles.listItemName}>
              {exerciseNameById.get(item) ?? item}
            </Text>
            <View style={styles.listItemActions}>
              <Pressable onPress={() => removeAt(index)} style={styles.iconBtn}>
                <Text style={{ color: colors.oxblood }}>✕</Text>
              </Pressable>
            </View>
          </Pressable>
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
        {isEdit ? (
          <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
            <Text style={styles.deleteBtnText}>Delete routine</Text>
          </Pressable>
        ) : null}
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
  listContainer: { flex: 1 },
  list: { flex: 1 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.paper,
  },
  listItemHover: {
    backgroundColor: colors.paperDeep,
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 6,
    elevation: 4,
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
  deleteBtn: { marginTop: 12, alignItems: 'center', padding: 8 },
  deleteBtnText: { color: colors.oxblood, fontWeight: '600', fontSize: 15 },
});
