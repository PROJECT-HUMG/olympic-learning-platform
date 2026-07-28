import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "@/features/documents/hooks/use-documents";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubject,
  updateSubject,
  deleteSubject,
  createTag,
  updateTag,
  deleteTag,
} from "../api/system-categories.api";
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  CreateTagRequest,
  UpdateTagRequest,
} from "../types/system-categories.types";

// We invalidate documentKeys.all because getMetadata() returns all metadata
// and it's currently cached under documentKeys.all

// ========================
// Categories
// ========================

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategory({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

// ========================
// Subjects
// ========================

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubjectRequest) => createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectRequest }) =>
      updateSubject({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

// ========================
// Tags
// ========================

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagRequest) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagRequest }) =>
      updateTag({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};
