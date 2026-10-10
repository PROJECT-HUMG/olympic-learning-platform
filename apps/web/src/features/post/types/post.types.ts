import type { PublicUserIdentity } from "@/features/user/types/user.types";
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
  expiredAt: string | null;
  pinned: boolean;
  author: PublicUserIdentity | null;
  viewCount: number;
  updatedAt: string;
}

export interface PostDetailResponse extends PostSummaryResponse {
  content: string;
  createdAt: string;
}

export interface PostSearchRequest {
  keyword?: string;
  type?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
  authorId?: string;
  pinned?: boolean;
  expired?: boolean;
}

export interface PostStatusCountsResponse {
  draft: number;
  published: number;
  archived: number;
  expired: number;
}

export type CreatePostRequest = CreatePostInput;
export type UpdatePostRequest = UpdatePostInput;
