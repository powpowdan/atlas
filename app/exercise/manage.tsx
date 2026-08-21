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
import { sortCategories } from '../../constants/categories';
import { ExerciseEditorModal } from '../../components/ExerciseEditorModal';
import { colors } from '../../constants/theme';
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

type Filter = 'active' | 'archived';

interface Section {
  category: string;
  data: Exercise[];
  count: number;
}

export default function ManageExercisesScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const [filter, setFilter] = useState<Filter>('active');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | undefined>(undefined);

  useEffect(() => {
    navigation.setOptions({ title: 'Exercise library' });
  }, []);

  const refresh = useCallback(async () => {
    const rows = await listExercises(db, { includeArchived: true });
    setExercises(rows);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function toggleExpanded(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const visible = exercises.filter((e) =>
    filter === 'active'
      ? e.archived_at === null
      : e.archived_at !== null,
  );

  const byCategory = new Map<string, Exercise[]>();
  for (const ex of visible) {
    const key = ex.category ?? '';
    const list = byCategory.get(key) ?? [];
    list.push(ex);
    byCategory.set(key, list);
  }

  const sections: Section[] = sortCategories(byCategory.keys()).map(
    (category) => ({
      category,
      count: byCategory.get(category)!.length,
      data: expanded.has(category) ? byCategory.get(category)! : [],
    }),
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.filterToggle}>
          {(['active', 'archived'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filter === f && styles.filterBtnTextActive,
                ]}
              >
                {f === 'active' ? 'Active' : 'Archived'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ New exercise</Text>
        </Pressable>
      </View>
      <SectionList
        style={styles.list}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Pressable
            style={styles.sectionHeader}
            onPress={() => toggleExpanded(section.category)}
          >
            <Text style={styles.sectionChevron}>
              {expanded.has(section.category) ? '▾' : '▸'}
            </Text>
            <Text style={styles.sectionTitle}>
              {section.category || 'Uncategorized'}
            </Text>
            <Text style={styles.sectionCount}>{section.count}</Text>
          </Pressable>
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.listItem,
              item.archived_at !== null && styles.listItemArchived,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemName}>{item.name}</Text>
            </View>
            {item.archived_at === null ? (
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
          <Text style={styles.empty}>
            {filter === 'archived'
              ? 'No archived exercises.'
              : 'No exercises yet. Tap "+ New exercise" above.'}
          </Text>
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
  container: { flex: 1, backgroundColor: colors.paper },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    overflow: 'hidden',
  },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  filterBtnActive: { backgroundColor: colors.ink },
  filterBtnText: { color: colors.inkSoft, fontSize: 13, fontWeight: '600' },
  filterBtnTextActive: { color: colors.paper },
  addBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: { color: colors.paper, fontWeight: '600' },
  list: { flex: 1 },
  sectionHeader: {
    backgroundColor: colors.paperDeep,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionChevron: { color: colors.inkSoft, fontSize: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.inkSoft, letterSpacing: 0.5, flex: 1 },
  sectionCount: { color: colors.textTertiary, fontSize: 12 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  listItemArchived: { opacity: 0.6 },
  listItemName: { fontSize: 16, fontWeight: '500', color: colors.ink },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  actionEditText: { color: colors.ink, fontWeight: '600', fontSize: 13 },
  actionArchiveText: { color: colors.oxblood, fontWeight: '600', fontSize: 13 },
  actionRestoreText: { color: colors.ink, fontWeight: '600', fontSize: 13 },
  empty: { padding: 24, textAlign: 'center', color: colors.textTertiary },
});
