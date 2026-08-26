import type { Attachment, DashboardStats, Obligation, ObligationFormData } from '../types/obligation';
import type { DocumentItem } from '../types/document';
import type { BillItem, BillFormData } from '../types/bill';

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

  // Documents
  getDocuments: (params?: { search?: string; sort_by?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    const qs = searchParams.toString();
    return request<DocumentItem[]>(`/documents${qs ? `?${qs}` : ''}`);
  },

  getDocument: (id: string) => request<DocumentItem>(`/documents/${id}`),

  createDocument: async (name: string, file: File, renewalDate?: string): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('name', name);
    if (renewalDate) formData.append('renewal_date', renewalDate);
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || `Upload failed with status ${response.status}`);
    }

    return response.json();
  },

  updateDocument: (
    id: string,
    data: { name?: string; renewal_date?: string; clear_renewal_date?: boolean }
  ) =>
    request<DocumentItem>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  replaceDocumentFile: async (id: string, file: File): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/documents/${id}/file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'File replacement failed' }));
      throw new Error(error.detail || `Replacement failed with status ${response.status}`);
    }

    return response.json();
  },

  deleteDocument: (id: string) =>
    request<void>(`/documents/${id}`, {
      method: 'DELETE',
    }),

  getDocumentDownloadUrl: (id: string) => `${BASE_URL}/documents/${id}/download`,

  // Bills
  getBills: (params?: { search?: string; status?: string; sort_by?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    const qs = searchParams.toString();
    return request<BillItem[]>(`/bills${qs ? `?${qs}` : ''}`);
  },

  getBill: (id: string) => request<BillItem>(`/bills/${id}`),

  createBill: async (data: BillFormData, file?: File): Promise<BillItem> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('due_date', data.due_date);
    if (data.amount !== undefined && data.amount !== '') formData.append('amount', String(data.amount));
    if (data.currency) formData.append('currency', data.currency);
    if (data.notes) formData.append('notes', data.notes);
    if (file) formData.append('file', file);

    const response = await fetch(`${BASE_URL}/bills`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Creation failed' }));
      throw new Error(error.detail || `Bill creation failed with status ${response.status}`);
    }

    return response.json();
  },

  updateBill: (id: string, data: Partial<BillFormData>) =>
    request<BillItem>(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleBillPaid: (id: string) =>
    request<BillItem>(`/bills/${id}/toggle-paid`, {
      method: 'PATCH',
    }),

  deleteBill: (id: string) =>
    request<void>(`/bills/${id}`, {
      method: 'DELETE',
    }),
};

