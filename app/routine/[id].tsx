import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';

import RoutineEditor from '../../components/RoutineEditor';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  useEffect(() => {
    // Placeholder until RoutineEditor updates with the actual name after load.
    navigation.setOptions({ title: 'Edit routine' });
  }, []);
  return <RoutineEditor routineId={id} />;
}
