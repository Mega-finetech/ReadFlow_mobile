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

/**
 * MIME types accepted by the backend upload contract (must match exactly,
 * see allowedTypes in the backend upload middleware).
 */
const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub',
  'application/epub+zip',
];

const MIME_BY_EXTENSION: Record<string, string> = {
  txt: 'text/plain',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  epub: 'application/epub+zip',
};

/**
 * Android document providers frequently report an empty/null MIME type, and
 * React Native's native multipart builder aborts the whole request when a
 * binary FormData part has an empty content-type header (MediaType.parse('')
 * returns null, so the request never leaves the device). Derive a supported
 * MIME type from the original filename extension when the picker's value is
 * unusable so the part always carries a valid content-type header.
 */
function resolveFileType(name: string, type: unknown): string {
  const provided = typeof type === 'string' ? type.trim().toLowerCase() : '';
  if (provided && SUPPORTED_MIME_TYPES.includes(provided)) {
    return provided;
  }
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext in MIME_BY_EXTENSION) {
    return MIME_BY_EXTENSION[ext];
  }
  return provided || 'application/octet-stream';
}

export async function uploadDocument(file: UploadPayload): Promise<Document> {
  const fileType = resolveFileType(file.name, file.type);
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web: fetch the URI into a real browser Blob/File so the multipart part
    // carries the original filename + MIME type (multer sees req.file).
    const blob = await (await fetch(file.uri)).blob();
    formData.append('file', new File([blob], file.name, { type: fileType }));
  } else {
    // Native (Android/iOS): React Native's FormData accepts the
    // { uri, name, type } file-object shorthand.
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: fileType,
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
