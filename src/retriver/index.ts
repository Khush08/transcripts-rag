import { TranscriptSummary } from '../createKnowledgeBase/types';
import { formatDocumentsAsString } from 'langchain/util/document';
import { DB } from '../db';
import { getAnswers } from './getAwnsers';
import { RetrieverResponse } from './types';

export const retriever = async (
  question: string,
  url: string,
): Promise<RetrieverResponse> => {
  const db = await DB.getInstance();
  const existingQA = await db.getQA(question, url);

  if (existingQA) {
    return {
      answer: existingQA.answer,
      followupQuestions: existingQA.followup_questions,
    };
  }

  const document = await db.getTranscriptSummary(url);
  const relevantContext = await db.vectorStore.similaritySearch(question, 5, {
    source: url,
  });

  if (!document) {
    throw new Error(
      `No record found for the document at ${url}. Please create a knowledge base first.`,
    );
  }

  const qa = await getAnswers(
    question,
    document.summary as unknown as TranscriptSummary,
    relevantContext,
  );

  await db.saveQA(
    question,
    qa.answer,
    formatDocumentsAsString(relevantContext),
    qa.followupQuestions,
    url,
  );

  return qa;
};
