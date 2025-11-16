'use client';

export type ChatEntry = {
  id: string;
  role: 'player' | 'ai';
  text: string;
  round: number;
  timestamp: string;
};

type Props = {
  items: ChatEntry[];
};

const ROLE_LABELS: Record<ChatEntry['role'], string> = {
  player: '\u73a9\u5bb6',
  ai: 'AI \u52a9\u624b'
};

export default function ChatTimeline({ items }: Props) {
  if (!items.length) {
    return (
      <div className="chat chat--empty">
        <p>\u6682\u65e0\u5bf9\u8bdd\u8bb0\u5f55\uff0c\u5f00\u59cb\u4f5c\u753b\u5e76\u8ba9 AI \u731c\u6d4b\u540e\u5c06\u663e\u793a\u5728\u8fd9\u91cc\u3002</p>
      </div>
    );
  }

  return (
    <div className="chat">
      {items.map((entry) => (
        <article
          key={entry.id}
          className={`chat__row chat__row--${entry.role}`}
        >
          <div className="chat__meta">
            <span className="chat__role">{ROLE_LABELS[entry.role]}</span>
            <span className="chat__round">\u7b2c {entry.round} \u8f6e</span>
            <time>{new Date(entry.timestamp).toLocaleTimeString()}</time>
          </div>
          <p className="chat__text">{entry.text}</p>
        </article>
      ))}
    </div>
  );
}
