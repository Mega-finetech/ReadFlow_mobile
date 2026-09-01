import { apiRequest } from './client';
import { Progress } from '../types';

export async function saveProgress(input: {
  documentId: string;
  chapterId?: string;
  positionPercent: number;
}): Promise<Progress> {
  const res = await apiRequest<{ data: Progress }>('/progress', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function getProgress(documentId: string): Promise<Progress | null> {
  const res = await apiRequest<{ data: Progress | null }>(`/progress/${documentId}`);
  return res.data;
}
