import { formatDocumentsAsString } from 'langchain/util/document';
import { loadPDFDocs } from './pdfUtils';
import { generateSummary } from './generateSummary';
import { DB } from '../db';

export const createKnowledgeBase = async (url: string) => {
  const db = await DB.getInstance();
  const existingSummary = await db.getTranscriptSummary(url);

  if (existingSummary) {
    return `Already exists a summary for the document at ${url}`;
  }

  const pdfDocs = await loadPDFDocs(url);
  pdfDocs.forEach((doc) => {
    doc.metadata.source = url;
  });

  const summary = await generateSummary(pdfDocs);
  await db.addSummary(summary, url, formatDocumentsAsString(pdfDocs));
  await db.vectorStore.addDocuments(pdfDocs);

  return `Successfully created a knowledge base for the document at ${url}`;
};
