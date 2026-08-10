import { Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

function ManageHeaderButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/exercise/manage')}>
      <Text style={{ color: '#0a7cff', fontWeight: '600' }}>Manage</Text>
    </Pressable>
  );
}

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
        options={{
          title: 'Sessions',
          headerRight: () => <ManageHeaderButton />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          headerRight: () => <ManageHeaderButton />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History' }}
      />
    </Tabs>
  );
}
