// src/index.ts
import express from 'express';
import * as dotenv from 'dotenv';
import { createKnowledgeBase } from './createKnowledgeBase';
import { retriever } from './retriver';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/api/qa', async (req, res) => {
  const { url, question } = req.query;

  if (
    !url ||
    typeof url !== 'string' ||
    !question ||
    typeof question !== 'string'
  ) {
    return res.status(400).json({
      error: 'Missing or invalid url or question in query parameters',
    });
  }

  try {
    const message = await retriever(question, url);
    res.status(200).json({ message });
  } catch {
    res.status(500).json({ error: `Failed to retrieve results for ${url}` });
  }
});

app.post('/api/addTranscript', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.endsWith('.pdf')) {
    return res
      .status(400)
      .json({ error: 'Missing or invalid url in request body' });
  }

  try {
    const message = await createKnowledgeBase(url);
    res.status(200).json({ message });
  } catch {
    res
      .status(500)
      .json({ error: `Failed to create knowledge base for ${url}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
