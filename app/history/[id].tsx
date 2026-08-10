import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { deleteSession, getSession, setSessionNote } from '../../db/queries/sessions';
import type { SessionDetail } from '../../types';

function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function HistoryDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

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
          title: detail.routine_name ?? 'Past session',
        });
      }
      setLoading(false);
    })();
  }, [db, id, navigation]);

  function handleDelete() {
    if (!id || !session) return;
    Alert.alert(
      'Delete session?',
      'This permanently removes the session and all of its sets. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(db, id);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/history');
            }
          },
        },
      ],
    );
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
          <Text style={styles.title}>
            {session.routine_name ?? 'Ad-hoc'}
          </Text>
          <Text style={styles.meta}>
            {new Date(session.started_at).toLocaleDateString()}
            {session.completed_at
              ? ` · completed ${new Date(session.completed_at).toLocaleDateString()}`
              : ''}
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
          <Pressable onPress={() => router.push(`/exercise/${ex.exercise_id}`)}>
            <Text style={styles.exerciseName}>{ex.exercise?.name}</Text>
          </Pressable>
          {(ex.sets ?? []).length === 0 ? (
            <Text style={styles.empty}>No sets logged.</Text>
          ) : (
            (ex.sets ?? []).map((s, idx) => (
              <View key={s.id} style={styles.setRow}>
                <Text style={styles.setRowIndex}>{idx + 1}.</Text>
                <Text style={styles.setRowMain}>
                  {s.weight} × {s.reps}
                  {s.is_warmup ? '  (warm)' : ''}
                </Text>
                {s.note ? (
                  <Text style={styles.setRowNote}>· {s.note}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      ))}

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
        <View style={{ padding: 16, flex: 1 }}>
          <TextInput
            style={styles.noteInput}
            placeholder="How did the session feel?"
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 20, fontWeight: '700' },
  meta: { color: '#666', fontSize: 13, marginTop: 4 },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d33',
    borderRadius: 6,
  },
  deleteBtnText: { color: '#c00', fontWeight: '600' },
  noteWrap: { marginHorizontal: 16, marginTop: 12 },
  noteBox: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 6,
  },
  noteText: { fontStyle: 'italic', color: '#555' },
  noteEditHint: {
    color: '#0a7cff',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  noteAddLink: { paddingVertical: 6 },
  noteAddLinkText: { color: '#0a7cff', fontWeight: '500' },
  exerciseBlock: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f3f3f3',
  },
  exerciseName: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  setRowIndex: { width: 24, color: '#999' },
  setRowMain: { fontSize: 16, fontWeight: '500' },
  setRowNote: { flex: 1, color: '#666', fontSize: 13 },
  empty: { padding: 12, color: '#999', textAlign: 'center' },
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
  noteInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
