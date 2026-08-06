import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { migrateDb } from '../db/client';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName="workout.db" onInit={migrateDb}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SQLiteProvider>
    </>
  );
}
