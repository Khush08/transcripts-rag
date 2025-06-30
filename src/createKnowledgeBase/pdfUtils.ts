import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { Document } from '@langchain/core/documents';

const loadPDFBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from ${url}: ${response.statusText}`);
  }

  return response.blob();
};

const loadPDFDocument = async (blob: Blob): Promise<Document[]> => {
  const loader = new WebPDFLoader(blob);
  const docs = await loader.load();
  return docs;
};

export const loadPDFDocs = async (url: string): Promise<Document[]> => {
  const blob = await loadPDFBlob(url);
  const docs = await loadPDFDocument(blob);
  return docs;
};
