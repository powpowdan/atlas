import { Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { TabIcon } from '../../components/TabIcon';

function ManageHeaderButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/exercise/manage')}
      hitSlop={{ top: 16, bottom: 16, left: 24, right: 8 }}
      style={{ paddingHorizontal: 4, paddingVertical: 6 }}
    >
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
          tabBarIcon: ({ color }) => <TabIcon name="barbell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          headerRight: () => <ManageHeaderButton />,
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabIcon name="clock" color={color} />,
        }}
      />
    </Tabs>
  );
}
