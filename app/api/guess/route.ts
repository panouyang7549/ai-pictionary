import { NextResponse } from 'next/server';

import { requestGuessFromLlmx, HistoryEntry } from '@/lib/llmx';

type GuessRequestBody = {
  imageDataUrl?: string;
  targetWord?: string;
  history?: HistoryEntry[];
};

export async function POST(request: Request) {
  let payload: GuessRequestBody;

  try {
    payload = (await request.json()) as GuessRequestBody;
  } catch (error) {
    console.error('[guess api] invalid JSON', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { imageDataUrl, targetWord, history } = payload ?? {};

  if (!imageDataUrl || !targetWord) {
    return NextResponse.json(
      { error: 'Both imageDataUrl and targetWord are required' },
      { status: 400 }
    );
  }

  if (!process.env.LLMX_API_KEY) {
    return NextResponse.json(
      { error: 'Missing LLMX_API_KEY environment variable' },
      { status: 500 }
    );
  }

  try {
    const guess = await requestGuessFromLlmx({
      imageDataUrl,
      targetWord,
      history
    });
    return NextResponse.json({ guess });
  } catch (error) {
    console.error('[guess api] llm failure', error);
    return NextResponse.json(
      { error: 'LLM request failed' },
      { status: 500 }
    );
  }
}
