import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createExercise, listExercises } from '../../db/queries/exercises';
import type { Exercise } from '../../types';

export default function ManageExercisesScreen() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isAssisted, setIsAssisted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const rows = await listExercises(db);
    setItems(rows);
  }

  useEffect(() => {
    refresh();
  }, [db]);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    try {
      await createExercise(db, {
        name: trimmed,
        category: category.trim() || null,
        is_assisted: isAssisted,
      });
      setName('');
      setCategory('');
      setIsAssisted(false);
      setError(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add exercise');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Exercise name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Category (optional)"
          value={category}
          onChangeText={setCategory}
        />
        <View style={styles.row}>
          <Text>Assisted</Text>
          <Switch value={isAssisted} onValueChange={setIsAssisted} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Add exercise</Text>
        </Pressable>
      </View>
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemName}>{item.name}</Text>
            <Text style={styles.listItemMeta}>
              {item.category ?? '—'}
              {item.is_assisted ? ' · assisted' : ''}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No exercises yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  form: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  error: { color: '#c00', marginBottom: 8 },
  button: {
    backgroundColor: '#0a7cff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  list: { flex: 1 },
  listItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listItemName: { fontSize: 16, fontWeight: '500' },
  listItemMeta: { color: '#666', fontSize: 13, marginTop: 2 },
  empty: { padding: 24, textAlign: 'center', color: '#999' },
});
