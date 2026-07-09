import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { api } from '../api.js';

/** Carte de sondage dans le fil : question, options avec barres de résultat, vote. */
export default function PollCard({ poll: incoming }) {
  const [poll, setPoll] = useState(incoming);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPoll(incoming); }, [incoming]);
  if (!poll) return null;

  const closed = poll.closed;
  const mine = new Set(poll.my_votes || []);
  const voted = mine.size > 0;

  async function vote(i) {
    if (closed || busy) return;
    setBusy(true);
    try {
      const { poll: updated } = await api(`/polls/${poll.id}/vote`, { method: 'POST', body: { optionIndex: i } });
      setPoll(updated);
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  return (
    <div className="poll-card">
      <div className="poll-q"><Icon name="chart-simple" /> {poll.question}</div>
      <div className="poll-options">
        {poll.options.map((o, i) => {
          const pct = poll.total ? Math.round((o.votes / poll.total) * 100) : 0;
          const isMine = mine.has(i);
          return (
            <button key={i} className={`poll-opt ${isMine ? 'mine' : ''}`} onClick={() => vote(i)} disabled={closed || busy}>
              <span className="poll-bar" style={{ width: `${pct}%` }} />
              <span className="poll-opt-label">
                <span className="poll-check">{isMine ? <Icon name="circle-check" /> : <Icon name="circle" regular />}</span>
                {o.text}
              </span>
              <span className="poll-opt-count">{pct}%</span>
            </button>
          );
        })}
      </div>
      <div className="poll-foot">
        {poll.total} vote{poll.total > 1 ? 's' : ''}
        {poll.multi ? ' · choix multiples' : ''}
        {closed ? ' · clôturé' : voted ? ' · vous avez voté' : ''}
      </div>
    </div>
  );
}
