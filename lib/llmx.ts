const LLMX_ENDPOINT = 'https://llmxapi.com/v1/chat/completions';
const DEFAULT_MODEL_ID = 'gemini-2.5-pro';

export type HistoryEntry = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT =
  '\u4f60\u662f\u4e00\u4e2a\u6839\u636e\u7b80\u7b14\u753b\u6765\u731c\u6d4b\u5185\u5bb9\u7684 AI \u52a9\u624b\u3002\u7528\u6237\u4f1a\u7ed9\u4f60\u4e00\u4e2a\u975e\u5e38\u7b80\u5355\u7684\u6d82\u9e26\u56fe\u7247\uff08\u4ee5 data URL \u5f62\u5f0f\u4f20\u7ed9\u4f60\uff09\u4ee5\u53ca\u8fd9\u4e00\u8f6e\u5e94\u8be5\u753b\u7684\u76ee\u6807\u8bcd\u3002\u4f60\u9700\u8981\u5224\u65ad\u7528\u6237\u753b\u5f97\u50cf\u4e0d\u50cf\u8fd9\u4e2a\u76ee\u6807\u8bcd\uff0c\u5e76\u7528\u7b80\u6d01\u7684\u4e2d\u6587\u56de\u7b54\u3002\u56de\u7b54\u5185\u5bb9\u5e94\u8be5\u5305\u62ec\uff1a\u4f60\u8ba4\u4e3a\u8fd9\u5e45\u753b\u753b\u7684\u662f\u4ec0\u4e48\uff0c\u4ee5\u53ca\u4f60\u5bf9\u81ea\u5df1\u5224\u65ad\u7684\u4fe1\u5fc3\uff080~100%\uff09\u3002\u4e0d\u8981\u8f93\u51fa\u82f1\u6587\u3002';

const mapHistoryToMessages = (history?: HistoryEntry[]) =>
  (history ?? []).map((item) => ({
    role: item.role,
    content: item.content
  }));

export async function requestGuessFromLlmx(input: {
  imageDataUrl: string;
  targetWord: string;
  history?: HistoryEntry[];
}) {
  const apiKey = process.env.LLMX_API_KEY;
  if (!apiKey) {
    throw new Error('Missing LLMX_API_KEY environment variable');
  }

  const model = process.env.LLMX_MODEL_ID || DEFAULT_MODEL_ID;

  const response = await fetch(LLMX_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...mapHistoryToMessages(input.history),
        {
          role: 'user',
          content: `\u672c\u8f6e\u7684\u76ee\u6807\u8bcd\u662f\uff1a\u300c${input.targetWord}\u300d\u3002\u4e0b\u9762\u662f\u6211\u7684\u7b80\u7b14\u753b\u56fe\u7247\u7684 data URL\uff0c\u8bf7\u4f60\u6839\u636e\u8fd9\u5f20\u753b\u6765\u731c\u6211\u753b\u7684\u662f\u4e0d\u662f\u8fd9\u4e2a\u76ee\u6807\u8bcd\uff0c\u5e76\u7ed9\u51fa\u4f60\u7684\u5224\u65ad\u548c\u4fe1\u5fc3\u503c\uff1a${input.imageDataUrl}`
        }
      ],
      temperature: 0.4,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const guessText = payload.choices?.[0]?.message?.content?.trim();
  if (!guessText) {
    throw new Error('LLM request failed');
  }

  return guessText;
}
