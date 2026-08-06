import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getActiveSession } from '../../db/queries/sessions';
import { useActiveSessionStore } from '../../store/activeSession';
import type { SessionListItem } from '../../db/queries/sessions';

export default function SessionsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const activeSessionId = useActiveSessionStore((s) => s.activeSessionId);
  const setActiveSession = useActiveSessionStore((s) => s.setActiveSession);
  const setHydrated = useActiveSessionStore((s) => s.setHydrated);
  const hydrated = useActiveSessionStore((s) => s.hydrated);

  const [active, setActive] = useState<SessionListItem | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    setChecking(true);
    const found = await getActiveSession(db);
    setActive(found);
    if (found) {
      setActiveSession(found.id);
    }
    setHydrated(true);
    setChecking(false);
  }, [db, setActiveSession, setHydrated]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (checking || !hydrated) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (active) {
    return (
      <View style={styles.container}>
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>
            {active.routine_name ?? 'Ad-hoc session'}
          </Text>
          <Text style={styles.activeMeta}>
            Started {new Date(active.started_at).toLocaleString()} ·{' '}
            {active.exercise_count} exercise
            {active.exercise_count === 1 ? '' : 's'}
          </Text>
          <Pressable
            style={styles.resumeBtn}
            onPress={() => router.push(`/session/${active.id}`)}
          >
            <Text style={styles.resumeBtnText}>Resume session</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.startCard}>
        <Text style={styles.startTitle}>No active session</Text>
        <Text style={styles.startHelp}>
          Start a new workout, either from a routine or ad-hoc.
        </Text>
        <Pressable
          style={styles.startBtn}
          onPress={() => router.push('/session/new')}
        >
          <Text style={styles.startBtnText}>Start a session</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  activeCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
  },
  activeTitle: { fontSize: 18, fontWeight: '700' },
  activeMeta: { color: '#555', fontSize: 13, marginTop: 4, marginBottom: 16 },
  resumeBtn: {
    backgroundColor: '#0a7cff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  resumeBtnText: { color: '#fff', fontWeight: '600' },
  startCard: { alignItems: 'center', marginTop: 24 },
  startTitle: { fontSize: 18, fontWeight: '600' },
  startHelp: { color: '#666', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  startBtn: {
    backgroundColor: '#0a7cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  startBtnText: { color: '#fff', fontWeight: '600' },
});
