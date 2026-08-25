export interface Attachment {
  id: string;
  obligation_id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  download_url: string;
  is_image: boolean;
  created_at: string;
}

export interface Obligation {
  id: string;
  title: string;
  description: string | null;
  category: string;
  provider: string | null;
  purchase_date: string | null;
  expiry_date: string;
  amount: string | null;
  currency: string;
  status: string;
  computed_status: 'active' | 'expiring_soon' | 'urgent' | 'expired' | 'cancelled';
  days_remaining: number;
  notes: string | null;
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
}

export interface ObligationFormData {
  title: string;
  description?: string;
  category: string;
  provider?: string;
  purchase_date?: string;
  expiry_date: string;
  amount?: number | string;
  currency: string;
  notes?: string;
  status?: string;
}
