import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bookmark } from '../types';

/**
 * Bookmarks store.
 *
 * NOTE: The backend does not yet expose a bookmarks endpoint (planned for a
 * later phase), so this module persists bookmarks locally on-device. The API
 * surface mirrors what a future server-backed module should look like, making
 * it easy to swap the storage layer without changing the screens.
 */

const STORAGE_KEY = 'readflow.bookmarks';

type LocalBookmark = Omit<Bookmark, 'id' | 'createdAt'> & {
  id: string;
  createdAt: string;
};

export async function listBookmarks(): Promise<LocalBookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalBookmark[]) : [];
  } catch {
    return [];
  }
}

export async function addBookmark(
  bookmark: Omit<LocalBookmark, 'id' | 'createdAt'>
): Promise<LocalBookmark> {
  const all = await listBookmarks();
  const entry: LocalBookmark = {
    ...bookmark,
    id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...all];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return entry;
}

export async function removeBookmark(documentId: string, chapterId: string, position: number): Promise<void> {
  const all = await listBookmarks();
  const next = all.filter(
    (b) => !(b.documentId === documentId && b.chapterId === chapterId && b.position === position)
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function isBookmarked(
  documentId: string,
  chapterId: string,
  position: number
): Promise<boolean> {
  const all = await listBookmarks();
  return all.some(
    (b) => b.documentId === documentId && b.chapterId === chapterId && b.position === position
  );
}
