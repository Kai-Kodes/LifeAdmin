import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { BillFormData } from '../types/bill';

export function useBills(params?: { search?: string; status?: string; sort_by?: string }) {
  return useQuery({
    queryKey: ['bills', params],
    queryFn: () => api.getBills(params),
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: ['bills', id],
    queryFn: () => api.getBill(id),
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, file }: { data: BillFormData; file?: File }) =>
      api.createBill(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillFormData> }) =>
      api.updateBill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useTogglePaidBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.toggleBillPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}
