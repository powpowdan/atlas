import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createExercise, updateExercise } from '../db/queries/exercises';
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
  const [category, setCategory] = useState('');
  const [isAssisted, setIsAssisted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(exercise?.name ?? '');
      setCategory(exercise?.category ?? '');
      setIsAssisted(exercise?.is_assisted ?? false);
      setError(null);
    }
  }, [visible, exercise]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    const input: ExerciseInput = {
      name: trimmed,
      category: category.trim() || null,
      is_assisted: isAssisted,
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
          <TextInput
            style={styles.input}
            placeholder="Category (optional)"
            placeholderTextColor={colors.inkSoft}
            value={category}
            onChangeText={setCategory}
          />
          <View style={styles.row}>
            <Text style={styles.assistedLabel}>Assisted</Text>
            <Switch value={isAssisted} onValueChange={setIsAssisted} />
          </View>
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
    marginBottom: 8,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  assistedLabel: { color: colors.ink },
  error: { color: colors.oxblood, marginTop: 8 },
});
