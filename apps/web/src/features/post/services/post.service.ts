import { apiClient } from "@/lib/axios";

import type { Page } from "@/types/api.types";
import type {
  PostSummaryResponse,
  PostDetailResponse,
  CreatePostRequest,
  UpdatePostRequest,
  PostSearchRequest,
  PostStatusCountsResponse,
} from "../types/post.types";

export const postService = {
  getAll(params?: PostSearchRequest) {
    return apiClient
      .get<Page<PostSummaryResponse>>("/posts", { params })
      .then((res) => res.data);
  },

  getById(id: string) {
    return apiClient
      .get<PostDetailResponse>(`/posts/${id}`)
      .then((res) => res.data);
  },

  getBySlug(slug: string) {
    return apiClient
      .get<PostDetailResponse>(`/posts/slug/${slug}`)
      .then((res) => res.data);
  },

  getManagement(params?: PostSearchRequest) {
    return apiClient
      .get<Page<PostSummaryResponse>>("/posts/management", { params })
      .then((res) => res.data);
  },

  getManagementStatusCounts() {
    return apiClient
      .get<PostStatusCountsResponse>("/posts/management/status-counts")
      .then((res) => res.data);
  },

  create(data: CreatePostRequest) {
    return apiClient
      .post<PostDetailResponse>("/posts", data)
      .then((res) => res.data);
  },

  update(id: string, data: UpdatePostRequest) {
    return apiClient
      .put<PostDetailResponse>(`/posts/${id}`, data)
      .then((res) => res.data);
  },

  delete(id: string) {
    return apiClient
      .delete<void>(`/posts/${id}`)
      .then((res) => res.data);
  },
};
