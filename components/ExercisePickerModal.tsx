import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { listExercises } from '../db/queries/exercises';
import { sortCategories } from '../constants/categories';
import type { Exercise } from '../types';
import { ExerciseEditorModal } from './ExerciseEditorModal';
import { LogoMark } from './LogoMark';
import { colors, type } from '../constants/theme';

interface ExercisePickerModalProps {
  visible: boolean;
  // Hide already-selected exercises from the picker (e.g. routine editor).
  excludeIds?: string[];
  // When true (default), the picker closes after a single selection. Set to
  // false for multi-add flows (routine editor) where the user may pick several.
  autoCloseOnSelect?: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

interface PickerSection {
  category: string;
  data: Exercise[];
}

export function ExercisePickerModal({
  visible,
  excludeIds,
  autoCloseOnSelect = true,
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  const db = useSQLiteContext();
  const router = useRouter();
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);

  const refresh = useCallback(async () => {
    const rows = await listExercises(db, { includeArchived: false });
    setLibrary(rows);
  }, [db]);

  useEffect(() => {
    if (visible) {
      setQuery('');
      refresh();
    }
  }, [visible, refresh]);

  const excludeSet = new Set(excludeIds ?? []);
  const filtered = library.filter((ex) => {
    if (excludeSet.has(ex.id)) return false;
    if (!query.trim()) return true;
    return ex.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  const searching = query.trim().length > 0;

  const byCategory = new Map<string, Exercise[]>();
  for (const ex of filtered) {
    const key = ex.category ?? '';
    const list = byCategory.get(key) ?? [];
    list.push(ex);
    byCategory.set(key, list);
  }
  const sections: PickerSection[] = sortCategories(byCategory.keys()).map(
    (category) => ({ category, data: byCategory.get(category)! }),
  );

  function handleSelect(exercise: Exercise) {
    onSelect(exercise);
    if (autoCloseOnSelect) onClose();
  }

  function handleManage() {
    // Close before pushing: a pushed screen renders underneath an open
    // full-screen Modal on both platforms.
    onClose();
    router.push('/exercise/manage');
  }

  function handleCreated(exercise: Exercise) {
    setEditorOpen(false);
    // Refresh the underlying list, then immediately select the new row.
    refresh().then(() => onSelect(exercise));
    if (autoCloseOnSelect) onClose();
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        onRequestClose={onClose}
      >
        <View style={styles.modalBody}>
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Add exercise</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={handleManage}>
                <Text style={styles.modalManage}>Manage</Text>
              </Pressable>
              <Pressable onPress={() => setEditorOpen(true)}>
                <Text style={styles.modalNew}>+ New</Text>
              </Pressable>
            </View>
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
          {searching ? (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.pickerItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.pickerItemName}>{item.name}</Text>
                  <Text style={styles.pickerItemMeta}>
                    {item.category ?? '—'}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <EmptyState query={query} onCreate={() => setEditorOpen(true)} />
              }
            />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {section.category || 'Uncategorized'}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.pickerItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.pickerItemName}>{item.name}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <EmptyState query={query} onCreate={() => setEditorOpen(true)} />
              }
            />
          )}
        </View>
      </Modal>
      <ExerciseEditorModal
        visible={editorOpen}
        onSaved={handleCreated}
        onClose={() => setEditorOpen(false)}
      />
    </>
  );
}

function EmptyState({ query, onCreate }: { query: string; onCreate: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <LogoMark size={200} />
      <Text style={styles.empty}>
        {query
          ? `No exercises match "${query}".`
          : 'No exercises available.'}
      </Text>
      <Pressable style={styles.emptyCreateBtn} onPress={onCreate}>
        <Text style={styles.emptyCreateBtnText}>+ Create a new exercise</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBody: { flex: 1, backgroundColor: colors.paper },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...type.modalTitle, color: colors.ink },
  modalCancel: { ...type.action, color: colors.inkSoft },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  modalManage: { ...type.action, color: colors.inkSoft },
  modalNew: { ...type.cta, color: colors.ink },
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
  sectionHeader: {
    backgroundColor: colors.paperDeep,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { ...type.sectionHeader, color: colors.inkSoft },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemName: { ...type.heading, color: colors.ink },
  pickerItemMeta: { ...type.meta, color: colors.inkSoft, marginTop: 2 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { ...type.body, color: colors.textTertiary, textAlign: 'center', marginVertical: 12 },
  emptyCreateBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyCreateBtnText: { ...type.cta, color: colors.paper },
});
