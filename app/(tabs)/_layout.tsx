import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0a7cff',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Sessions' }}
      />
      <Tabs.Screen
        name="routines"
        options={{ title: 'Routines' }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History' }}
      />
    </Tabs>
  );
}
