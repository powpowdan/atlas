import { useNavigation } from 'expo-router';
import { useEffect } from 'react';

import RoutineEditor from '../../components/RoutineEditor';

export default function NewRoutineScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({ title: 'New routine' });
  }, []);
  return <RoutineEditor />;
}
