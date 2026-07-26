import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsService } from "@/features/documents/services/documents.service";
import type { 
  DocumentSearchRequest,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from "@/features/documents/types/documents.types";
import type { AxiosProgressEvent } from "axios";

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters: DocumentSearchRequest) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (slug: string) => [...documentKeys.details(), slug] as const,
};

export const useSearchDocuments = (filters: DocumentSearchRequest) => {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => documentsService.search(filters).then((res) => res.data),
  });
};

export const useDocumentBySlug = (slug: string) => {
  return useQuery({
    queryKey: documentKeys.detail(slug),
    queryFn: () => documentsService.getBySlug(slug).then((res) => res.data),
    enabled: !!slug,
  });
};

export const useIncrementViewCount = () => {
  return useMutation({
    mutationFn: (slug: string) => documentsService.incrementViewCount(slug),
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: ({ slug, onDownloadProgress }: { slug: string; onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void }) => 
      documentsService.getDownloadUri(slug, onDownloadProgress),
  });
};

// --- ADMIN HOOKS ---

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentRequest) => documentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentRequest }) =>
      documentsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
};

export const useDocumentMetadata = () => {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: () => documentsService.getMetadata(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};
