import { Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { migrateDb } from '../db/client';
import { colors, fonts } from '../constants/theme';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { UndoToast } from '../components/UndoToast';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName="workout.db" onInit={migrateDb}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.paper },
            headerTitleStyle: { fontFamily: fonts.display, fontWeight: '600' },
            headerTintColor: colors.ink,
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
        </Stack>
        <ConfirmSheet />
        <UndoToast />
      </SQLiteProvider>
    </>
  );
}
