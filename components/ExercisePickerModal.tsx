import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { listExercises } from '../db/queries/exercises';
import type { Exercise } from '../types';
import { ExerciseEditorModal } from './ExerciseEditorModal';
import { LogoMark } from './LogoMark';
import { colors } from '../constants/theme';

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

export function ExercisePickerModal({
  visible,
  excludeIds,
  autoCloseOnSelect = true,
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  const db = useSQLiteContext();
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

  function handleSelect(exercise: Exercise) {
    onSelect(exercise);
    if (autoCloseOnSelect) onClose();
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
            <Pressable onPress={() => setEditorOpen(true)}>
              <Text style={styles.modalNew}>+ New</Text>
            </Pressable>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.pickerItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.pickerItemName}>{item.name}</Text>
                <Text style={styles.pickerItemMeta}>
                  {item.category ?? '—'}
                  {item.is_assisted ? ' · assisted' : ''}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <LogoMark size={200} />
                <Text style={styles.empty}>
                  {query
                    ? `No exercises match "${query}".`
                    : 'No exercises available.'}
                </Text>
                <Pressable
                  style={styles.emptyCreateBtn}
                  onPress={() => setEditorOpen(true)}
                >
                  <Text style={styles.emptyCreateBtnText}>+ Create a new exercise</Text>
                </Pressable>
              </View>
            }
          />
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
  modalTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  modalCancel: { color: colors.inkSoft, fontSize: 16 },
  modalNew: { color: colors.ink, fontWeight: '600', fontSize: 16 },
  searchWrap: { padding: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.ink,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemName: { fontSize: 16, fontWeight: '500', color: colors.ink },
  pickerItemMeta: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { color: colors.textTertiary, textAlign: 'center', marginVertical: 12 },
  emptyCreateBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyCreateBtnText: { color: colors.paper, fontWeight: '600' },
});
