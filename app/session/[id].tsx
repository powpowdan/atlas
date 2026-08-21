import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  addExerciseToSession,
  addSet,
  deleteSession,
  deleteSet,
  getSession,
  markSessionComplete,
  restoreSet,
  setSessionNote,
  snapshotSet,
  updateSet,
} from '../../db/queries/sessions';
import { ExercisePickerModal } from '../../components/ExercisePickerModal';
import { RestTimer } from '../../components/RestTimer';
import { SessionSummaryModal } from '../../components/SessionSummaryModal';
import { useExerciseReference } from '../../hooks/useExerciseReference';
import { useActiveSessionStore } from '../../store/activeSession';
import { confirm } from '../../store/confirm';
import { showUndoToast } from '../../store/undo';
import { colors, type } from '../../constants/theme';
import {
  computeSessionSummary,
  getSessionPriors,
} from '../../utils/sessionSummary';
import {
  classifySetDelta,
  formatAgeLabel,
  formatDeltaText,
  formatSummaryLine,
} from '../../utils/referenceSlots';
import { formatWeightLabel } from '../../utils/format';
import { isNewHeaviest, isNewRepPr } from '../../utils/pr';
import type {
  ReferenceSlot,
  SessionDetail,
  WorkoutSet,
} from '../../types';
import type { SessionSummary } from '../../utils/sessionSummary';

export default function SessionScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const clearActiveSession = useActiveSessionStore((s) => s.clearActiveSession);
  const activeSessionId = useActiveSessionStore((s) => s.activeSessionId);

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [sessionNoteDraft, setSessionNoteDraft] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardVisible = keyboardHeight > 0;

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(
      showEvent,
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!id) return;
    const detail = await getSession(db, id);
    setSession(detail);
    setSessionNoteDraft(detail?.note ?? '');
    setLoading(false);
    setRefreshKey((k) => k + 1);
  }, [db, id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/index');
    }
  }

  async function handleAddExercise(exerciseId: string) {
    if (!id) return;
    await addExerciseToSession(db, id, exerciseId);
    refresh();
  }

  function navigateAfterComplete() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/history');
    }
  }

  async function handleComplete() {
    if (!id || !session) return;
    const completedAt = Date.now();
    const priors = await getSessionPriors(db, id, session.exercises);
    const nextSummary = computeSessionSummary(session, priors, completedAt);
    await markSessionComplete(db, id);
    clearActiveSession();
    if (nextSummary.workingSetCount > 0) {
      setSummary(nextSummary);
    } else {
      navigateAfterComplete();
    }
  }

  async function handleDiscard() {
    if (!id) return;
    const ok = await confirm({
      title: 'Discard session?',
      message:
        'This deletes the session and all of its sets. This cannot be undone.',
      confirmLabel: 'Discard',
    });
    if (!ok) return;
    await deleteSession(db, id);
    if (activeSessionId === id) clearActiveSession();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/index');
    }
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <Pressable
          style={styles.backBtn}
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
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

      <View style={[styles.listWrap, { paddingBottom: keyboardHeight }]}>
        <SectionList
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          sections={session.exercises.map(
            (exercise): ExerciseSection => ({
              id: exercise.id,
              exercise,
              data: [exercise.id],
            }),
          )}
          keyExtractor={(item) => item}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <ExerciseHeader
              sessionExercise={section.exercise}
              showRestTimer={session.status === 'in_progress'}
            />
          )}
          renderItem={({ section }) => (
            <ExerciseBody
              sessionExercise={section.exercise}
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
      </View>

      {keyboardVisible ? null : (
        <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
          <Pressable style={styles.completeBtn} onPress={handleComplete}>
            <Text style={styles.completeBtnText}>Complete session</Text>
          </Pressable>
          <Pressable style={styles.discardBtn} onPress={handleDiscard}>
            <Text style={styles.discardBtnText}>Discard</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={noteModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Session note</Text>
          <Pressable onPress={handleSaveNote}>
            <Text style={styles.modalDone}>Save</Text>
          </Pressable>
        </View>
        <View style={styles.noteModalBody}>
          <TextInput
            style={styles.noteInput}
            placeholder="How did the session feel?"
            placeholderTextColor={colors.inkSoft}
            value={sessionNoteDraft}
            onChangeText={setSessionNoteDraft}
            multiline
            autoFocus
          />
        </View>
      </Modal>

      <ExercisePickerModal
        visible={addExerciseOpen}
        excludeIds={session?.exercises.map((ex) => ex.exercise_id)}
        onSelect={(ex) => handleAddExercise(ex.id)}
        onClose={() => setAddExerciseOpen(false)}
      />

      {summary ? (
        <SessionSummaryModal
          title={session.routine_name ?? 'Ad-hoc'}
          summary={summary}
          onDone={() => {
            setSummary(null);
            navigateAfterComplete();
          }}
        />
      ) : null}
    </View>
  );
}

interface ExerciseSection {
  id: string;
  exercise: SessionDetail['exercises'][number];
  data: string[];
}

function ExerciseHeader({
  sessionExercise,
  showRestTimer,
}: {
  sessionExercise: SessionDetail['exercises'][number];
  showRestTimer: boolean;
}) {
  const sets = sessionExercise.sets ?? [];
  const lastSetTs = sets.length > 0 ? sets[sets.length - 1].created_at : null;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.exerciseHeader,
        pressed && styles.exerciseHeaderPressed,
      ]}
      onPress={() => router.push(`/exercise/${sessionExercise.exercise_id}`)}
    >
      <View style={styles.exerciseNameWrap}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {sessionExercise.exercise?.name}
        </Text>
        <Text style={styles.exerciseChevron}>›</Text>
      </View>
      {showRestTimer && lastSetTs != null ? (
        <RestTimer anchorTs={lastSetTs} />
      ) : null}
    </Pressable>
  );
}

