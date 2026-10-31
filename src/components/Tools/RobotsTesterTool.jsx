import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Download } from 'lucide-react';
import { parseRobotsTxt, getRulesForAgent, checkUrlAgainstRules } from '../../utils/robotsTxt';
import { ClientCrawler } from '../../utils/clientCrawler';

const AGENTS = [
  { label: 'Googlebot', value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  { label: 'Googlebot-Image', value: 'Googlebot-Image/1.0' },
  { label: 'Bingbot', value: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
  { label: 'GPTBot', value: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)' },
  { label: 'Any other bot (*)', value: '*' }
];

const SAMPLE = `User-agent: *
Disallow: /admin/
Disallow: /cart
Disallow: /*?sort=
Allow: /admin/public/

Sitemap: https://example.com/sitemap.xml`;

export default function RobotsTesterTool({ pages, targetUrl }) {
  const [robotsText, setRobotsText] = useState(SAMPLE);
  const [urlsText, setUrlsText] = useState(() =>
    pages.length > 0 ? pages.slice(0, 25).map(p => p.url).join('\n') : 'https://example.com/\nhttps://example.com/admin/settings\nhttps://example.com/admin/public/help\nhttps://example.com/shop?sort=price'
  );
  const [agent, setAgent] = useState(AGENTS[0].value);
  const [fetchState, setFetchState] = useState({ loading: false, message: '' });

  const siteOrigin = (() => {
    try {
      return new URL(targetUrl || pages[0]?.url).origin;
    } catch (e) {
      return '';
    }
  })();

  const parsed = useMemo(() => parseRobotsTxt(robotsText), [robotsText]);
  const applied = useMemo(() => getRulesForAgent(parsed, agent), [parsed, agent]);
  const results = useMemo(() => urlsText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 500)
    .map(url => ({ url, ...checkUrlAgainstRules(applied.rules, url) })), [urlsText, applied]);

  const blockedCount = results.filter(r => !r.allowed).length;

  const handleFetch = async () => {
    if (!siteOrigin) return;
    const robotsUrl = `${siteOrigin}/robots.txt`;
    setFetchState({ loading: true, message: `Fetching ${robotsUrl}…` });
    try {
      const crawler = new ClientCrawler({ url: siteOrigin });
      const engine = await crawler.detectBestEngine(robotsUrl);
      const res = engine ? await crawler.executeProxyTarget(engine, robotsUrl, performance.now()) : null;
      if (res && res.ok && res.html && !/<html[\s>]/i.test(res.html)) {
        setRobotsText(res.html.trim());
        setFetchState({ loading: false, message: `Loaded ${robotsUrl}` });
      } else {
        setFetchState({ loading: false, message: `Couldn't load ${robotsUrl} — the site may not have one. Paste it manually instead.` });
      }
    } catch (e) {
      setFetchState({ loading: false, message: `Couldn't load ${robotsUrl}: ${e.message}` });
    }
  };

  return (
    <div className="tool-body">
      <div className="tool-columns">
        <div className="glass-panel tool-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 className="tool-panel-title">robots.txt</h3>
            {siteOrigin && (
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }} onClick={handleFetch} disabled={fetchState.loading}>
                <Download size={13} />
                <span>{fetchState.loading ? 'Fetching…' : `Fetch from ${siteOrigin.replace(/^https?:\/\//, '')}`}</span>
              </button>
            )}
          </div>
          {fetchState.message && <span className="option-hint">{fetchState.message}</span>}
          <textarea className="code-textarea" rows="12" spellCheck={false} value={robotsText} onChange={(e) => setRobotsText(e.target.value)} aria-label="robots.txt contents" />
          {parsed.sitemaps.length > 0 && (
            <div className="option-hint">
              Declared sitemaps: {parsed.sitemaps.map(s => <code key={s} style={{ marginRight: '0.3rem' }}>{s}</code>)}
            </div>
          )}
        </div>

        <div className="glass-panel tool-panel">
          <h3 className="tool-panel-title">URLs to test</h3>
          <div className="option-group">
            <label className="option-label" htmlFor="robots-agent">Crawler</label>
            <select id="robots-agent" className="option-select" value={agent} onChange={(e) => setAgent(e.target.value)}>
              {AGENTS.map(a => <option key={a.label} value={a.value}>{a.label}</option>)}
            </select>
            <span className="option-hint">
              Using the <code>User-agent: {applied.agent}</code> group ({applied.rules.length} rule{applied.rules.length === 1 ? '' : 's'}).
            </span>
          </div>
          <textarea className="code-textarea" rows="8" spellCheck={false} value={urlsText} onChange={(e) => setUrlsText(e.target.value)} aria-label="URLs to test, one per line" />
          {pages.length > 0 && (
            <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setUrlsText(pages.slice(0, 500).map(p => p.url).join('\n'))}>
              Use all crawled URLs ({Math.min(500, pages.length)})
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel table-wrapper">
        <div className="toolbar" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Results</span>
          <span className="unit-label">
            {results.length - blockedCount} allowed · <span style={{ color: blockedCount ? 'var(--accent-red)' : undefined }}>{blockedCount} blocked</span>
          </span>
        </div>
        <table className="custom-table">
          <thead><tr><th>URL</th><th>Result</th><th>Matched rule</th></tr></thead>
          <tbody>
            {results.length === 0 ? (
              <tr><td colSpan={3}><div className="empty-state" style={{ padding: '1.5rem' }}>Enter one or more URLs to test.</div></td></tr>
            ) : results.map((r, i) => (
              <tr key={`${r.url}-${i}`}>
                <td><span className="cell-url">{r.url}</span></td>
                <td>
                  {r.allowed
                    ? <span className="badge badge-200"><CheckCircle2 size={12} />Allowed</span>
                    : <span className="badge badge-400"><XCircle size={12} />Blocked</span>}
                </td>
                <td>
                  <span className="cell-mono">
                    {r.rule ? `${r.rule.allow ? 'Allow' : 'Disallow'}: ${r.rule.value}` : 'No matching rule'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
