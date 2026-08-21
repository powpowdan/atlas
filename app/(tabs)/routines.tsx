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

import {
  deleteRoutine,
  listRoutines,
  RoutineListItem,
} from '../../db/queries/routines';
import { LogoMark } from '../../components/LogoMark';
import { confirm } from '../../store/confirm';
import { colors } from '../../constants/theme';

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

  const confirmDelete = useCallback(
    async (item: RoutineListItem) => {
      const ok = await confirm({
        title: 'Delete routine?',
        message: `"${item.name}" and its exercise list will be permanently removed.`,
        detail: 'Logged sessions are kept. This cannot be undone.',
        confirmLabel: 'Delete',
      });
      if (!ok) return;
      await deleteRoutine(db, item.id);
      refresh();
    },
    [db, refresh],
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
            onLongPress={() => confirmDelete(item)}
          >
            <Text style={styles.listItemName}>{item.name}</Text>
            <Text style={styles.listItemMeta}>
              {item.exercise_count} exercise{item.exercise_count === 1 ? '' : 's'}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <LogoMark size={200} />
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
      <View style={styles.libraryStrip}>
        <Pressable
          style={styles.libraryRow}
          onPress={() => router.push('/exercise/manage')}
        >
          <Text style={styles.libraryLabel}>Exercise library</Text>
          <Text style={styles.libraryChevron}>›</Text>
        </Pressable>
      </View>
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
  container: { flex: 1, backgroundColor: colors.paper },
  list: { flex: 1 },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemName: { fontSize: 17, fontWeight: '600', color: colors.ink },
  listItemMeta: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  libraryStrip: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.paperDeep,
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  libraryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
    letterSpacing: 0.5,
  },
  libraryChevron: { color: colors.textTertiary, fontSize: 16 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { color: colors.textTertiary, marginBottom: 16, marginTop: 12 },
  button: {
    backgroundColor: colors.ink,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonText: { color: colors.paper, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 68,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: colors.paper, fontSize: 28, fontWeight: '400', marginTop: -2 },
});
