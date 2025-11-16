# AI &#20320;&#30011;&#25105;&#29468; - &#36827;&#32423;&#29256;

An advanced Pictionary-inspired web mini-game built with **Next.js (App Router) + TypeScript**. Draw on the canvas, submit the sketch, and let llmxapi-compatible LLMs guess the target word while the UI keeps score, round history, and a chat transcript.

## Environment Setup

Create a `.env.local` file in the project root before running the app:

```bash
LLMX_API_KEY=your_llmxapi_sk_key
LLMX_MODEL_ID=gemini-2.5-pro
```

- `LLMX_API_KEY` is required and should remain server-side only.
- `LLMX_MODEL_ID` is optional; the code falls back to `gemini-2.5-pro` if omitted.

## Local Development

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](https://localhost:3000) to start drawing. Press "\&#24320;\&#22987;\&#26032;\&#19968;\&#36718;" to get a random prompt, sketch on the canvas, optionally leave a hint, and click "\&#35753; AI \&#29468;" to forward everything to `https://llmxapi.com/v1/chat/completions`.

## Key Features

- **DrawingCanvas component** - custom `<canvas>` with brush colors, two brush sizes, undo/clear controls, and imperative `getImageDataUrl`/`clear` helpers for the page.
- **Game state management** - keeps current round, prompts, loading/error states, canvas dirtiness, AI guesses, outcome detection, and a rolling history list entirely on the client.
- **Next.js Route Handler** - `/api/guess` validates payloads, reads `LLMX_API_KEY`, and proxies requests (via `fetch`) to llmxapi's OpenAI-compatible Chat Completions endpoint with the sketch data URL plus optional history.
- **UI/UX** - pure CSS in `app/globals.css` provides a clean split layout: canvas on the left, round/controls on the right, and cards for history + chat log below.

For production, secure your API key (e.g., host-side secrets manager) and consider persisting round history/chat logs in a database if you need multiplayer or long-term stats.
