import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listRoutines, RoutineListItem } from '../../db/queries/routines';
import { startSessionAdhoc, startSessionFromRoutine } from '../../db/queries/sessions';
import { useActiveSessionStore } from '../../store/activeSession';

export default function NewSessionScreen() {
  const db = useSQLiteContext();
  const [routines, setRoutines] = useState<RoutineListItem[]>([]);
  const setActiveSession = useActiveSessionStore((s) => s.setActiveSession);

  useEffect(() => {
    (async () => setRoutines(await listRoutines(db)))();
  }, [db]);

  async function handleFromRoutine(id: string) {
    const session = await startSessionFromRoutine(db, id);
    setActiveSession(session.id);
    router.replace(`/session/${session.id}`);
  }

  async function handleAdhoc() {
    const session = await startSessionAdhoc(db);
    setActiveSession(session.id);
    router.replace(`/session/${session.id}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Start a session</Text>
      <Pressable style={styles.primaryBtn} onPress={handleAdhoc}>
        <Text style={styles.primaryBtnText}>Ad-hoc (no routine)</Text>
      </Pressable>
      <Text style={styles.subheading}>…or pick a routine</Text>
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.routineItem}
            onPress={() => handleFromRoutine(item.id)}
          >
            <Text style={styles.routineName}>{item.name}</Text>
            <Text style={styles.routineMeta}>
              {item.exercise_count} exercise{item.exercise_count === 1 ? '' : 's'}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No routines yet. Go to the Routines tab to create one.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  primaryBtn: {
    backgroundColor: '#0a7cff',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  subheading: {
    marginTop: 24,
    marginBottom: 8,
    fontWeight: '600',
    color: '#666',
  },
  routineItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  routineName: { fontSize: 16, fontWeight: '600' },
  routineMeta: { color: '#666', fontSize: 13, marginTop: 2 },
  empty: { padding: 16, color: '#999', textAlign: 'center' },
});
