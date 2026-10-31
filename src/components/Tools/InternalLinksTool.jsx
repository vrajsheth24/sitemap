import React, { useMemo, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { analyzeInternalLinks } from '../../utils/seoTools';
import { NeedsCrawl, StatPill, PageLink } from './ToolShared';

const VIEWS = [
  { id: 'all', label: 'All pages' },
  { id: 'orphans', label: 'Orphans' },
  { id: 'weak', label: 'Weakly linked' },
  { id: 'broken', label: 'Broken links' },
  { id: 'deep', label: 'Deep pages' }
];

export default function InternalLinksTool({ pages, onInspectPage }) {
  const [view, setView] = useState('all');
  const [limit, setLimit] = useState(50);
  const analysis = useMemo(() => analyzeInternalLinks(pages), [pages]);

  if (pages.length === 0) return <NeedsCrawl />;

  if (!analysis.hasLinkData) {
    return (
      <NeedsCrawl message="These pages were imported, so there's no link data. Run a crawl to map how pages link to each other." />
    );
  }

  const weak = analysis.rows.filter(r => !r.isOrphan && r.inlinks === 1);
  let rows = analysis.rows;
  if (view === 'orphans') rows = analysis.orphans;
  if (view === 'weak') rows = weak;
  if (view === 'deep') rows = analysis.deepPages;
  rows = [...rows].sort((a, b) => a.inlinks - b.inlinks || a.page.url.localeCompare(b.page.url));

  return (
    <div className="tool-body">
      <div className="glass-panel stat-row">
        <StatPill label="Pages" value={pages.length} />
        <StatPill label="Internal links" value={analysis.totalLinks} />
        <StatPill label="Orphan pages" value={analysis.orphans.length} tone={analysis.orphans.length ? 'bad' : 'good'} />
        <StatPill label="Only 1 inlink" value={weak.length} tone={weak.length ? 'warn' : 'good'} />
        <StatPill label="Links to broken pages" value={analysis.brokenLinks.length} tone={analysis.brokenLinks.length ? 'bad' : 'good'} />
        <StatPill label="Deeper than 3 clicks" value={analysis.deepPages.length} tone={analysis.deepPages.length ? 'warn' : 'good'} />
      </div>

      <div className="tool-note">
        <Info size={14} />
        <span>
          Orphans have no links from any other crawled page, so search engines may struggle to find them. Pages that were never fetched
          (unreached) don't contribute outgoing links, which can make some pages look orphaned.
        </span>
      </div>

      <div className="segmented" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
        {VIEWS.map(v => (
          <button key={v.id} type="button" className={view === v.id ? 'active' : ''} onClick={() => { setView(v.id); setLimit(50); }}>
            {v.label}
          </button>
        ))}
      </div>

      {view === 'broken' ? (
        <div className="glass-panel table-wrapper">
          <table className="custom-table">
            <thead>
              <tr><th>Linking page</th><th>Links to</th><th>Status</th></tr>
            </thead>
            <tbody>
              {analysis.brokenLinks.length === 0 ? (
                <tr><td colSpan={3}><div className="empty-state" style={{ padding: '2rem' }}>No links point to broken pages.</div></td></tr>
              ) : analysis.brokenLinks.slice(0, limit).map((l, i) => (
                <tr key={`${l.from}-${l.to}-${i}`}>
                  <td><span className="cell-url">{l.from}</span></td>
                  <td><span className="cell-url">{l.to}</span></td>
                  <td><span className="badge badge-400">{l.statusCode}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Page</th>
                <th style={{ textAlign: 'right' }}>Inlinks</th>
                <th style={{ textAlign: 'right' }}>Outlinks</th>
                <th>Depth</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state" style={{ padding: '2rem' }}>Nothing to report here.</div></td></tr>
              ) : rows.slice(0, limit).map(r => (
                <tr key={r.page.url}>
                  <td><PageLink page={r.page} onInspectPage={onInspectPage} /></td>
                  <td style={{ textAlign: 'right' }} title={r.sources.slice(0, 10).join('\n')}>
                    <span className="cell-mono" style={{ color: r.inlinks === 0 ? 'var(--accent-red)' : undefined }}>{r.inlinks}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}><span className="cell-mono">{r.outlinks}</span></td>
                  <td><span className="cell-mono">L{r.page.depth ?? 0}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {r.isOrphan && <span className="badge badge-400">Orphan</span>}
                      {!r.isOrphan && r.inlinks === 1 && <span className="badge badge-warn">1 inlink</span>}
                      {r.isDeep && <span className="badge badge-warn">Deep</span>}
                      {r.outlinks === 0 && !r.page.fetchFailed && <span className="badge badge-muted">Dead end</span>}
                      {r.page.fetchFailed && (
                        <span className="badge badge-warn"><AlertTriangle size={11} />Unreached</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(view === 'broken' ? analysis.brokenLinks.length : rows.length) > limit && (
        <button type="button" className="btn btn-secondary" style={{ alignSelf: 'center' }} onClick={() => setLimit(l => l + 50)}>
          Show more
        </button>
      )}
    </div>
  );
}
