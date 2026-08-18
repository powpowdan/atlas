import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
  markSessionComplete,
  setSessionNote,
  updateSet,
} from '../../db/queries/sessions';
import { ExercisePickerModal } from '../../components/ExercisePickerModal';
import { useExerciseReference } from '../../hooks/useExerciseReference';
import { useActiveSessionStore } from '../../store/activeSession';
import {
  classifySetDelta,
  formatAgeLabel,
  formatDeltaText,
  formatSummaryLine,
} from '../../utils/referenceSlots';
import { formatWeightLabel } from '../../utils/format';
import type {
  BestLastResult,
  ReferenceSlot,
  SessionDetail,
  WorkoutSet,
} from '../../types';

export default function SessionScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const clearActiveSession = useActiveSessionStore((s) => s.clearActiveSession);
  const activeSessionId = useActiveSessionStore((s) => s.activeSessionId);

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [sessionNoteDraft, setSessionNoteDraft] = useState('');

  const refresh = useCallback(async () => {
    if (!id) return;
    const detail = await getSession(db, id);
    setSession(detail);
    if (detail) {
      navigation.setOptions({ title: detail.routine_name ?? 'Session' });
    }
    setSessionNoteDraft(detail?.note ?? '');
    setLoading(false);
    setRefreshKey((k) => k + 1);
  }, [db, id, navigation]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAddExercise(exerciseId: string) {
    if (!id) return;
    await addExerciseToSession(db, id, exerciseId);
    refresh();
  }

  async function handleComplete() {
    if (!id) return;
    await markSessionComplete(db, id);
    clearActiveSession();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/history');
    }
  }

  function handleDiscard() {
    if (!id) return;
    Alert.alert(
      'Discard session?',
      'This deletes the session and all of its sets. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(db, id);
            if (activeSessionId === id) clearActiveSession();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/index');
            }
          },
        },
      ],
    );
  }

  async function handleSaveNote() {
    if (!id) return;
    await setSessionNote(db, id, sessionNoteDraft.trim() || null);
    setNoteModalOpen(false);
    refresh();
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {session.routine_name ?? 'Ad-hoc'}
          </Text>
          <Text style={styles.headerMeta}>
            {new Date(session.started_at).toLocaleDateString()} ·{' '}
            {session.exercises.length} exercise
            {session.exercises.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={() => setNoteModalOpen(true)}>
          <Text style={styles.headerBtnText}>Note</Text>
        </Pressable>
      </View>

      {session.note ? (
        <View style={styles.notePreview}>
          <Text style={styles.notePreviewText}>{session.note}</Text>
        </View>
      ) : null}

      <FlatList
        style={styles.list}
        data={session.exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseBlock
            sessionExercise={item}
            sessionId={session.id}
            refreshKey={refreshKey}
            onChanged={refresh}
          />
        )}
        ListFooterComponent={
          <Pressable
            style={styles.addExerciseBtn}
            onPress={() => setAddExerciseOpen(true)}
          >
            <Text style={styles.addExerciseBtnText}>+ Add exercise</Text>
          </Pressable>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No exercises in this session yet. Add one to start logging.
          </Text>
        }
      />

      <View style={styles.footer}>
        <Pressable style={styles.completeBtn} onPress={handleComplete}>
          <Text style={styles.completeBtnText}>Complete session</Text>
        </Pressable>
        <Pressable style={styles.discardBtn} onPress={handleDiscard}>
          <Text style={styles.discardBtnText}>Discard session</Text>
        </Pressable>
      </View>

      <Modal visible={noteModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Session note</Text>
          <Pressable onPress={handleSaveNote}>
            <Text style={styles.modalDone}>Save</Text>
          </Pressable>
        </View>
        <View style={{ padding: 16, flex: 1 }}>
          <TextInput
            style={styles.noteInput}
            placeholder="How did the session feel?"
            value={sessionNoteDraft}
            onChangeText={setSessionNoteDraft}
            multiline
            autoFocus
          />
        </View>
      </Modal>

      <ExercisePickerModal
        visible={addExerciseOpen}
        onSelect={(ex) => handleAddExercise(ex.id)}
        onClose={() => setAddExerciseOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

interface ExerciseBlockProps {
  sessionExercise: SessionDetail['exercises'][number];
  sessionId: string;
  refreshKey: number;
  onChanged: () => void;
}

function ExerciseBlock({
  sessionExercise,
  sessionId,
  refreshKey,
  onChanged,
}: ExerciseBlockProps) {
  const db = useSQLiteContext();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);

  const { bundle, heaviest, mostReps } = useExerciseReference(
    sessionExercise.exercise_id,
    sessionId,
    refreshKey,
  );

  const hasHistory = bundle.slots.length > 0;

  const workingIndexById = new Map<string, number>();
  (sessionExercise.sets ?? [])
    .filter((s) => !s.is_warmup)
    .forEach((s, i) => workingIndexById.set(s.id, i));

  // Carry-forward on mount: prefill from the most recent set in this session.
  useEffect(() => {
    const sets = sessionExercise.sets ?? [];
    if (sets.length > 0) {
      const last = sets[sets.length - 1];
      setWeight(String(last.weight));
      setReps(String(last.reps));
    }
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSet() {
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
      if (editingSet) {
        await updateSet(db, editingSet.id, {
          weight: weightNum,
          reps: repsNum,
          is_warmup: isWarmup,
          note: note.trim() || null,
        });
        // Return to an empty add form after an edit.
        setWeight('');
        setReps('');
        setNote('');
        setIsWarmup(false);
        setEditingSet(null);
      } else {
        await addSet(db, {
          session_exercise_id: sessionExercise.id,
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
      setError(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save set');
    }
  }

  function startEdit(s: WorkoutSet) {
    setEditingSet(s);
    setWeight(String(s.weight));
    setReps(String(s.reps));
    setIsWarmup(s.is_warmup);
    setNote(s.note ?? '');
  }

  function cancelEdit() {
    setEditingSet(null);
    setWeight('');
    setReps('');
    setNote('');
    setIsWarmup(false);
  }

  async function removeSet(s: WorkoutSet) {
    Alert.alert(
      'Delete set?',
      `${formatWeightLabel(s.weight)} × ${s.reps}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSet(db, s.id);
            onChanged();
          },
        },
      ],
    );
  }

  function copyFromReference(slot: ReferenceSlot) {
    setWeight(String(slot.weight));
    setReps(String(slot.reps));
    repsRef.current?.focus();
  }

  function deltaForSet(s: WorkoutSet) {
    if (!hasHistory || s.is_warmup) return null;
    const slot = bundle.slots[workingIndexById.get(s.id) ?? -1];
    const delta = classifySetDelta({ weight: s.weight, reps: s.reps }, slot);
    return { text: formatDeltaText(delta), color: deltaColor(delta.tone) };
  }

  return (
    <View style={styles.exerciseBlock}>
      <Pressable onPress={() => router.push(`/exercise/${sessionExercise.exercise_id}`)}>
        <Text style={styles.exerciseName}>{sessionExercise.exercise?.name}</Text>
      </Pressable>

      {hasHistory ? (
        <View style={styles.referenceBox}>
          {bundle.latestSessionStartedAt != null ? (
            <Text style={styles.referenceHeader}>
              Last time —{' '}
              {new Date(bundle.latestSessionStartedAt).toLocaleDateString()}
            </Text>
          ) : null}
          {bundle.summary ? (
            <Text style={styles.summaryLine}>
              {formatSummaryLine(bundle.summary)}
            </Text>
          ) : null}
          <View style={styles.slotRow}>
            {bundle.warmups.map((w) => (
              <Pressable
                key={`w-${w.position}`}
                onPress={() => copyFromReference(w)}
                style={({ pressed }) => [
                  styles.slotChip,
                  styles.slotChipWarm,
                  pressed && styles.slotChipPressed,
                ]}
              >
                <Text style={styles.slotChipWarmText}>
                  {formatWeightLabel(w.weight)} × {w.reps} (warm)
                </Text>
              </Pressable>
            ))}
            {bundle.slots.map((slot) => (
              <Pressable
                key={`s-${slot.position}`}
                onPress={() => copyFromReference(slot)}
                style={({ pressed }) => [
                  styles.slotChip,
                  slot.isGhost && styles.slotChipGhost,
                  pressed && styles.slotChipPressed,
                ]}
              >
                <Text style={styles.slotChipIndex}>{slot.position}.</Text>
                <Text style={styles.slotChipMain}>
                  {formatWeightLabel(slot.weight)} × {slot.reps}
                </Text>
                {slot.isGhost ? (
                  <Text style={styles.ghostLabel}>
                    {' '}⟡ {formatAgeLabel(slot.startedAt)}
                  </Text>
                ) : null}
                {slot.prevDelta ? (
                  <Text
                    style={[
                      styles.chipDelta,
                      { color: deltaColor(slot.prevDelta.tone) },
                    ]}
                  >
                    {' '}
                    {formatDeltaText(slot.prevDelta)}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
          {bundle.notesCount > 0 ? (
            <View>
              <Pressable
                style={styles.notesToggle}
                onPress={() => setNotesExpanded((v) => !v)}
              >
                <Text style={styles.notesToggleText}>
                  {notesExpanded ? '⌃' : '⌄'} notes ({bundle.notesCount})
                </Text>
              </Pressable>
              {notesExpanded ? (
                <View style={styles.notesBox}>
                  {bundle.latestSessionNote ? (
                    <Text style={styles.noteRow}>
                      Session{' '}
                      {bundle.latestSessionStartedAt != null
                        ? new Date(bundle.latestSessionStartedAt).toLocaleDateString()
                        : ''}
                      : {bundle.latestSessionNote}
                    </Text>
                  ) : null}
                  {bundle.slots
                    .filter((s) => (s.note ?? '').trim().length > 0)
                    .map((s) => (
                      <Text key={s.position} style={styles.noteRow}>
                        Set {s.position} ({new Date(s.startedAt).toLocaleDateString()}):{' '}
                        {s.note}
                      </Text>
                    ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.firstTimeBox}>
          <Text style={styles.firstTimeText}>
            First time logging this exercise — set a baseline.
          </Text>
        </View>
      )}

      <View style={styles.setEntryRow}>
        <TextInput
          ref={weightRef}
          style={styles.setEntryInput}
          placeholder="Weight"
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => repsRef.current?.focus()}
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          ref={repsRef}
          style={styles.setEntryInput}
          placeholder="Reps"
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={() => saveSet()}
          value={reps}
          onChangeText={setReps}
        />
        <View style={styles.warmupToggle}>
          <Text style={styles.warmupLabel}>Warmup</Text>
          <Switch value={isWarmup} onValueChange={setIsWarmup} />
        </View>
      </View>
      <TextInput
        style={styles.noteInput}
        placeholder="Set note (optional)"
        value={note}
        onChangeText={setNote}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.saveRow}>
        {editingSet ? (
          <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.saveBtn, editingSet && styles.saveBtnEdit]}
          onPress={saveSet}
        >
          <Text style={styles.saveBtnText}>
            {editingSet ? 'Update set' : 'Add set'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.setList}>
        {(sessionExercise.sets ?? []).map((s, idx) => {
          const delta = deltaForSet(s);
          const showHeaviest =
            hasHistory && !s.is_warmup && isNewHeaviest(s, heaviest);
          const showRepPr = hasHistory && !s.is_warmup && isNewRepPr(s, mostReps);
          return (
            <View key={s.id} style={styles.setRow}>
              <Text style={styles.setRowIndex}>{idx + 1}.</Text>
              <Text style={styles.setRowMain}>
                {formatWeightLabel(s.weight)} × {s.reps}
                {s.is_warmup ? '  (warm)' : ''}
              </Text>
              {delta ? (
                <Text style={[styles.deltaText, { color: delta.color }]}>
                  {delta.text}
                </Text>
              ) : null}
              {showHeaviest ? (
                <View style={styles.prBadge}>
                  <Text style={styles.prBadgeText}>NEW HEAVIEST</Text>
                </View>
              ) : null}
              {showRepPr ? (
                <View style={styles.prBadge}>
                  <Text style={styles.prBadgeText}>NEW REP PR</Text>
                </View>
              ) : null}
              {s.note ? <Text style={styles.setRowNote}>· {s.note}</Text> : null}
              <Pressable onPress={() => startEdit(s)} style={styles.setIconBtn}>
                <Text>✎</Text>
              </Pressable>
              <Pressable onPress={() => removeSet(s)} style={styles.setIconBtn}>
                <Text style={{ color: '#c00' }}>✕</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function deltaColor(tone: 'up' | 'down' | 'flat'): string {
  return tone === 'up' ? '#1aa260' : tone === 'down' ? '#c00' : '#999';
}

function isNewHeaviest(s: WorkoutSet, best: BestLastResult | null): boolean {
  if (!best) return false;
  return s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps);
}

function isNewRepPr(s: WorkoutSet, best: BestLastResult | null): boolean {
  if (!best) return false;
  return s.reps > best.reps || (s.reps === best.reps && s.weight > best.weight);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerMeta: { color: '#666', fontSize: 13, marginTop: 2 },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8f0ff',
    borderRadius: 6,
  },
  headerBtnText: { color: '#0a7cff', fontWeight: '600' },
  notePreview: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notePreviewText: { color: '#555', fontStyle: 'italic' },
  list: { flex: 1 },
  exerciseBlock: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f3f3f3',
  },
  exerciseName: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  referenceBox: {
    marginBottom: 12,
    backgroundColor: '#fafcff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#eef2f7',
  },
  referenceHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryLine: { fontSize: 12, color: '#555', marginBottom: 6 },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotChip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e3e8ef',
    alignItems: 'center',
  },
  slotChipGhost: { opacity: 0.55, borderColor: '#ddd', borderStyle: 'dashed' },
  slotChipWarm: { backgroundColor: '#fbfbfb', borderColor: '#eee' },
  slotChipPressed: { backgroundColor: '#e8f0ff', borderColor: '#0a7cff' },
  slotChipIndex: { width: 18, color: '#999', fontSize: 14 },
  slotChipMain: { fontSize: 14, fontWeight: '500' },
  slotChipWarmText: { color: '#aaa', fontSize: 14 },
  ghostLabel: { fontSize: 10, color: '#999' },
  chipDelta: { fontSize: 10, fontWeight: '600' },
  notesToggle: { paddingVertical: 4 },
  notesToggleText: { fontSize: 12, color: '#0a7cff', fontWeight: '600' },
  notesBox: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
    marginTop: 4,
    gap: 4,
  },
  noteRow: { fontSize: 12, color: '#555' },
  deltaText: { fontSize: 12, fontWeight: '600' },
  prBadge: {
    backgroundColor: '#b8860b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  prBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  firstTimeBox: {
    backgroundColor: '#fff8e6',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e3c2',
  },
  firstTimeText: { color: '#8a6d1c', fontSize: 13 },
  setEntryRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  setEntryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  warmupToggle: {
    alignItems: 'center',
  },
  warmupLabel: { fontSize: 11, color: '#666' },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  error: { color: '#c00', marginBottom: 8 },
  saveRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn: {
    flex: 2,
    backgroundColor: '#0a7cff',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnEdit: { flex: 2 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  setList: { marginTop: 12 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 4,
  },
  setRowIndex: { width: 24, color: '#999' },
  setRowMain: { fontSize: 16, fontWeight: '500' },
  setRowNote: { flex: 1, color: '#666', fontSize: 13 },
  setIconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  empty: { padding: 24, textAlign: 'center', color: '#999' },
  addExerciseBtn: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0a7cff',
    borderStyle: 'dashed',
    borderRadius: 6,
    alignItems: 'center',
  },
  addExerciseBtnText: { color: '#0a7cff', fontWeight: '600' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  completeBtn: {
    backgroundColor: '#1aa260',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  discardBtn: {
    marginTop: 8,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  discardBtnText: { color: '#c00', fontWeight: '600' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontWeight: '600', fontSize: 16 },
  modalDone: { color: '#0a7cff', fontWeight: '600' },
});
