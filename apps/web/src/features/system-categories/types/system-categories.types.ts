export interface CategorySummaryResponse {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
}

export interface CreateCategoryRequest {
  code: string;
  name: string;
  description: string;
}

export interface UpdateCategoryRequest {
  code: string;
  name: string;
  description: string;
}

export interface SubjectSummaryResponse {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
}

export interface CreateSubjectRequest {
  code: string;
  name: string;
  description: string;
}

export interface UpdateSubjectRequest {
  code: string;
  name: string;
  description: string;
}

export interface TagSummaryResponse {
  id: string;
  code: string;
  name: string;
  slug: string;
}

export interface CreateTagRequest {
  code: string;
  name: string;
}

export interface UpdateTagRequest {
  code: string;
  name: string;
}
