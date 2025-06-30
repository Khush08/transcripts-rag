import { Document } from '@langchain/core/documents';
import { TranscriptSummary } from '../createKnowledgeBase/types';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { formatDocumentsAsString } from 'langchain/util/document';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { TranscriptQA } from './types';

const getQuestionTemplate = () =>
  ChatPromptTemplate.fromTemplate(
    `Given the concall transcript, answer the question based on the provided information.

    Here is the key information from the transcript:
    {summary}

    And here are some relevant parts of the transcript relating to their question:
    {context}

    Question: {question}

    Answer the question in the context of the transcript. You should also suggest followup questions.
    Think through and reply carefully, step by step.
    `,
  );

const getOutputStructure = () =>
  z.object({
    answer: z
      .string()
      .describe('Answer to the question based on the transcript'),
    followupQuestions: z
      .array(z.string())
      .describe('Suggested followup questions based on the answer'),
  });

export const getAnswers = async (
  question: string,
  summary: TranscriptSummary,
  context: Document[],
): Promise<TranscriptQA> => {
  const questionTemplate = getQuestionTemplate();

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
  });
  const llmWithSchema = llm.withStructuredOutput(getOutputStructure());
  const chain = questionTemplate.pipe(llmWithSchema);

  return chain.invoke({
    question,
    summary,
    context: formatDocumentsAsString(context),
  });
};
