'use client';

import { useRef, useState } from 'react';

import DrawingCanvas, {
  DrawingCanvasHandle,
} from '@/components/DrawingCanvas';
import ChatTimeline, { ChatEntry } from '@/components/ChatTimeline';
import GuessHistory, { RoundSummary } from '@/components/GuessHistory';
import type { HistoryEntry } from '@/lib/llmx';

const TARGET_BANK = [
  {
    category: '宠物',
    words: ['一只猫', '一只狗', '一条金鱼', '一只鸽子', '一只乌龟'],
  },
  {
    category: '物品',
    words: ['一部手机', '一张椅子', '一栋房子', '一盏台灯', '一个背包'],
  },
  {
    category: '交通工具',
    words: ['一辆汽车', '一架飞机', '一艘帆船', '一列火车', '一辆自行车'],
  },
  {
    category: '自然',
    words: ['一棵树', '一朵花', '一座山', '一道闪电', '一轮太阳'],
  },
];

const pickRandomTarget = () => {
  const block = TARGET_BANK[Math.floor(Math.random() * TARGET_BANK.length)];
  const word = block.words[Math.floor(Math.random() * block.words.length)];
  return { category: block.category, word };
};

const normalizeText = (input: string) =>
  input
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');

const isGuessCorrect = (target: string, guess: string) => {
  const cleanTarget = normalizeText(target);
  const cleanGuess = normalizeText(guess);
  return (
    cleanTarget.length > 0 &&
    (cleanGuess.includes(cleanTarget) || cleanTarget.includes(cleanGuess))
  );
};

