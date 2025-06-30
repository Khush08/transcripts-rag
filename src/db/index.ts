import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { Database } from './types';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { TranscriptSummary } from '../createKnowledgeBase/types';

const SUMMARY_TABLE = 'transcript_summary';
const EMBEDDING_TABLE = 'transcript_embeddings';
const QA_TABLE = 'transcript_qa';

export class DB {
  vectorStore: SupabaseVectorStore;
  client: SupabaseClient<Database, 'public', any>;

  constructor(
    client: SupabaseClient<Database, 'public', any>,
    vectorStore: SupabaseVectorStore,
  ) {
    this.client = client;
    this.vectorStore = vectorStore;
  }

  static async getInstance(): Promise<DB> {
    const privateKey = process.env.SUPABASE_PRIVATE_KEY;
    if (!privateKey) throw new Error(`Missing SUPABASE_PRIVATE_KEY`);

    const url = process.env.SUPABASE_URL;
    if (!url) throw new Error(`Missing SUPABASE_URL`);

    const client = createClient<Database>(url, privateKey);
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      new OpenAIEmbeddings({ model: 'text-embedding-3-large' }),
      {
        client: client,
        tableName: EMBEDDING_TABLE,
        queryName: 'match_embeddings',
      },
    );
    return new this(client, vectorStore);
  }

  addSummary = async (
    summary: TranscriptSummary,
    docUrl: string,
    transcript: string,
  ) => {
    const { data, error } = await this.client
      .from(SUMMARY_TABLE)
      .insert({
        summary,
        doc_url: docUrl,
        transcript,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error adding summary: ${error.message}`);
    }

    return data;
  };

  getTranscriptSummary = async (
    docUrl: string,
  ): Promise<
    Database['public']['Tables']['transcript_summary']['Row'] | null
  > => {
    const { data } = await this.client
      .from(SUMMARY_TABLE)
      .select()
      .eq('doc_url', docUrl)
      .single();

    if (!data) {
      return null;
    }

    return data;
  };

  saveQA = async (
    question: string,
    answer: string,
    context: string,
    followupQuestions: string[],
    url: string,
  ) => {
    const { data, error } = await this.client
      .from(QA_TABLE)
      .insert({
        question,
        answer,
        context,
        followup_questions: followupQuestions,
        url,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error saving QA: ${error.message}`);
    }

    return data;
  };

  getQA = async (
    question: string,
    url: string,
  ): Promise<Database['public']['Tables']['transcript_qa']['Row'] | null> => {
    const { data } = await this.client
      .from(QA_TABLE)
      .select()
      .eq('question', question)
      .eq('url', url)
      .single();

    if (!data) {
      return null;
    }

    return data;
  };
}
