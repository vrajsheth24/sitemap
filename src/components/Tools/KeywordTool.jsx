import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { analyzeKeywords, extractVisibleText } from '../../utils/seoTools';
import { ClientCrawler } from '../../utils/clientCrawler';
import { StatPill } from './ToolShared';

function KeywordTable({ title, rows }) {
  return (
    <div className="glass-panel table-wrapper">
      <div className="toolbar" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{title}</span>
      </div>
      <table className="custom-table">
        <thead>
          <tr><th>Phrase</th><th style={{ textAlign: 'right' }}>Count</th><th style={{ textAlign: 'right' }}>Density</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={3}><span className="text-muted" style={{ fontSize: '0.84rem' }}>No repeated phrases yet.</span></td></tr>
          ) : rows.map(r => (
            <tr key={r.phrase}>
              <td>{r.phrase}</td>
              <td style={{ textAlign: 'right' }}><span className="cell-mono">{r.count}</span></td>
              <td style={{ textAlign: 'right' }}>
                <span className="cell-mono" style={{ color: r.density > 3 ? 'var(--accent-amber)' : undefined }}>{r.density.toFixed(1)}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const VERDICTS = {
  missing: { tone: 'bad', text: 'Not found in the text.' },
  low: { tone: 'warn', text: 'Used rarely — consider mentioning it a few more times naturally.' },
  good: { tone: 'good', text: 'Healthy usage.' },
  high: { tone: 'warn', text: 'Used very often — this can read as keyword stuffing.' }
};

export default function KeywordTool() {
  const [text, setText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetchState, setFetchState] = useState({ loading: false, message: '' });

  const result = useMemo(() => analyzeKeywords(text, keyword), [text, keyword]);

  const handleFetch = async (e) => {
    e.preventDefault();
    let url = fetchUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    setFetchState({ loading: true, message: `Fetching ${url}…` });
    try {
      const crawler = new ClientCrawler({ url });
      await crawler.detectBestEngine(url);
      const res = await crawler.fetchPageHtml(url);
      if (res.ok && res.html) {
        setText(extractVisibleText(res.html, res.isMarkdown));
        setFetchState({ loading: false, message: `Loaded visible text from ${url}` });
      } else {
        setFetchState({ loading: false, message: `Couldn't fetch ${url}. Paste the text instead.` });
      }
    } catch (err) {
      setFetchState({ loading: false, message: `Couldn't fetch ${url}: ${err.message}` });
    }
  };

  const verdict = result.target ? VERDICTS[result.target.verdict] : null;

  return (
    <div className="tool-body">
      <div className="glass-panel tool-panel">
        <form onSubmit={handleFetch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="option-input" style={{ flex: '1 1 260px' }} placeholder="https://example.com/blog/post — or paste text below"
            aria-label="Page URL to analyze" value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} />
          <button type="submit" className="btn btn-secondary" disabled={fetchState.loading || !fetchUrl.trim()}>
            <Download size={14} />
            <span>{fetchState.loading ? 'Fetching…' : 'Fetch page text'}</span>
          </button>
        </form>
        {fetchState.message && <span className="option-hint">{fetchState.message}</span>}

        <textarea className="option-input" rows="8" style={{ resize: 'vertical', lineHeight: 1.55 }} aria-label="Text to analyze"
          placeholder="Paste your article or page copy here…" value={text} onChange={(e) => setText(e.target.value)} />

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="option-label" htmlFor="kw-target">Focus keyword</label>
          <input id="kw-target" className="option-input" style={{ flex: '1 1 220px', maxWidth: '360px' }} placeholder="e.g. xml sitemap"
            value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      {result.totalWords > 0 && (
        <>
          <div className="glass-panel stat-row">
            <StatPill label="Words" value={result.totalWords.toLocaleString()} />
            <StatPill label="Unique words" value={result.uniqueWords.toLocaleString()} />
            <StatPill label="Sentences" value={result.sentences.toLocaleString()} />
            <StatPill label="Avg. sentence" value={`${result.avgSentenceLength.toFixed(1)} words`} tone={result.avgSentenceLength > 25 ? 'warn' : undefined} />
            <StatPill label="Reading time" value={`${Math.max(1, Math.round(result.readingMinutes))} min`} />
          </div>

          {result.target && (
            <div className={`issue-row ${verdict.tone === 'good' ? 'info' : verdict.tone === 'bad' ? 'critical' : 'warning'}`} style={{ display: 'block' }}>
              <div style={{ display: 'flex', gap: '0.5rem 1.5rem', flexWrap: 'wrap', alignItems: 'baseline', fontSize: '0.86rem' }}>
                <span style={{ fontWeight: 650 }}>“{result.target.phrase}”</span>
                <span>{result.target.count} uses</span>
                <span>{result.target.density.toFixed(2)}% density</span>
                <span>{result.target.inFirst100 ? '✓ in the first 100 words' : '✗ not in the first 100 words'}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{verdict.text}</p>
            </div>
          )}

          <div className="tool-columns three">
            <KeywordTable title="Top keywords" rows={result.single} />
            <KeywordTable title="2-word phrases" rows={result.double} />
            <KeywordTable title="3-word phrases" rows={result.triple} />
          </div>
        </>
      )}
    </div>
  );
}
