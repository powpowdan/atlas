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

import { deleteSession, getActiveSession } from '../../db/queries/sessions';
import { useActiveSessionStore } from '../../store/activeSession';
import { confirm } from '../../store/confirm';
import { LogoMark } from '../../components/LogoMark';
import { colors, type } from '../../constants/theme';
import type { SessionListItem } from '../../db/queries/sessions';

export default function SessionsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const activeSessionId = useActiveSessionStore((s) => s.activeSessionId);
  const setActiveSession = useActiveSessionStore((s) => s.setActiveSession);
  const clearActiveSession = useActiveSessionStore((s) => s.clearActiveSession);
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

  async function handleDiscard() {
    if (!active) return;
    const ok = await confirm({
      title: 'Discard session?',
      message:
        'This deletes the in-progress session and all of its sets. This cannot be undone.',
      confirmLabel: 'Discard',
    });
    if (!ok) return;
    await deleteSession(db, active.id);
    if (activeSessionId === active.id) clearActiveSession();
    refresh();
  }

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
          <Pressable style={styles.discardLink} onPress={handleDiscard}>
            <Text style={styles.discardLinkText}>Discard session</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.startCard}>
        <LogoMark size={400} />
        <Text style={styles.wordmark}>ATLAS</Text>
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
  container: { flex: 1, backgroundColor: colors.paper, padding: 16 },
  activeCard: {
    backgroundColor: colors.paperDeep,
    borderRadius: 8,
    padding: 16,
  },
  activeTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  activeMeta: { color: colors.inkSoft, fontSize: 13, marginTop: 4, marginBottom: 16 },
  resumeBtn: {
    backgroundColor: colors.ink,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  resumeBtnText: { color: colors.paper, fontWeight: '600' },
  discardLink: { marginTop: 8, padding: 8, alignItems: 'center' },
  discardLinkText: { color: colors.oxblood, fontWeight: '600' },
  startCard: { alignItems: 'center', marginTop: 24 },
  wordmark: {
    ...type.wordmark,
    fontSize: 22,
    color: colors.ink,
    marginTop: 0,
    marginBottom: 4,
  },
  startHelp: { color: colors.inkSoft, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  startBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  startBtnText: { color: colors.paper, fontWeight: '600' },
});