export default function Home() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const roundCounterRef = useRef(0);

  const [roundCount, setRoundCount] = useState(0);
  const [playerNote, setPlayerNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [currentRound, setCurrentRound] = useState<RoundSummary | null>(null);
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);

  const latestGuess =
    currentRound?.aiGuess ||
    rounds.find((item) => Boolean(item.aiGuess))?.aiGuess ||
    '';

  const startNewRound = () => {
    const { category, word } = pickRandomTarget();
    roundCounterRef.current += 1;

    const freshRound: RoundSummary = {
      id: roundCounterRef.current,
      target: word,
      category,
      startedAt: new Date().toISOString(),
    };

    setCurrentRound(freshRound);
    setPlayerNote('');
    setError(null);
    setDirty(false);
    setRoundCount(roundCounterRef.current);
    canvasRef.current?.clear();
  };

  const requestGuess = async () => {
    if (!currentRound) {
      setError('请先点击「开始新一轮」获取目标词。');
      return;
    }

    const imageDataUrl = canvasRef.current?.getImageDataUrl();
    if (!imageDataUrl || !dirty) {
      setError('请先在画布上画点东西，再让 AI 来猜。');
      return;
    }

    const roundId = currentRound.id;
    const playerMessage = playerNote.trim()
      ? `我画好了，提示：${playerNote.trim()}`
      : '我画好了，请猜猜看！';

    const historyForApi: HistoryEntry[] = [
      ...chatLog
        .filter((entry) => entry.round === roundId)
        .map((entry) => ({
          role: entry.role === 'player' ? 'user' : 'assistant',
          content: entry.text,
        })),
      { role: 'user', content: playerMessage },
    ];

    const playerChatEntry: ChatEntry = {
      id: `player-${roundId}-${Date.now()}`,
      role: 'player',
      round: roundId,
      text: playerMessage,
      timestamp: new Date().toISOString(),
    };
    setChatLog((prev) => [...prev, playerChatEntry]);

    try {
      setError(null);
      setLoading(true);

      const response = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          targetWord: currentRound.target,
          history: historyForApi,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'AI 暂时无法作答。');
      }

      const guessText =
        typeof payload.guess === 'string' ? payload.guess.trim() : '';
      if (!guessText) {
        throw new Error('AI 没有返回任何文本结果。');
      }

      const aiEntry: ChatEntry = {
        id: `ai-${roundId}-${Date.now()}`,
        role: 'ai',
        round: roundId,
        text: guessText,
        timestamp: new Date().toISOString(),
      };
      setChatLog((prev) => [...prev, aiEntry]);

      const roundResult: RoundSummary = {
        ...currentRound,
        aiGuess: guessText,
        hint: playerNote.trim() || undefined,
        completedAt: new Date().toISOString(),
        correct: isGuessCorrect(currentRound.target, guessText),
      };

      setCurrentRound(roundResult);
      setRounds((history) => {
        const filtered = history.filter((item) => item.id !== roundResult.id);
        return [roundResult, ...filtered].slice(0, 10);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '请求失败，请稍后重试。',
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Boolean(currentRound && dirty && !loading);

  return (
    <main className="page page--advanced">
      <header className="hero">
        <div>
          <p className="eyebrow">AI 你画我猜 · 进阶版</p>
          <h1>AI 你画我猜 · 进阶版</h1>
          <p className="subtitle">
            自己出题作画，AI 来猜目标。记录每一轮的结果与对话，复盘谁才是真正的猜画高手。
          </p>

          <div className="hero__stats">
            <div className="stat-card">
              <span className="stat-card__label">最近一次 AI 猜测</span>
              <p className="stat-card__value">
                {latestGuess || '等待你的第一幅作品'}
              </p>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">累计开局</span>
              <p className="stat-card__value">{roundCount}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="stage">
        <div className="stage__left">
          <DrawingCanvas ref={canvasRef} onDirtyChange={setDirty} />
        </div>

        <aside className="stage__right">
          <div className="round-card">
            <div className="round-card__header">
              <div>
                <p className="round-card__eyebrow">当前回合</p>
                <h3 className="round-card__title">
                  {currentRound ? `第 ${currentRound.id} 轮` : '未开始'}
                </h3>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={startNewRound}
                disabled={loading}
              >
                开始新一轮
              </button>
            </div>

            <ul className="round-card__list">
              <li>
                🎯 目标：
                <strong>
                  {currentRound ? `请画：${currentRound.target}` : '等待开局'}
                </strong>
              </li>
              <li>
                📚 分类：
                {currentRound ? currentRound.category : '——'}
              </li>
              <li>
                🧠 AI 状态：
                {currentRound?.aiGuess
                  ? currentRound.correct
                    ? ' 已猜对'
                    : ' 可继续优化画面并再次提交'
                  : ' 等待画布作品'}
              </li>
            </ul>
          </div>

          <div className="control-card">
            <label className="panel__label" htmlFor="playerNote">
              可选提示（给 AI 一点线索）
            </label>
            <textarea
              id="playerNote"
              placeholder="例如：它生活在水里、它可以飞。"
              value={playerNote}
              onChange={(event) => setPlayerNote(event.target.value)}
            />
            {error ? <p className="panel__error">{error}</p> : null}

            <button
              type="button"
              className="panel__action"
              disabled={!canSubmit}
              onClick={requestGuess}
            >
              {loading ? 'AI 正在思考…' : '让 AI 猜'}
            </button>

            <p className="panel__hint">
              请求会转发到 <code>https://llmxapi.com/v1/chat/completions</code>
              ，需要在 <code>.env.local</code> 中配置 <code>LLMX_API_KEY</code>
              ，可选 <code>LLMX_MODEL_ID</code> 覆盖默认模型。
            </p>
          </div>
        </aside>
      </section>

      <section className="info-grid">
        <div className="info-card">
          <div className="info-card__header">
            <h2>历史回合</h2>
            <p>查看每一轮的目标词、AI 猜测以及命中结果。</p>
          </div>
          <GuessHistory rounds={rounds} />
        </div>

        <div className="info-card">
          <div className="info-card__header">
            <h2>对话记录</h2>
            <p>完整还原玩家与 AI 的交流文本。</p>
          </div>
          <ChatTimeline items={chatLog} />
        </div>
      </section>
    </main>
  );
}
