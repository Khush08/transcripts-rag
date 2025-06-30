import { Document } from '@langchain/core/documents';
import { formatDocumentsAsString } from 'langchain/util/document';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';

const getSummaryTemplate = () =>
  ChatPromptTemplate.fromTemplate(
    `Given the concalls transcript, Extract key financial and qualitative insights.
        Input: Complete, raw text of an concall transcript.

        Output Format: Markdown with headings/bullets. Include sections only if sufficient info.

        {content}

      Analyze the transcript and extract the following:
      - Short and detailed summary of the entire transcript
      - Performance of the company which includes Financials & KPIs, Changes (YoY/QoQ) in KPIs, Segment Performance
      - Management Guidance and Future Outlook which includes Strategic Initiatives, Future Growth Opportunities & Change from previous guidance
      - Key Analyst Concerns and Management Responses 
      - Management Tone and Sentiment Analysis
      - Operational Highlights and External Factors including Operational Efficiency, Capital Allocation, and External Impacts

      Important Considerations while Summarizing:

        - Accuracy: Information must be directly supported by the transcript. No hallucination.
        - Conciseness: Summaries should be to-the-point
        - Completeness: Extract all relevant details for each section; omit sections lacking sufficient data.
        - No External Knowledge: Base analysis solely on the provided transcript.
      `,
  );

const getOutputStructure = () =>
  z.object({
    summary: z
      .string()
      .describe('Short and detailed summary of the entire transcript'),
    performance: z
      .array(z.string())
      .nullable()
      .describe(
        'Summary of the financial performance, KPIs, and segment performance',
      ),
    guidance: z
      .array(z.string())
      .nullable()
      .describe('Summary of the management guidance and future outlook'),
    concerns: z
      .array(z.string())
      .nullable()
      .describe('Summary of key analyst concerns and management responses'),
    tone: z
      .array(z.string())
      .nullable()
      .describe('Summary of management tone and sentiment analysis'),
    highlights: z
      .array(z.string())
      .nullable()
      .describe('Summary of operational highlights and external factors'),
  });

export const generateSummary = async (docs: Document[]) => {
  const content = formatDocumentsAsString(docs);
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
  });
  const llmWithSchema = llm.withStructuredOutput(getOutputStructure());
  const summaryTemplate = getSummaryTemplate();
  return summaryTemplate.pipe(llmWithSchema).invoke({ content });
};
