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
          value={name}
          onChangeText={setName}
          autoFocus={!isEdit}
        />
        <TextInput
          style={styles.input}
          placeholder="Category (optional)"
          value={category}
          onChangeText={setCategory}
        />
        <View style={styles.row}>
          <Text>Assisted</Text>
          <Switch value={isAssisted} onValueChange={setIsAssisted} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 16, fontWeight: '600' },
  modalCancel: { color: '#555', fontSize: 16 },
  modalDone: { color: '#0a7cff', fontWeight: '600', fontSize: 16 },
  modalDoneDisabled: { color: '#aaa' },
  body: { padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  error: { color: '#c00', marginTop: 8 },
});
