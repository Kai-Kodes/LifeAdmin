import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ObligationFormData } from '../types/obligation';
import { api } from '../services/api';

// Query keys
const keys = {
  dashboard: ['dashboard'] as const,
  obligations: ['obligations'] as const,
  obligationList: (params: Record<string, string | undefined>) =>
    ['obligations', 'list', params] as const,
  obligation: (id: string) => ['obligations', id] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: api.getDashboardStats,
  });
}

export function useObligations(params?: {
  search?: string;
  category?: string;
  status?: string;
  sort_by?: string;
}) {
  return useQuery({
    queryKey: keys.obligationList(params ?? {}),
    queryFn: () => api.getObligations(params),
  });
}

export function useObligation(id: string) {
  return useQuery({
    queryKey: keys.obligation(id),
    queryFn: () => api.getObligation(id),
    enabled: !!id,
  });
}

export function useCreateObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ObligationFormData) => api.createObligation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.obligations });
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useUpdateObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ObligationFormData> }) =>
      api.updateObligation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.obligations });
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useDeleteObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteObligation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.obligations });
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ obligationId, file }: { obligationId: string; file: File }) =>
      api.uploadAttachment(obligationId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.obligation(variables.obligationId) });
      queryClient.invalidateQueries({ queryKey: keys.obligations });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => api.deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.obligations });
    },
  });
}

