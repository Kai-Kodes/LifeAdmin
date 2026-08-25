import type { Attachment, DashboardStats, Obligation, ObligationFormData } from '../types/obligation';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An unexpected error occurred' }));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/dashboard'),

  // Obligations
  getObligations: (params?: {
    search?: string;
    category?: string;
    status?: string;
    sort_by?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    const qs = searchParams.toString();
    return request<Obligation[]>(`/obligations${qs ? `?${qs}` : ''}`);
  },

  getObligation: (id: string) => request<Obligation>(`/obligations/${id}`),

  createObligation: (data: ObligationFormData) =>
    request<Obligation>('/obligations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateObligation: (id: string, data: Partial<ObligationFormData>) =>
    request<Obligation>(`/obligations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteObligation: (id: string) =>
    request<void>(`/obligations/${id}`, {
      method: 'DELETE',
    }),

  // Attachments
  uploadAttachment: async (obligationId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/obligations/${obligationId}/attachments`, {
      method: 'POST',
      body: formData,
      // Note: Do NOT set Content-Type header — browser sets it with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || `Upload failed with status ${response.status}`);
    }

    return response.json();
  },

  deleteAttachment: (attachmentId: string) =>
    request<void>(`/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),

  getAttachmentUrl: (attachmentId: string) =>
    `${BASE_URL}/attachments/${attachmentId}/download`,
};

