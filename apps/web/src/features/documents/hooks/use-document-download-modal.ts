import { useState, useCallback } from "react";
import type { DocumentResponse } from "../types/documents.types";

export function useDocumentDownloadModal() {
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);

  const openDownloadModal = useCallback((document: DocumentResponse) => {
    setSelectedDocument(document);
  }, []);

  const closeDownloadModal = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  return {
    selectedDocument,
    openDownloadModal,
    closeDownloadModal,
  };
}
