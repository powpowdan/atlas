import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  addExerciseToSession,
  addSet,
  deleteSession,
  deleteSet,
  getSession,
  removeExerciseFromSession,
  restoreSessionExercise,
  restoreSet,
  setSessionNote,
  snapshotSessionExercise,
  snapshotSet,
  updateSet,
} from '../../db/queries/sessions';
import { ExercisePickerModal } from '../../components/ExercisePickerModal';
import { confirm } from '../../store/confirm';
import { showUndoToast } from '../../store/undo';
import { colors, type } from '../../constants/theme';
import { formatDuration, formatWeightLabel } from '../../utils/format';
import type { Exercise, SessionDetail, SessionExercise, WorkoutSet } from '../../types';

type SetFormMode =
  | { kind: 'edit'; set: WorkoutSet }
  | { kind: 'add'; sessionExerciseId: string }
  | null;

export default function HistoryDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formMode, setFormMode] = useState<SetFormMode>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const detail = await getSession(db, id);
      setSession(detail);
      if (detail) {
        navigation.setOptions({
          title: detail.routine_name ?? 'Ad-hoc',
        });
      }
      setLoading(false);
    })();
  }, [db, id, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        session?.status === 'complete' ? (
          <Pressable
            style={styles.headerEditBtn}
            onPress={() => {
              if (editMode) {
                setFormMode(null);
                setError(null);
              }
              setEditMode(!editMode);
            }}
          >
            <Text style={styles.headerEditBtnText}>{editMode ? 'Done' : 'Edit'}</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, session?.status, editMode]);

  async function handleDelete() {
    if (!id || !session) return;
    const ok = await confirm({
      title: 'Delete session?',
      message:
        'This permanently removes the session and all of its sets. This cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    await deleteSession(db, id);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/history');
    }
  }

  async function reload() {
    if (!id) return;
    const detail = await getSession(db, id);
    setSession(detail);
  }

  function openNoteEditor() {
    setNoteDraft(session?.note ?? '');
    setNoteModalOpen(true);
  }

  async function handleSaveNote() {
    if (!id) return;
    await setSessionNote(db, id, noteDraft.trim() || null);
    setNoteModalOpen(false);
    reload();
  }

  function startEditSet(s: WorkoutSet) {
    setFormMode({ kind: 'edit', set: s });
    setWeight(String(s.weight));
    setReps(String(s.reps));
    setIsWarmup(s.is_warmup);
    setNote(s.note ?? '');
    setError(null);
  }

  function startAddSet(sessionExercise: SessionExercise) {
    setFormMode({ kind: 'add', sessionExerciseId: sessionExercise.id });
    const sets = sessionExercise.sets ?? [];
    if (sets.length > 0) {
      const last = sets[sets.length - 1];
      setWeight(String(last.weight));
      setReps(String(last.reps));
    } else {
      setWeight('');
      setReps('');
    }
    setIsWarmup(false);
    setNote('');
    setError(null);
  }

  function cancelForm() {
    setFormMode(null);
    setWeight('');
    setReps('');
    setIsWarmup(false);
    setNote('');
    setError(null);
  }

  async function saveForm() {
    if (!formMode) return;
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);
    if (
      Number.isNaN(weightNum) ||
      weight === '' ||
      Number.isNaN(repsNum) ||
      reps === ''
    ) {
      setError('Weight and reps are required');
      return;
    }
    try {
      if (formMode.kind === 'edit') {
        await updateSet(db, formMode.set.id, {
          weight: weightNum,
          reps: repsNum,
          is_warmup: isWarmup,
          note: note.trim() || null,
        });
        cancelForm();
      } else {
        await addSet(db, {
          session_exercise_id: formMode.sessionExerciseId,
          weight: weightNum,
          reps: repsNum,
          is_warmup: isWarmup,
          note: note.trim() || null,
        });
        // Carry-forward: prefill the next set with the just-added values.
        setWeight(String(weightNum));
        setReps(String(repsNum));
        setNote('');
        setIsWarmup(false);
      }
      Keyboard.dismiss();
      setError(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save set');
    }
  }

  async function handleDeleteSet(s: WorkoutSet) {
    if (formMode?.kind === 'edit' && formMode.set.id === s.id) {
      cancelForm();
    }
    const snapshot = await snapshotSet(db, s.id);
    await deleteSet(db, s.id);
    reload();
    showUndoToast('Set deleted', async () => {
      if (snapshot) await restoreSet(db, snapshot);
      reload();
    });
  }

  async function handleRemoveExercise(ex: SessionExercise) {
    if (formBelongsTo(ex.id)) {
      cancelForm();
    }
    const snapshot = await snapshotSessionExercise(db, ex.id);
    await removeExerciseFromSession(db, ex.id);
    reload();
    showUndoToast('Exercise removed', async () => {
      if (snapshot) {
        await restoreSessionExercise(db, snapshot.exercise, snapshot.sets);
      }
      reload();
    });
  }

  async function handlePickExercise(exercise: Exercise) {
    if (!id) return;
    await addExerciseToSession(db, id, exercise.id);
    reload();
  }

  function formBelongsTo(sessionExerciseId: string): boolean {
    if (!formMode) return false;
    return formMode.kind === 'add'
      ? formMode.sessionExerciseId === sessionExerciseId
      : formMode.set.session_exercise_id === sessionExerciseId;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Session not found.</Text>
      </View>
    );
  }

  const durationMs = session.completed_at
    ? session.completed_at - session.started_at
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerDate}>
            {new Date(session.started_at).toLocaleDateString()}
            {durationMs !== null ? ` · ${formatDuration(durationMs)}` : ''}
          </Text>
        </View>
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </Pressable>
      </View>
      <View style={styles.noteWrap}>
        {session.note ? (
          <Pressable style={styles.noteBox} onPress={openNoteEditor}>
            <Text style={styles.noteText}>{session.note}</Text>
            <Text style={styles.noteEditHint}>Tap to edit</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.noteAddLink} onPress={openNoteEditor}>
            <Text style={styles.noteAddLinkText}>+ Add note</Text>
          </Pressable>
        )}
      </View>
      {session.exercises.map((ex) => (
        <View key={ex.id} style={styles.exerciseBlock}>
          <View style={styles.exerciseTitleRow}>
            <Pressable
              style={({ pressed }) => [
                styles.exerciseNameBtn,
                pressed && styles.exerciseNamePressed,
              ]}
              onPress={() => router.push(`/exercise/${ex.exercise_id}`)}
            >
              <Text style={styles.exerciseName}>{ex.exercise?.name}</Text>
              <Text style={styles.exerciseChevron}>›</Text>
            </Pressable>
            {editMode ? (
              <Pressable
                style={styles.removeExerciseBtn}
                onPress={() => handleRemoveExercise(ex)}
              >
                <Text style={styles.removeExerciseBtnText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
          {(ex.sets ?? []).length === 0 ? (
            <Text style={styles.empty}>No sets logged.</Text>
          ) : (
            (ex.sets ?? []).map((s, idx) => (
              <View key={s.id} style={styles.setRow}>
                <Text style={styles.setRowIndex}>{idx + 1}.</Text>
                <Text style={styles.setRowMain}>
                  {formatWeightLabel(s.weight)} × {s.reps}
                  {s.is_warmup ? '  (warm)' : ''}
                </Text>
                {s.note ? (
                  <Text style={styles.setRowNote}>· {s.note}</Text>
                ) : null}
                {editMode ? (
                  <>
                    <Pressable
                      onPress={() => startEditSet(s)}
                      style={styles.setIconBtn}
                    >
                      <Text>✎</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteSet(s)}
                      style={styles.setIconBtn}
                    >
                      <Text style={{ color: colors.oxblood }}>✕</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ))
          )}
          {editMode && formBelongsTo(ex.id) ? (
            <View style={styles.setForm}>
              <View style={styles.setEntryRow}>
                <TextInput
                  style={styles.setEntryInput}
                  placeholder="Weight"
                  placeholderTextColor={colors.inkSoft}
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
                <TextInput
                  style={styles.setEntryInput}
                  placeholder="Reps"
                  placeholderTextColor={colors.inkSoft}
                  keyboardType="numeric"
                  value={reps}
                  onChangeText={setReps}
                />
                <View style={styles.warmupToggle}>
                  <Text style={styles.warmupLabel}>Warmup</Text>
                  <Switch value={isWarmup} onValueChange={setIsWarmup} />
                </View>
              </View>
              <TextInput
                style={styles.setNoteInput}
                placeholder="Set note (optional)"
                placeholderTextColor={colors.inkSoft}
                value={note}
                onChangeText={setNote}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.saveRow}>
                <Pressable style={styles.cancelBtn} onPress={cancelForm}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={saveForm}>
                  <Text style={styles.saveBtnText}>
                    {formMode?.kind === 'edit' ? 'Update set' : 'Add set'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {editMode && !formBelongsTo(ex.id) ? (
            <Pressable style={styles.addSetBtn} onPress={() => startAddSet(ex)}>
              <Text style={styles.addSetBtnText}>+ Add set</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {editMode ? (
        <Pressable style={styles.addExerciseBtn} onPress={() => setPickerOpen(true)}>
          <Text style={styles.addExerciseBtnText}>+ Add exercise</Text>
        </Pressable>
      ) : null}

      <ExercisePickerModal
        visible={pickerOpen}
        excludeIds={session.exercises.map((ex) => ex.exercise_id)}
        onSelect={handlePickExercise}
        onClose={() => setPickerOpen(false)}
      />

      <Modal
        visible={noteModalOpen}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        onRequestClose={() => setNoteModalOpen(false)}
      >
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setNoteModalOpen(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.modalTitle}>Session note</Text>
          <Pressable onPress={handleSaveNote}>
            <Text style={styles.modalDone}>Save</Text>
          </Pressable>
        </View>
        <View style={{ padding: 16, flex: 1, backgroundColor: colors.paper }}>
          <TextInput
            style={styles.noteInput}
            placeholder="How did the session feel?"
            placeholderTextColor={colors.inkSoft}
            value={noteDraft}
            onChangeText={setNoteDraft}
            multiline
            autoFocus
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerDate: { ...type.heading, color: colors.ink },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.oxblood,
    borderRadius: 6,
  },
  deleteBtnText: { ...type.action, color: colors.oxblood },
  noteWrap: { marginHorizontal: 16, marginTop: 12 },
  noteBox: {
    backgroundColor: colors.paperWell,
    padding: 12,
    borderRadius: 6,
  },
  noteText: { ...type.body, fontStyle: 'italic', color: colors.inkSoft },
  noteEditHint: {
    ...type.caption,
    color: colors.ink,
    marginTop: 6,
    textAlign: 'right',
  },
  noteAddLink: { paddingVertical: 6 },
  noteAddLinkText: { ...type.action, color: colors.ink },
  exerciseBlock: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: colors.borderSubtle,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  exerciseNameBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  exerciseNamePressed: { opacity: 0.55 },
  exerciseName: { ...type.heading, color: colors.verdigris },
  exerciseChevron: { ...type.heading, color: colors.verdigris },
  removeExerciseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.oxblood,
    borderRadius: 6,
  },
  removeExerciseBtnText: { ...type.action, color: colors.oxblood },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  setRowIndex: { ...type.stat, width: 24, color: colors.textTertiary },
  setRowMain: { ...type.stat, color: colors.ink },
  setRowNote: { ...type.meta, flex: 1, color: colors.inkSoft },
  setIconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  setForm: { marginTop: 8 },
  setEntryRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  setEntryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    padding: 10,
    ...type.body,
    color: colors.ink,
  },
  warmupToggle: { alignItems: 'center' },
  warmupLabel: { ...type.caption, color: colors.inkSoft },
  setNoteInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    padding: 10,
    ...type.body,
    marginBottom: 8,
    color: colors.ink,
  },
  error: { ...type.body, color: colors.oxblood, marginBottom: 8 },
  saveRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  cancelBtnText: { ...type.action, color: colors.inkSoft },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.ink,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: { ...type.cta, color: colors.paper },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    padding: 10,
    minHeight: 120,
    textAlignVertical: 'top',
    ...type.body,
    color: colors.ink,
  },
  addSetBtn: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    borderRadius: 6,
    alignItems: 'center',
  },
  addSetBtnText: { ...type.action, color: colors.inkSoft },
  addExerciseBtn: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.ink,
    borderStyle: 'dashed',
    borderRadius: 6,
    alignItems: 'center',
  },
  addExerciseBtnText: { ...type.action, color: colors.ink },
  headerEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.paperDeep,
    borderRadius: 6,
  },
  headerEditBtnText: { ...type.action, color: colors.ink },
  empty: { ...type.body, padding: 12, color: colors.textTertiary, textAlign: 'center' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.paper,
  },
  modalTitle: { ...type.modalTitle, color: colors.ink },
  modalCancel: { ...type.action, color: colors.inkSoft },
  modalDone: { ...type.cta, color: colors.ink },
});
