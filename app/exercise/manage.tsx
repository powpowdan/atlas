import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import { AnimatedCategorySection } from '../../components/AnimatedCategorySection';
import { ExerciseEditorModal } from '../../components/ExerciseEditorModal';
import { confirm } from '../../store/confirm';
import { showUndoToast } from '../../store/undo';
import { colors, type } from '../../constants/theme';
import type { Exercise } from '../../types';

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
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | undefined>(undefined);
  const [categoryActions, setCategoryActions] = useState<string | null>(null);
  const [categoryRenameMode, setCategoryRenameMode] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [revealTarget, setRevealTarget] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const headerY = useRef(new Map<string, number>()).current;

  useEffect(() => {
    navigation.setOptions({ title: 'Exercise library' });
  }, []);

  useEffect(() => {
    headerY.clear();
  }, [filter, headerY]);

  useEffect(() => {
    if (!revealTarget) return;
    setRevealTarget(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const y = headerY.get(revealTarget);
        if (y !== undefined) {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - 12),
            animated: true,
          });
        }
      });
    });
  }, [revealTarget, headerY]);

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

  const searching = query.trim().length > 0;

  const visible = exercises.filter((e) => {
    const inFilter =
      filter === 'active' ? e.archived_at === null : e.archived_at !== null;
    if (!inFilter) return false;
    if (!searching) return true;
    return e.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  // While searching, matching sections render expanded without touching the
  // user's expansion set — clearing the query restores it untouched.
  const isExpanded = useCallback(
    (category: string) => searching || expanded.has(category),
    [searching, expanded],
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
      data: byCategory.get(category)!,
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

  async function handleSaved(saved: Exercise) {
    setEditorOpen(false);
    setEditing(undefined);
    await refresh();
    const category = saved.category;
    if (!category) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(category);
      return next;
    });
    setRevealTarget(category);
  }

  function renderRow(item: Exercise) {
    return (
      <View
        key={item.id}
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
    );
  }

  async function handleArchive(ex: Exercise) {
    const ok = await confirm({
      title: `Archive "${ex.name}"?`,
      message: 'It will be hidden from pickers but kept in your history.',
      confirmLabel: 'Archive',
    });
    if (!ok) return;
    await archiveExercise(db, ex.id);
    refresh();
  }

  async function handleRestore(ex: Exercise) {
    await restoreExercise(db, ex.id);
    refresh();
  }

  async function handleDelete(ex: Exercise) {
    const ok = await confirm({
      title: `Delete "${ex.name}"?`,
      message: "Its history stays in past sessions, but it can't be reused.",
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    await deleteExercise(db, ex.id);
    refresh();
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
    showUndoToast(
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
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises"
          placeholderTextColor={colors.inkSoft}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView
        style={styles.list}
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {sections.map((section) => (
          <AnimatedCategorySection
            key={section.category}
            title={section.category || 'Uncategorized'}
            count={section.count}
            expanded={isExpanded(section.category)}
            onToggle={() => toggleExpanded(section.category)}
            onLongPress={
              section.category
                ? () => openCategoryActions(section.category)
                : undefined
            }
            showMenu={Platform.OS === 'web' && !!section.category}
            onMenu={() => openCategoryActions(section.category)}
            onHeaderLayout={(y) => headerY.set(section.category, y)}
          >
            {section.data.map((item) => renderRow(item))}
          </AnimatedCategorySection>
        ))}
        {sections.length === 0 ? (
          <Text style={styles.empty}>
            {searching
              ? `No exercises match "${query.trim()}".`
              : filter === 'archived'
                ? 'No archived exercises.'
                : 'No exercises yet. Tap "+ New exercise" above.'}
          </Text>
        ) : null}
      </ScrollView>
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
  filterBtnText: { ...type.action, color: colors.inkSoft },
  filterBtnTextActive: { color: colors.paper },
  addBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: { ...type.cta, color: colors.paper },
  list: { flex: 1 },
  searchWrap: { padding: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...type.body,
    color: colors.ink,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  listItemArchived: { opacity: 0.6 },
  listItemName: { ...type.heading, color: colors.ink },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  actionEditText: { ...type.action, color: colors.ink },
  actionArchiveText: { ...type.action, color: colors.oxblood },
  actionRestoreText: { ...type.action, color: colors.ink },
  empty: { ...type.body, padding: 24, textAlign: 'center', color: colors.textTertiary },
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
    ...type.sectionHeader,
    color: colors.ink,
    marginBottom: 4,
  },
  categoryActionRow: { paddingVertical: 12 },
  categoryActionText: { ...type.action, color: colors.ink },
  categoryActionDeleteText: { ...type.action, color: colors.oxblood },
  categoryActionMutedText: { ...type.body, color: colors.inkSoft },
  categoryInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...type.body,
    color: colors.ink,
    marginTop: 4,
  },
  categoryHint: { ...type.caption, color: colors.inkSoft, marginTop: 8 },
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
  categoryRenameBtnText: { ...type.cta, color: colors.paper },
  categoryRenameCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
