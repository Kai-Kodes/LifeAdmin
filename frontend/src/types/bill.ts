import type { Attachment } from './obligation';

export interface BillItem {
  id: string;
  name: string;
  due_date: string; // YYYY-MM-DD
  amount: number | null;
  currency: string;
  notes: string | null;
  is_paid: boolean;
  computed_status: 'paid' | 'overdue' | 'due_today' | 'due_soon' | 'upcoming';
  status_label: string;
  days_remaining: number | null;
  attachment: Attachment | null;
  created_at: string;
  updated_at: string;
}

export interface BillFormData {
  name: string;
  due_date: string;
  amount?: number | string;
  currency?: string;
  notes?: string;
  is_paid?: boolean;
}
