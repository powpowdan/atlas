import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { deleteSession, getSession } from '../../db/queries/sessions';
import type { SessionDetail } from '../../types';

export default function HistoryDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const detail = await getSession(db, id);
      setSession(detail);
      setLoading(false);
    })();
  }, [db, id]);

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
          </Text>
        </View>
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </Pressable>
      </View>
      {session.note ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{session.note}</Text>
        </View>
      ) : null}
      {session.exercises.map((ex) => (
        <View key={ex.id} style={styles.exerciseBlock}>
          <Text style={styles.exerciseName}>{ex.exercise?.name}</Text>
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
  noteBox: {
    backgroundColor: '#fafafa',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
  },
  noteText: { fontStyle: 'italic', color: '#555' },
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
});
