export interface DocumentItem {
  id: string;
  name: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  formatted_file_size: string;
  renewal_date: string | null;
  computed_status: 'active' | 'expiring_soon' | 'urgent' | 'expired' | null;
  renewal_status_label: string | null;
  days_remaining: number | null;
  download_url: string;
  is_image: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentFormData {
  name: string;
  has_renewal_date: boolean;
  renewal_date?: string;
}
