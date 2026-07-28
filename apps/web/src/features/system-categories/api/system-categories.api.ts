import { apiClient } from "@/lib/axios";
import type {
  CategorySummaryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  SubjectSummaryResponse,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  TagSummaryResponse,
  CreateTagRequest,
  UpdateTagRequest,
} from "../types/system-categories.types";

// ========================
// Document Categories
// ========================

export const createCategory = async (
  request: CreateCategoryRequest,
): Promise<CategorySummaryResponse> => {
  const response = await apiClient.post<CategorySummaryResponse>(
    "/admin/document-categories",
    request,
  );
  return response.data;
};

export const updateCategory = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateCategoryRequest;
}): Promise<CategorySummaryResponse> => {
  const response = await apiClient.put<CategorySummaryResponse>(
    `/admin/document-categories/${id}`,
    data,
  );
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/document-categories/${id}`);
};

// ========================
// Subjects
// ========================

export const createSubject = async (
  request: CreateSubjectRequest,
): Promise<SubjectSummaryResponse> => {
  const response = await apiClient.post<SubjectSummaryResponse>(
    "/admin/subjects",
    request,
  );
  return response.data;
};

export const updateSubject = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateSubjectRequest;
}): Promise<SubjectSummaryResponse> => {
  const response = await apiClient.put<SubjectSummaryResponse>(
    `/admin/subjects/${id}`,
    data,
  );
  return response.data;
};

export const deleteSubject = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/subjects/${id}`);
};

// ========================
// Tags
// ========================

export const createTag = async (
  request: CreateTagRequest,
): Promise<TagSummaryResponse> => {
  const response = await apiClient.post<TagSummaryResponse>(
    "/admin/tags",
    request,
  );
  return response.data;
};

export const updateTag = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateTagRequest;
}): Promise<TagSummaryResponse> => {
  const response = await apiClient.put<TagSummaryResponse>(
    `/admin/tags/${id}`,
    data,
  );
  return response.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/tags/${id}`);
};
