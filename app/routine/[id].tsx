import { useLocalSearchParams } from 'expo-router';

import RoutineEditor from '../../components/RoutineEditor';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RoutineEditor routineId={id} />;
}
