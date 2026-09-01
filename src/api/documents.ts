import { Platform } from 'react-native';
import { apiRequest, ApiError } from './client';
import { Document, Chapter } from '../types';

export async function listDocuments(): Promise<Document[]> {
  const res = await apiRequest<{ data: Document[] }>('/documents');
  return res.data;
}

export async function getDocument(id: string): Promise<Document> {
  const res = await apiRequest<{ data: Document }>(`/documents/${id}`);
  return res.data;
}

export async function getChapters(id: string): Promise<Chapter[]> {
  const res = await apiRequest<{ data: Chapter[] }>(`/documents/${id}/chapters`);
  return res.data;
}

export interface UploadPayload {
  uri: string;
  name: string;
  type: string;
}

export async function uploadDocument(file: UploadPayload): Promise<Document> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web: fetch the URI into a real browser Blob/File so the multipart part
    // carries the original filename + MIME type (multer sees req.file).
    const blob = await (await fetch(file.uri)).blob();
    formData.append('file', new File([blob], file.name, { type: file.type }));
  } else {
    // Native (Android/iOS): React Native's FormData accepts the
    // { uri, name, type } file-object shorthand.
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }

  try {
    const res = await apiRequest<{ data: Document }>('/documents/upload', {
      method: 'POST',
      formData,
    });
    return res.data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Upload failed', 0);
  }
}
