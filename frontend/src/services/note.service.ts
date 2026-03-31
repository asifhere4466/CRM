import api from './api';
import { Note, CreateNoteInput } from '@/types';

export const noteService = {
  async createNote(data: CreateNoteInput): Promise<Note> {
    const response = await api.post<Note>('/notes', data);
    return response.data;
  },

  async getNotesByCustomer(customerId: string): Promise<Note[]> {
    const response = await api.get<Note[]>(`/notes/customer/${customerId}`);
    return response.data;
  },
};