interface ExerciseBodyProps {
  sessionExercise: SessionDetail['exercises'][number];
  sessionId: string;
  refreshKey: number;
  onChanged: () => void;
}

function ExerciseBody({
  sessionExercise,
  sessionId,
  refreshKey,
  onChanged,
}: ExerciseBodyProps) {
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

  const nextSetNumber = workingIndexById.size + 1;
  const lastSessionSetCount = bundle.slots.filter((s) => !s.isGhost).length;
  const countLabel = !hasHistory
    ? `Set ${nextSetNumber}`
    : nextSetNumber <= lastSessionSetCount
      ? `Set ${nextSetNumber} of ${lastSessionSetCount}`
      : `Set ${nextSetNumber} — beyond last time`;

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
      Keyboard.dismiss();
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
    const snapshot = await snapshotSet(db, s.id);
    await deleteSet(db, s.id);
    onChanged();
    showUndoToast('Set deleted', async () => {
      if (snapshot) await restoreSet(db, snapshot);
      onChanged();
    });
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
    <View style={styles.exerciseBody}>
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
                  slot.position < nextSetNumber && styles.slotChipDone,
                  slot.position === nextSetNumber && styles.slotChipFocus,
                  pressed && styles.slotChipPressed,
                ]}
              >
                <Text style={styles.slotChipIndex}>{slot.position}.</Text>
                <Text
                  style={[
                    styles.slotChipMain,
                    slot.position === nextSetNumber && styles.slotChipMainFocus,
                  ]}
                >
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

      <Text style={styles.countLabel}>{countLabel}</Text>
      <View style={styles.setEntryRow}>
        <TextInput
          ref={weightRef}
          style={styles.setEntryInput}
          placeholder="Weight"
          placeholderTextColor={colors.inkSoft}
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
          placeholderTextColor={colors.inkSoft}
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
        placeholderTextColor={colors.inkSoft}
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
                  <Text style={styles.prBadgeText}>✦ NEW HEAVIEST</Text>
                </View>
              ) : null}
              {showRepPr ? (
                <View style={styles.prBadge}>
                  <Text style={styles.prBadgeText}>✦ NEW REP PR</Text>
                </View>
              ) : null}
              {s.note ? <Text style={styles.setRowNote}>· {s.note}</Text> : null}
              <Pressable onPress={() => startEdit(s)} style={styles.setIconBtn}>
                <Text>✎</Text>
              </Pressable>
              <Pressable onPress={() => removeSet(s)} style={styles.setIconBtn}>
                <Text style={{ color: colors.oxblood }}>✕</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function deltaColor(tone: 'up' | 'down' | 'flat'): string {
  return tone === 'up' ? colors.verdigris : tone === 'down' ? colors.oxblood : colors.textTertiary;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.paper,
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  backBtnText: { fontSize: 28, lineHeight: 30, color: colors.ink, fontWeight: '600' },
  headerTitle: { ...type.display, fontSize: 18, fontWeight: '700', color: colors.ink },
  headerMeta: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.paperDeep,
    borderRadius: 6,
  },
  headerBtnText: { color: colors.ink, fontWeight: '600' },
  notePreview: {
    backgroundColor: colors.paperWell,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notePreviewText: { color: colors.inkSoft, fontStyle: 'italic' },
  listWrap: { flex: 1 },
  list: { flex: 1 },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 8,
    borderBottomColor: colors.borderSubtle,
  },
  exerciseNameWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  exerciseName: { fontSize: 18, fontWeight: '600', color: colors.verdigris, flexShrink: 1 },
  exerciseChevron: {
    color: colors.verdigris,
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 4,
  },
  exerciseHeaderPressed: { opacity: 0.55 },
  referenceBox: {
    marginBottom: 12,
    backgroundColor: colors.paperWell,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referenceHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSoft,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryLine: { fontSize: 12, color: colors.inkSoft, marginBottom: 6 },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotChip: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  slotChipGhost: { opacity: 0.55, borderColor: colors.borderStrong, borderStyle: 'dashed' },
  slotChipDone: { opacity: 0.5 },
  slotChipFocus: { borderColor: colors.ink, backgroundColor: colors.paperDeep },
  slotChipMainFocus: { fontWeight: '700' },
  slotChipWarm: { backgroundColor: colors.paperWell, borderColor: colors.border },
  slotChipPressed: { backgroundColor: colors.paperDeep, borderColor: colors.ink },
  slotChipIndex: { width: 18, color: colors.textTertiary, fontSize: 14 },
  slotChipMain: { ...type.tabular, fontSize: 14, fontWeight: '500', color: colors.ink },
  slotChipWarmText: { ...type.tabular, color: colors.textDisabled, fontSize: 14 },
  ghostLabel: { fontSize: 10, color: colors.textTertiary },
  chipDelta: { fontSize: 10, fontWeight: '600' },
  notesToggle: { paddingVertical: 4 },
  notesToggleText: { fontSize: 12, color: colors.ink, fontWeight: '600' },
  notesBox: {
    backgroundColor: colors.paper,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    marginTop: 4,
    gap: 4,
  },
  noteRow: { fontSize: 12, color: colors.inkSoft },
  deltaText: { fontSize: 12, fontWeight: '600' },
  prBadge: {
    backgroundColor: colors.brass,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  prBadgeText: { color: colors.paper, fontSize: 10, fontWeight: '700' },
  firstTimeBox: {
    backgroundColor: colors.brassTint,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.brassBorder,
  },
  firstTimeText: { color: colors.brassText, fontSize: 13 },
  countLabel: { fontSize: 12, color: colors.textTertiary, marginBottom: 6 },
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
    fontSize: 16,
    color: colors.ink,
  },
  warmupToggle: {
    alignItems: 'center',
  },
  warmupLabel: { fontSize: 11, color: colors.inkSoft },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
    color: colors.ink,
  },
  error: { color: colors.oxblood, marginBottom: 8 },
  saveRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.inkSoft, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.ink,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnEdit: { flex: 2 },
  saveBtnText: { color: colors.paper, fontWeight: '600' },
  setList: { marginTop: 12 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 4,
  },
  setRowIndex: { ...type.tabular, width: 24, color: colors.textTertiary },
  setRowMain: { ...type.tabular, fontSize: 16, fontWeight: '500', color: colors.ink },
  setRowNote: { flex: 1, color: colors.inkSoft, fontSize: 13 },
  setIconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  empty: { padding: 24, textAlign: 'center', color: colors.textTertiary },
  addExerciseBtn: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.ink,
    borderStyle: 'dashed',
    borderRadius: 6,
    alignItems: 'center',
  },
  addExerciseBtnText: { color: colors.ink, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completeBtn: {
    flex: 2,
    backgroundColor: colors.verdigris,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeBtnText: { color: colors.paper, fontWeight: '700', fontSize: 16 },
  discardBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.oxblood,
  },
  discardBtnText: { color: colors.oxblood, fontWeight: '600', fontSize: 15 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.paper,
  },
  modalTitle: { fontWeight: '600', fontSize: 16, color: colors.ink },
  modalDone: { color: colors.ink, fontWeight: '600' },
  noteModalBody: { padding: 16, flex: 1, backgroundColor: colors.paper },
});
