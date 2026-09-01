import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'readflow.auth.token';

let inMemoryToken: string | null = null;

export async function setToken(token: string | null): Promise<void> {
  inMemoryToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  return stored;
}

export async function clearToken(): Promise<void> {
  inMemoryToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}
