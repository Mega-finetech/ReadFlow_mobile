export type DocumentStatus = 'processing' | 'ready' | 'error';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Chapter {
  id: string;
  documentId: string;
  chapterNumber: number;
  title: string;
  estimatedDurationSeconds: number;
  order: number;
  /** Full extracted text; only present on the detailed document fetch. */
  rawText?: string;
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  fileType: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
  _count?: { chapters: number };
}

export interface Progress {
  id: string;
  userId: string;
  documentId: string;
  chapterId?: string;
  positionPercent: number;
  updatedAt: string;
  chapter?: Pick<Chapter, 'id' | 'title' | 'chapterNumber'> | null;
}

export interface Bookmark {
  id: string;
  documentId: string;
  chapterId: string;
  label?: string;
  position: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}
