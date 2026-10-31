import React, { useMemo, useState } from 'react';
import { findContentIssues, analyzeUrls } from '../../utils/seoTools';
import { NeedsCrawl, StatPill, PageLink } from './ToolShared';

function DuplicateGroups({ groups, onInspectPage, emptyText }) {
  if (groups.length === 0) {
    return <div className="empty-state" style={{ padding: '1.5rem' }}>{emptyText}</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {groups.slice(0, 50).map(group => (
        <div key={group.value} className="issue-row warning" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>“{group.value}”</span>
            <span className="badge badge-warn">{group.pages.length} pages</span>
          </div>
          <ul className="plain-list">
            {group.pages.slice(0, 10).map(p => (
              <li key={p.url}><PageLink page={p} onInspectPage={onInspectPage} /></li>
            ))}
            {group.pages.length > 10 && <li className="text-muted">…and {group.pages.length - 10} more</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function ContentIssuesTool({ pages, onInspectPage }) {
  const [section, setSection] = useState('titles');
  const [thinThreshold, setThinThreshold] = useState(300);
  const issues = useMemo(() => findContentIssues(pages, thinThreshold), [pages, thinThreshold]);
  const urlIssues = useMemo(() => analyzeUrls(pages), [pages]);

  if (pages.length === 0) return <NeedsCrawl message="Crawl or import a website to check for duplicate metadata and URL problems." />;

  const dupCount = (groups) => groups.reduce((n, g) => n + g.pages.length, 0);
  const sections = [
    { id: 'titles', label: 'Duplicate titles', count: issues.titles.length },
    { id: 'descriptions', label: 'Duplicate descriptions', count: issues.descriptions.length },
    { id: 'h1s', label: 'Duplicate H1s', count: issues.h1s.length },
    { id: 'thin', label: 'Thin content', count: issues.thin.length },
    { id: 'urls', label: 'URL issues', count: urlIssues.length }
  ];

  return (
    <div className="tool-body">
      <div className="glass-panel stat-row">
        <StatPill label="Pages sharing a title" value={dupCount(issues.titles)} tone={issues.titles.length ? 'bad' : 'good'} />
        <StatPill label="Pages sharing a description" value={dupCount(issues.descriptions)} tone={issues.descriptions.length ? 'warn' : 'good'} />
        <StatPill label="Pages sharing an H1" value={dupCount(issues.h1s)} tone={issues.h1s.length ? 'warn' : 'good'} />
        <StatPill label={`Under ${thinThreshold} words`} value={issues.hasWordCounts ? issues.thin.length : '–'} tone={issues.thin.length ? 'warn' : 'good'} />
        <StatPill label="URLs with issues" value={urlIssues.length} tone={urlIssues.length ? 'warn' : 'good'} />
      </div>

      <div className="segmented" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} type="button" className={section === s.id ? 'active' : ''} onClick={() => setSection(s.id)}>
            {s.label}
            <span className="count">{s.count}</span>
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        {section === 'titles' && (
          <DuplicateGroups groups={issues.titles} onInspectPage={onInspectPage} emptyText="Every page has a unique title." />
        )}
        {section === 'descriptions' && (
          <DuplicateGroups groups={issues.descriptions} onInspectPage={onInspectPage} emptyText="Every page has a unique meta description." />
        )}
        {section === 'h1s' && (
          <DuplicateGroups groups={issues.h1s} onInspectPage={onInspectPage} emptyText="Every page has a unique H1." />
        )}

        {section === 'thin' && (
          !issues.hasWordCounts ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>Word counts are only available for crawled pages (not imports). Run a crawl to check for thin content.</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                <label className="option-label" htmlFor="thin-threshold">Flag pages with fewer than</label>
                <input id="thin-threshold" type="number" min="50" max="2000" step="50" className="option-input num-input"
                  value={thinThreshold} onChange={(e) => setThinThreshold(Math.max(1, parseInt(e.target.value, 10) || 300))} />
                <span className="unit-label">words (includes navigation and footer text)</span>
              </div>
              {issues.thin.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>No thin pages found.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead><tr><th>Page</th><th style={{ textAlign: 'right' }}>Words</th></tr></thead>
                    <tbody>
                      {issues.thin.slice(0, 200).map(p => (
                        <tr key={p.url}>
                          <td><PageLink page={p} onInspectPage={onInspectPage} /></td>
                          <td style={{ textAlign: 'right' }}><span className="cell-mono">{p.wordCount}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        )}

        {section === 'urls' && (
          urlIssues.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>All URLs are short, lowercase, hyphenated and clean.</div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead><tr><th>URL</th><th>Issues</th></tr></thead>
                <tbody>
                  {urlIssues.slice(0, 200).map(({ page, problems }) => (
                    <tr key={page.url}>
                      <td><PageLink page={page} onInspectPage={onInspectPage} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {problems.map(p => <span key={p} className="badge badge-warn">{p}</span>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
