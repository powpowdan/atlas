import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  archiveExercise,
  listExercises,
  restoreExercise,
} from '../../db/queries/exercises';
import { ExerciseEditorModal } from '../../components/ExerciseEditorModal';
import type { Exercise } from '../../types';

function confirmDiscard(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
  } else {
    Alert.alert(message, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

interface Section {
  title: string;
  data: Exercise[];
}

export default function ManageExercisesScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const [active, setActive] = useState<Exercise[]>([]);
  const [archived, setArchived] = useState<Exercise[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | undefined>(undefined);

  useEffect(() => {
    navigation.setOptions({ title: 'Manage exercises' });
  }, []);

  const refresh = useCallback(async () => {
    const rows = await listExercises(db, { includeArchived: true });
    setActive(rows.filter((e) => e.archived_at === null));
    setArchived(rows.filter((e) => e.archived_at !== null));
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }

  function openEdit(ex: Exercise) {
    setEditing(ex);
    setEditorOpen(true);
  }

  function handleSaved() {
    setEditorOpen(false);
    setEditing(undefined);
    refresh();
  }

  function handleArchive(ex: Exercise) {
    confirmDiscard(`Archive "${ex.name}"? It will be hidden from pickers but kept in your history.`, async () => {
      await archiveExercise(db, ex.id);
      refresh();
    });
  }

  async function handleRestore(ex: Exercise) {
    await restoreExercise(db, ex.id);
    refresh();
  }

  const sections: Section[] = [];
  if (active.length > 0) sections.push({ title: 'Active', data: active });
  if (archived.length > 0) sections.push({ title: 'Archived', data: archived });

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ New exercise</Text>
        </Pressable>
      </View>
      <SectionList
        style={styles.list}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {section.title} ({section.data.length})
            </Text>
          </View>
        )}
        renderItem={({ item, section }) => (
          <View
            style={[
              styles.listItem,
              item.archived_at !== null && styles.listItemArchived,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemName}>{item.name}</Text>
              <Text style={styles.listItemMeta}>
                {item.category ?? '—'}
                {item.is_assisted ? ' · assisted' : ''}
              </Text>
            </View>
            {section.title === 'Active' ? (
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => openEdit(item)}
                >
                  <Text style={styles.actionEditText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => handleArchive(item)}
                >
                  <Text style={styles.actionArchiveText}>Archive</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => handleRestore(item)}
                >
                  <Text style={styles.actionRestoreText}>Restore</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No exercises yet. Tap "+ New exercise" above.</Text>
        }
      />
      <ExerciseEditorModal
        visible={editorOpen}
        exercise={editing}
        onSaved={handleSaved}
        onClose={() => {
          setEditorOpen(false);
          setEditing(undefined);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  toolbar: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'flex-end',
  },
  addBtn: {
    backgroundColor: '#0a7cff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  list: { flex: 1 },
  sectionHeader: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#666', letterSpacing: 0.5 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  listItemArchived: { opacity: 0.6 },
  listItemName: { fontSize: 16, fontWeight: '500' },
  listItemMeta: { color: '#666', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  actionEditText: { color: '#0a7cff', fontWeight: '600', fontSize: 13 },
  actionArchiveText: { color: '#c00', fontWeight: '600', fontSize: 13 },
  actionRestoreText: { color: '#0a7cff', fontWeight: '600', fontSize: 13 },
  empty: { padding: 24, textAlign: 'center', color: '#999' },
});
