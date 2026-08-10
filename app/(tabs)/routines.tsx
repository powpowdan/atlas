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

import { listRoutines, RoutineListItem } from '../../db/queries/routines';

export default function RoutinesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [items, setItems] = useState<RoutineListItem[]>([]);

  const refresh = useCallback(async () => {
    const rows = await listRoutines(db);
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
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.listItem}
            onPress={() => router.push(`/routine/${item.id}`)}
          >
            <Text style={styles.listItemName}>{item.name}</Text>
            <Text style={styles.listItemMeta}>
              {item.exercise_count} exercise{item.exercise_count === 1 ? '' : 's'}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No routines yet.</Text>
            <Pressable
              style={styles.button}
              onPress={() => router.push('/routine/new')}
            >
              <Text style={styles.buttonText}>Create your first routine</Text>
            </Pressable>
          </View>
        }
      />
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/routine/new')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { flex: 1 },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemName: { fontSize: 17, fontWeight: '600' },
  listItemMeta: { color: '#666', fontSize: 13, marginTop: 2 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { color: '#999', marginBottom: 16 },
  button: {
    backgroundColor: '#0a7cff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7cff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '400', marginTop: -2 },
});
