import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createExercise, listExercises, updateExercise } from '../db/queries/exercises';
import {
  CANONICAL_CATEGORIES,
  normalizeCategory,
  sortCategories,
  suggestCategory,
} from '../constants/categories';
import { colors } from '../constants/theme';
import {
  DuplicateExerciseError,
  type Exercise,
  type ExerciseInput,
} from '../types';

interface ExerciseEditorModalProps {
  visible: boolean;
  // Omit `exercise` for create mode; pass it for edit mode.
  exercise?: Exercise;
  onSaved: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExerciseEditorModal({
  visible,
  exercise,
  onSaved,
  onClose,
}: ExerciseEditorModalProps) {
  const db = useSQLiteContext();
  const isEdit = Boolean(exercise);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');
  const [categorySuggestion, setCategorySuggestion] = useState<{
    typed: string;
    suggested: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Chips come from active exercises only: archiving the last exercise of a
  // category removes its chip. The edited exercise's own category is unioned
  // in below so it stays visible/selectable even if archived.
  const loadCategories = useCallback(async () => {
    const rows = await listExercises(db, { includeArchived: false });
    const seen = rows
      .map((e) => e.category)
      .filter((c): c is string => c !== null);
    setDbCategories([...new Set(seen)]);
  }, [db]);

  useEffect(() => {
    if (visible) {
      setName(exercise?.name ?? '');
      setCategory(exercise?.category ?? null);
      setExtraCategories([]);
      setNewCategoryOpen(false);
      setNewCategoryText('');
      setCategorySuggestion(null);
      setError(null);
      loadCategories();
    }
  }, [visible, exercise, loadCategories]);

  const allCategories = sortCategories([
    ...CANONICAL_CATEGORIES,
    ...dbCategories,
    ...extraCategories,
    ...(exercise?.category ? [exercise.category] : []),
  ]);

  function acceptNewCategory(name: string) {
    setCategorySuggestion(null);
    setExtraCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCategory(name);
  }

  function submitNewCategory() {
    const trimmed = newCategoryText.trim();
    setNewCategoryOpen(false);
    setNewCategoryText('');
    if (!trimmed) return;
    const exact = allCategories.find(
      (c) => normalizeCategory(c) === normalizeCategory(trimmed),
    );
    if (exact) {
      setCategory(exact);
      setCategorySuggestion(null);
      return;
    }
    const near = suggestCategory(trimmed, allCategories);
    if (near && categorySuggestion?.typed !== trimmed) {
      setCategorySuggestion({ typed: trimmed, suggested: near });
      return;
    }
    acceptNewCategory(trimmed);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (!category) {
      setError('Category is required');
      return;
    }
    const input: ExerciseInput = {
      name: trimmed,
      category,
    };
    setSaving(true);
    try {
      const saved = isEdit && exercise
        ? await updateExercise(db, exercise.id, input)
        : await createExercise(db, input);
      onSaved(saved);
    } catch (e) {
      if (e instanceof DuplicateExerciseError) {
        setError('An exercise with this name already exists.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to save exercise');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
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
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit exercise' : 'New exercise'}
          </Text>
          <Pressable onPress={handleSave} disabled={saving}>
            <Text style={[styles.modalDone, saving && styles.modalDoneDisabled]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.body}>
          <TextInput
            style={styles.input}
            placeholder="Exercise name"
            placeholderTextColor={colors.inkSoft}
            value={name}
            onChangeText={setName}
            autoFocus={!isEdit}
          />
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {allCategories.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                  {c}
                </Text>
              </Pressable>
            ))}
            {newCategoryOpen ? (
              <View style={styles.newCategoryWrap}>
                <TextInput
                  style={styles.newCategoryInput}
                  placeholder="Category name"
                  placeholderTextColor={colors.inkSoft}
                  value={newCategoryText}
                  onChangeText={setNewCategoryText}
                  autoFocus
                  onSubmitEditing={submitNewCategory}
                  returnKeyType="done"
                />
                <Pressable style={styles.newCategoryAdd} onPress={submitNewCategory}>
                  <Text style={styles.newCategoryAddText}>Add</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.chipNew}
                onPress={() => setNewCategoryOpen(true)}
              >
                <Text style={styles.chipNewText}>+ New…</Text>
              </Pressable>
            )}
          </View>
          {categorySuggestion ? (
            <View style={styles.suggestionRow}>
              <Text style={styles.suggestionText}>
                Did you mean &quot;{categorySuggestion.suggested}&quot;?
              </Text>
              <Pressable
                style={styles.suggestionUse}
                onPress={() => {
                  setCategory(categorySuggestion.suggested);
                  setCategorySuggestion(null);
                }}
              >
                <Text style={styles.suggestionUseText}>
                  Use &quot;{categorySuggestion.suggested}&quot;
                </Text>
              </Pressable>
              <Pressable
                style={styles.suggestionKeep}
                onPress={() => acceptNewCategory(categorySuggestion.typed)}
              >
                <Text style={styles.suggestionKeepText}>
                  Keep &quot;{categorySuggestion.typed}&quot;
                </Text>
              </Pressable>
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
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
  modalDone: { color: colors.ink, fontWeight: '600', fontSize: 16 },
  modalDoneDisabled: { color: colors.textDisabled },
  body: { padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    color: colors.ink,
  },
  label: { color: colors.inkSoft, fontSize: 13, marginBottom: 8 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: { color: colors.inkSoft, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.paper, fontWeight: '600' },
  chipNew: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderStyle: 'dashed',
  },
  chipNewText: { color: colors.inkSoft, fontSize: 13, fontWeight: '600' },
  newCategoryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newCategoryInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 160,
    color: colors.ink,
    fontSize: 13,
  },
  newCategoryAdd: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newCategoryAddText: { color: colors.paper, fontSize: 13, fontWeight: '600' },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  suggestionText: { color: colors.inkSoft, fontSize: 13 },
  suggestionUse: {
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  suggestionUseText: { color: colors.paper, fontSize: 12, fontWeight: '600' },
  suggestionKeep: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  suggestionKeepText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  error: { color: colors.oxblood, marginTop: 12 },
});
