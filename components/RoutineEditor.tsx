import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { listExercises } from '../db/queries/exercises';
import type { Exercise } from '../types';

interface Props {
  routineId?: string;
}

export default function RoutineEditor({ routineId }: Props) {
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isEdit = Boolean(routineId);

  const refreshLibrary = useCallback(async () => {
    const rows = await listExercises(db);
    setLibrary(rows);
  }, [db]);

  useEffect(() => {
    (async () => {
      await refreshLibrary();
      if (routineId) {
        const existing = await getRoutine(db, routineId);
        if (existing) {
          setName(existing.name);
          setSelected(existing.exercises.map((re) => re.exercise_id));
        }
      }
      setLoading(false);
    })();
  }, [routineId, db, refreshLibrary]);

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

  function togglePick(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const exerciseNameById = new Map(library.map((e) => [e.id, e.name]));

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
          onPress={() => {
            setPickerOpen(true);
            refreshLibrary();
          }}
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
                <Text style={{ color: '#c00' }}>✕</Text>
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

      <Modal visible={pickerOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pick exercises</Text>
          <Pressable onPress={() => setPickerOpen(false)}>
            <Text style={styles.modalDone}>Done</Text>
          </Pressable>
        </View>
        <FlatList
          data={library}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const picked = selected.includes(item.id);
            return (
              <Pressable
                style={[styles.pickerItem, picked && styles.pickerItemPicked]}
                onPress={() => togglePick(item.id)}
              >
                <Text style={styles.pickerItemName}>{item.name}</Text>
                <Text style={styles.pickerItemMeta}>
                  {item.category ?? '—'}
                  {item.is_assisted ? ' · assisted' : ''}
                </Text>
                <Text style={styles.pickerCheck}>{picked ? '✓' : ''}</Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No exercises in library.</Text>
          }
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  form: { padding: 16 },
  label: { fontSize: 13, color: '#666', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  error: { color: '#c00', marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: { fontWeight: '600', fontSize: 15 },
  addBtn: {
    backgroundColor: '#e8f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: { color: '#0a7cff', fontWeight: '600' },
  list: { flex: 1 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemIndex: { width: 28, color: '#999' },
  listItemName: { flex: 1, fontSize: 16 },
  listItemActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  empty: { padding: 24, textAlign: 'center', color: '#999' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  saveBtn: {
    backgroundColor: '#0a7cff',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontWeight: '600', fontSize: 16 },
  modalDone: { color: '#0a7cff', fontWeight: '600' },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItemPicked: { backgroundColor: '#f0f7ff' },
  pickerItemName: { fontSize: 16, fontWeight: '500' },
  pickerItemMeta: {
    color: '#666',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  pickerCheck: { color: '#0a7cff', fontWeight: '700', fontSize: 18 },
});
