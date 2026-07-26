import { useMutation } from "@tanstack/react-query";
import { storageService } from "@/features/documents/services/storage.service";
import type { AxiosProgressEvent } from "axios";

export const useUploadFile = () => {
  return useMutation({
    mutationFn: ({
      file,
      folder,
      onUploadProgress,
    }: {
      file: File;
      folder: "DOCUMENT" | "AVATAR";
      onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    }) => storageService.uploadFile(file, folder, onUploadProgress),
  });
};
