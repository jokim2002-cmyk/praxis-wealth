import AsyncStorage from '@react-native-async-storage/async-storage';

export async function resetMigrationFlag() {
  await AsyncStorage.removeItem('praxis_migrated_v1');
  console.log('[Reset] Migration flag cleared. Tables will be recreated with v3 schema (sync_queue).');
}
