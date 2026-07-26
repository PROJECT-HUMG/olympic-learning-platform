import { apiClient } from "@/lib/axios";
import type { AxiosProgressEvent } from "axios";
import type { StorageUploadResponse } from "@/features/documents/types/documents.types";

export const storageService = {
  uploadFile(
    file: File,
    folder: "DOCUMENT" | "AVATAR",
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    return apiClient
      .post<StorageUploadResponse>("/storage/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      })
      .then((res) => res.data);
  },
};
