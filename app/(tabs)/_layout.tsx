import { Tabs } from 'expo-router';

import { TabIcon } from '../../components/TabIcon';
import { colors, type } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
        tabBarStyle: { backgroundColor: colors.paper },
        headerStyle: { backgroundColor: colors.paper },
        headerTitleStyle: type.title,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color }) => <TabIcon name="barbell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
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
