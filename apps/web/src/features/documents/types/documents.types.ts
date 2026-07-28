import type { UserProfile } from "@/features/user/types/user.types";
import type { 
  CategorySummaryResponse, 
  SubjectSummaryResponse, 
  TagSummaryResponse 
} from "@/features/system-categories/types/system-categories.types";

export interface DocumentResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  viewCount: number;
  downloadCount: number;
  downloadUrl?: string | null;
  thumbnailUrl?: string | null;
  category: CategorySummaryResponse;
  subject: SubjectSummaryResponse;
  tags: TagSummaryResponse[];
  owner: UserProfile;
  createdAt: string;
}

export interface DocumentSearchRequest {
  keyword?: string;
  categoryId?: string;
  subjectId?: string;
  tagIds?: string[];
  page?: number;
  size?: number;
  ownerId?: string;
}

export interface CreateDocumentRequest {
  title: string;
  description: string;
  categoryId: string;
  subjectId: string;
  tagIds: string[];
  fileId: string;
}

export interface UpdateDocumentRequest {
  title: string;
  description: string;
  categoryId: string;
  subjectId: string;
  tagIds: string[];
}

export interface DocumentMetadataResponse {
  categories: CategorySummaryResponse[];
  subjects: SubjectSummaryResponse[];
  tags: TagSummaryResponse[];
}

export interface StorageUploadResponse {
  id: string;
  url: string;
}

export interface Page<T> {
  content: T[];
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}
