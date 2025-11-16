export type RoundSummary = {
  id: number;
  target: string;
  category: string;
  aiGuess?: string;
  correct?: boolean;
  hint?: string;
  startedAt: string;
  completedAt?: string;
};

type Props = {
  rounds: RoundSummary[];
};

export default function GuessHistory({ rounds }: Props) {
  if (!rounds.length) {
    return (
      <div className="history history--empty">
        <p>\u8fd8\u6ca1\u6709\u5b8c\u6210\u7684\u56de\u5408\uff0c\u70b9\u51fb\u300c\u5f00\u59cb\u65b0\u4e00\u8f6e\u300d\u540e\u4f5c\u753b\u5e76\u63d0\u4ea4\u5427\u3002</p>
      </div>
    );
  }

  return (
    <div className="history">
      {rounds.map((round) => (
        <article key={round.id} className="history__item">
          <div className="history__meta">
            <span className="history__round">\u7b2c {round.id} \u8f6e</span>
            <span className="history__category">{round.category}</span>
            <span
              className={`history__status ${
                round.correct === undefined
                  ? 'history__status--pending'
                  : round.correct
                  ? 'history__status--success'
                  : 'history__status--fail'
              }`}
            >
              {round.correct === undefined
                ? '\u672a\u5b8c\u6210'
                : round.correct
                ? '\u731c\u5bf9\u4e86'
                : '\u672a\u731c\u4e2d'}
            </span>
          </div>
          <p className="history__target">\u76ee\u6807\uff1a{round.target}</p>
          <p className="history__guess">
            AI \u731c\u6d4b\uff1a{round.aiGuess ?? '\u6682\u65e0\u7ed3\u679c'}
          </p>
          {round.hint ? (
            <p className="history__hint">\u73a9\u5bb6\u63d0\u793a\uff1a{round.hint}</p>
          ) : null}
          <p className="history__timestamp">
            {round.completedAt
              ? `\u5b8c\u6210\u4e8e ${new Date(round.completedAt).toLocaleTimeString()}`
              : `\u5f00\u59cb\u4e8e ${new Date(round.startedAt).toLocaleTimeString()}`}
          </p>
        </article>
      ))}
    </div>
  );
}
