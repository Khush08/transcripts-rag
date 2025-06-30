export interface RetrieverResponse {
  answer: string | null;
  followupQuestions: string[] | null;
}

export interface TranscriptQA {
  answer: string;
  followupQuestions: string[];
}
