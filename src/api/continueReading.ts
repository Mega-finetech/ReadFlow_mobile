import { Document, Progress } from '../types';
import { listDocuments } from './documents';
import { getProgress } from './progress';

export interface ContinueReading {
  document: Document;
  progress: Progress;
}

/**
 * Finds the user's most recently read document by fetching progress for each
 * document and choosing the one with the latest save timestamp on the backend.
 * Returns null when the library is empty or nothing has been read yet.
 */
export async function getContinueReading(): Promise<ContinueReading | null> {
  const documents = await listDocuments();
  if (documents.length === 0) return null;

  const withProgress = await Promise.all(
    documents.map(async (document) => {
      try {
        const progress = await getProgress(document.id);
        return progress ? { document, progress } : null;
      } catch {
        return null;
      }
    })
  );

  const read = withProgress.filter((r): r is ContinueReading => r !== null);
  if (read.length === 0) return null;

  read.sort(
    (a, b) =>
      new Date(b.progress.updatedAt).getTime() - new Date(a.progress.updatedAt).getTime()
  );

  return read[0];
}
