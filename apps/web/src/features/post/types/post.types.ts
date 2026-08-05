import type { CreatePostInput, UpdatePostInput } from "../schemas/post.schema";

export type PostType = "BLOG" | "NEWS" | "ANNOUNCEMENT";
export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  thumbnailId?: string | null;
  type: PostType;
  status: PostStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostSummaryResponse {
  id: string;
  title: string;
  slug: string;
  summary: string;
  type: string;
  status: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  author: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  viewCount: number;
}

export interface PostDetailResponse extends PostSummaryResponse {
  content: string;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostSearchRequest {
  keyword?: string;
  type?: string;
  status?: string;
  authorId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export type CreatePostRequest = CreatePostInput;
export type UpdatePostRequest = UpdatePostInput;
