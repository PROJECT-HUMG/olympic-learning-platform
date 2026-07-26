import { apiClient } from "@/lib/axios";
import type {
  DocumentResponse,
  DocumentSearchRequest,
  Page,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentMetadataResponse,
} from "@/features/documents/types/documents.types";
import type { AxiosProgressEvent } from "axios";

export const documentsService = {
  search(params: DocumentSearchRequest) {
    return apiClient.get<Page<DocumentResponse>>("/documents", { params });
  },

  getBySlug(slug: string) {
    return apiClient.get<DocumentResponse>(`/documents/${slug}`);
  },

  getDownloadUri(slug: string, onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void) {
    return apiClient.get(`/documents/${slug}/download`, { 
      responseType: "blob",
      onDownloadProgress,
    }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      
      let filename = `${slug}.pdf`;
      const disposition = res.headers["content-disposition"];
      if (disposition && disposition.indexOf("attachment") !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  incrementViewCount(slug: string) {
    return apiClient.post<void>(`/documents/${slug}/view`);
  },

  create(data: CreateDocumentRequest) {
    return apiClient.post<DocumentResponse>("/documents", data).then((res) => res.data);
  },

  update(id: string, data: UpdateDocumentRequest) {
    return apiClient.put<DocumentResponse>(`/documents/${id}`, data).then((res) => res.data);
  },

  delete(id: string) {
    return apiClient.delete<void>(`/documents/${id}`);
  },

  getMetadata() {
    return apiClient.get<DocumentMetadataResponse>("/documents/metadata").then((res) => res.data);
  },
};
