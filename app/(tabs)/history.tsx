import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listSessions, SessionListItem } from '../../db/queries/sessions';
import { useActiveSessionStore } from '../../store/activeSession';

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [items, setItems] = useState<SessionListItem[]>([]);
  const activeSessionId = useActiveSessionStore((s) => s.activeSessionId);

  const refresh = useCallback(async () => {
    const rows = await listSessions(db, { status: 'complete' });
    setItems(rows);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.listItem}
            onPress={() => router.push(`/history/${item.id}`)}
          >
            <Text style={styles.listItemDate}>
              {new Date(item.started_at).toLocaleDateString()}
            </Text>
            <Text style={styles.listItemMeta}>
              {item.routine_name ?? 'Ad-hoc'} · {item.exercise_count} exercise
              {item.exercise_count === 1 ? '' : 's'}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>
              No completed sessions yet. Start one from the Sessions tab.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemDate: { fontSize: 16, fontWeight: '600' },
  listItemMeta: { color: '#666', fontSize: 13, marginTop: 2 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { color: '#999', textAlign: 'center' },
});
