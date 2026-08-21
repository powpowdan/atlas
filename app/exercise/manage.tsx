import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  archiveExercise,
  countExercisesInCategory,
  deleteExercise,
  listExercises,
  renameCategory,
  restoreExercise,
} from '../../db/queries/exercises';
import {
  CANONICAL_CATEGORIES,
  normalizeCategory,
  sortCategories,
} from '../../constants/categories';
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

function notify(message: string) {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert(message);
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
  const [categoryActions, setCategoryActions] = useState<string | null>(null);
  const [categoryRenameMode, setCategoryRenameMode] = useState(false);
  const [renameText, setRenameText] = useState('');

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

  function handleDelete(ex: Exercise) {
    confirmDiscard(
      `Delete "${ex.name}" permanently? Its history stays in past sessions, but it can't be reused.`,
      async () => {
        await deleteExercise(db, ex.id);
        refresh();
      },
    );
  }

  function openCategoryActions(category: string) {
    setCategoryActions(category);
    setCategoryRenameMode(false);
    setRenameText('');
  }

  function closeCategoryActions() {
    setCategoryActions(null);
    setCategoryRenameMode(false);
    setRenameText('');
  }

  function startCategoryRename() {
    setRenameText(categoryActions ?? '');
    setCategoryRenameMode(true);
  }

  async function submitCategoryRename() {
    const category = categoryActions;
    const trimmed = renameText.trim();
    closeCategoryActions();
    if (!category || !trimmed || trimmed === category) return;
    // Prefer an existing (e.g. canonical) casing so "chest" merges into "Chest".
    const existingNames = [
      ...CANONICAL_CATEGORIES,
      ...new Set(
        exercises
          .map((e) => e.category)
          .filter((c): c is string => c !== null),
      ),
    ];
    const resolved =
      existingNames.find(
        (c) => normalizeCategory(c) === normalizeCategory(trimmed),
      ) ?? trimmed;
    await renameCategory(db, category, resolved);
    refresh();
  }

  async function handleCategoryDelete() {
    const category = categoryActions;
    closeCategoryActions();
    if (!category) return;
    const counts = await countExercisesInCategory(db, category);
    if (counts.total === 0) {
      // Categories are derived from exercises: nothing is stored to remove,
      // so this only covers a stale render — refresh and the section is gone.
      refresh();
      return;
    }
    const parts: string[] = [];
    if (counts.active > 0) parts.push(`${counts.active} active`);
    if (counts.archived > 0) parts.push(`${counts.archived} archived`);
    notify(
      `Can't delete "${category}": ${counts.total} exercise${counts.total === 1 ? '' : 's'} still reference${counts.total === 1 ? 's' : ''} it (${parts.join(' and ')}). Rename/Merge the category, or delete its remaining exercises first.`,
    );
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
            onLongPress={
              section.category
                ? () => openCategoryActions(section.category)
                : undefined
            }
          >
            <Text style={styles.sectionChevron}>
              {expanded.has(section.category) ? '▾' : '▸'}
            </Text>
            <Text style={styles.sectionTitle}>
              {section.category || 'Uncategorized'}
            </Text>
            <Text style={styles.sectionCount}>{section.count}</Text>
            {Platform.OS === 'web' && section.category ? (
              <Pressable
                style={styles.sectionMenuBtn}
                hitSlop={8}
                onPress={() => openCategoryActions(section.category)}
              >
                <Text style={styles.sectionMenu}>⋯</Text>
              </Pressable>
            ) : null}
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
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.actionArchiveText}>Delete</Text>
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
      <Modal
        visible={categoryActions !== null}
        transparent
        animationType="fade"
        onRequestClose={closeCategoryActions}
      >
        <Pressable style={styles.categoryOverlay} onPress={closeCategoryActions}>
          <Pressable style={styles.categorySheet}>
            {categoryRenameMode ? (
              <>
                <Text style={styles.categorySheetTitle}>
                  Rename &quot;{categoryActions}&quot;
                </Text>
                <TextInput
                  style={styles.categoryInput}
                  value={renameText}
                  onChangeText={setRenameText}
                  autoFocus
                  onSubmitEditing={submitCategoryRename}
                  returnKeyType="done"
                  placeholder="New category name"
                  placeholderTextColor={colors.inkSoft}
                />
                <Text style={styles.categoryHint}>
                  Naming an existing category merges this one into it.
                </Text>
                <View style={styles.categoryRenameActions}>
                  <Pressable
                    style={[styles.categoryRenameBtn, styles.categoryRenameCancel]}
                    onPress={closeCategoryActions}
                  >
                    <Text style={styles.categoryActionMutedText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.categoryRenameBtn}
                    onPress={submitCategoryRename}
                  >
                    <Text style={styles.categoryRenameBtnText}>Save</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.categorySheetTitle}>{categoryActions}</Text>
                <Pressable
                  style={styles.categoryActionRow}
                  onPress={startCategoryRename}
                >
                  <Text style={styles.categoryActionText}>Rename / Merge…</Text>
                </Pressable>
                <Pressable
                  style={styles.categoryActionRow}
                  onPress={handleCategoryDelete}
                >
                  <Text style={styles.categoryActionDeleteText}>Delete</Text>
                </Pressable>
                <Pressable
                  style={styles.categoryActionRow}
                  onPress={closeCategoryActions}
                >
                  <Text style={styles.categoryActionMutedText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  sectionMenuBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  sectionMenu: { color: colors.inkSoft, fontSize: 14 },
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
  categoryOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  categorySheet: {
    backgroundColor: colors.paper,
    borderRadius: 10,
    padding: 16,
    width: '100%',
    maxWidth: 360,
  },
  categorySheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  categoryActionRow: { paddingVertical: 12 },
  categoryActionText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  categoryActionDeleteText: {
    fontSize: 15,
    color: colors.oxblood,
    fontWeight: '600',
  },
  categoryActionMutedText: { fontSize: 15, color: colors.inkSoft },
  categoryInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.ink,
    marginTop: 4,
  },
  categoryHint: { color: colors.inkSoft, fontSize: 12, marginTop: 8 },
  categoryRenameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  categoryRenameBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  categoryRenameBtnText: { color: colors.paper, fontWeight: '600' },
  categoryRenameCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
