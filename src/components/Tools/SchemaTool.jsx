import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { CodeOutput, PagePicker } from './ToolShared';

const TYPES = [
  { id: 'Organization', label: 'Organization' },
  { id: 'LocalBusiness', label: 'Local business' },
  { id: 'Article', label: 'Article / blog post' },
  { id: 'FAQPage', label: 'FAQ page' },
  { id: 'BreadcrumbList', label: 'Breadcrumbs' }
];

const FIELDS = {
  Organization: [
    { key: 'name', label: 'Name', placeholder: 'Example Inc.' },
    { key: 'url', label: 'Website URL', placeholder: 'https://example.com' },
    { key: 'logo', label: 'Logo URL', placeholder: 'https://example.com/logo.png' },
    { key: 'email', label: 'Email', placeholder: 'hello@example.com' },
    { key: 'telephone', label: 'Phone', placeholder: '+1-555-010-0000' },
    { key: 'sameAs', label: 'Social profiles (one per line)', multiline: true, placeholder: 'https://www.linkedin.com/company/example\nhttps://x.com/example' }
  ],
  LocalBusiness: [
    { key: 'name', label: 'Business name', placeholder: 'Example Bakery' },
    { key: 'url', label: 'Website URL', placeholder: 'https://example.com' },
    { key: 'image', label: 'Photo URL', placeholder: 'https://example.com/storefront.jpg' },
    { key: 'telephone', label: 'Phone', placeholder: '+1-555-010-0000' },
    { key: 'streetAddress', label: 'Street address', placeholder: '123 Main St' },
    { key: 'addressLocality', label: 'City', placeholder: 'Springfield' },
    { key: 'addressRegion', label: 'State / region', placeholder: 'IL' },
    { key: 'postalCode', label: 'Postal code', placeholder: '62701' },
    { key: 'addressCountry', label: 'Country code', placeholder: 'US' },
    { key: 'priceRange', label: 'Price range', placeholder: '$$' },
    { key: 'openingHours', label: 'Opening hours (one per line)', multiline: true, placeholder: 'Mo-Fr 08:00-18:00\nSa 09:00-14:00' }
  ],
  Article: [
    { key: 'headline', label: 'Headline', placeholder: 'How to build a great sitemap' },
    { key: 'description', label: 'Description', placeholder: 'A short summary of the article' },
    { key: 'url', label: 'Article URL', placeholder: 'https://example.com/blog/sitemaps' },
    { key: 'image', label: 'Image URL', placeholder: 'https://example.com/cover.jpg' },
    { key: 'author', label: 'Author name', placeholder: 'Alex Doe' },
    { key: 'publisher', label: 'Publisher name', placeholder: 'Example Inc.' },
    { key: 'publisherLogo', label: 'Publisher logo URL', placeholder: 'https://example.com/logo.png' },
    { key: 'datePublished', label: 'Date published', type: 'date' },
    { key: 'dateModified', label: 'Date modified', type: 'date' }
  ]
};

const lines = (text = '') => text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

// Remove empty strings, empty arrays and objects that only carry @type
function clean(value) {
  if (Array.isArray(value)) {
    const arr = value.map(clean).filter(v => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (value && typeof value === 'object') {
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      const c = clean(v);
      if (c !== undefined) out[k] = c;
    });
    const keys = Object.keys(out).filter(k => !k.startsWith('@'));
    return keys.length ? out : undefined;
  }
  if (typeof value === 'string') return value.trim() ? value.trim() : undefined;
  return value;
}

function breadcrumbsFromUrl(url) {
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/').filter(Boolean);
    const items = [{ name: 'Home', url: `${u.origin}/` }];
    segments.forEach((seg, i) => {
      let name = seg;
      try { name = decodeURIComponent(seg); } catch (e) {}
      name = name.replace(/\.(html?|php|aspx?)$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      items.push({ name, url: `${u.origin}/${segments.slice(0, i + 1).join('/')}${i === segments.length - 1 && !u.pathname.endsWith('/') ? '' : '/'}` });
    });
    return items;
  } catch (e) {
    return null;
  }
}

export default function SchemaTool({ pages, targetUrl, addToast }) {
  const [type, setType] = useState('Organization');
  const [values, setValues] = useState(() => {
    let origin = '';
    try { origin = new URL(targetUrl || pages[0]?.url).origin; } catch (e) {}
    return { Organization: { url: origin }, LocalBusiness: { url: origin }, Article: {} };
  });
  const [faqs, setFaqs] = useState([{ q: '', a: '' }]);
  const [crumbs, setCrumbs] = useState([{ name: 'Home', url: '' }]);

  const setField = (key, value) => setValues(prev => ({ ...prev, [type]: { ...prev[type], [key]: value } }));
  const v = values[type] || {};

  const fillArticleFromPage = (page) => setValues(prev => ({
    ...prev,
    Article: { ...prev.Article, headline: page.h1 || page.title || '', description: page.description || '', url: page.url, image: page.images?.[0] || '' }
  }));

  const schema = useMemo(() => {
    let data;
    if (type === 'Organization') {
      data = {
        '@context': 'https://schema.org', '@type': 'Organization',
        name: v.name, url: v.url, logo: v.logo, email: v.email, telephone: v.telephone, sameAs: lines(v.sameAs)
      };
    } else if (type === 'LocalBusiness') {
      data = {
        '@context': 'https://schema.org', '@type': 'LocalBusiness',
        name: v.name, url: v.url, image: v.image, telephone: v.telephone, priceRange: v.priceRange,
        address: {
          '@type': 'PostalAddress', streetAddress: v.streetAddress, addressLocality: v.addressLocality,
          addressRegion: v.addressRegion, postalCode: v.postalCode, addressCountry: v.addressCountry
        },
        openingHours: lines(v.openingHours)
      };
    } else if (type === 'Article') {
      data = {
        '@context': 'https://schema.org', '@type': 'Article',
        headline: v.headline, description: v.description, image: v.image ? [v.image] : [],
        mainEntityOfPage: v.url ? { '@type': 'WebPage', '@id': v.url } : undefined,
        author: { '@type': 'Person', name: v.author },
        publisher: { '@type': 'Organization', name: v.publisher, logo: { '@type': 'ImageObject', url: v.publisherLogo } },
        datePublished: v.datePublished, dateModified: v.dateModified
      };
    } else if (type === 'FAQPage') {
      data = {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.filter(f => f.q.trim() && f.a.trim()).map(f => ({
          '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
      };
    } else {
      data = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: crumbs.filter(c => c.name.trim()).map((c, i) => ({
          '@type': 'ListItem', position: i + 1, name: c.name, item: c.url
        }))
      };
    }
    const cleaned = clean(data) || { '@context': 'https://schema.org', '@type': type };
    const json = JSON.stringify(cleaned, null, 2).replace(/<\//g, '<\\/');
    return `<script type="application/ld+json">\n${json}\n</script>`;
  }, [type, v, faqs, crumbs]);

  const missing = [];
  if (type === 'Organization' && (!v.name || !v.url)) missing.push('name and URL');
  if (type === 'LocalBusiness' && (!v.name || !v.streetAddress)) missing.push('name and address');
  if (type === 'Article' && (!v.headline || !v.image || !v.datePublished)) missing.push('headline, image and publish date');
  if (type === 'FAQPage' && !faqs.some(f => f.q.trim() && f.a.trim())) missing.push('at least one question and answer');
  if (type === 'BreadcrumbList' && crumbs.filter(c => c.name.trim() && c.url.trim()).length < 2) missing.push('at least two items with URLs');

  return (
    <div className="tool-body">
      <div className="tool-columns">
        <div className="glass-panel tool-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 className="tool-panel-title">Schema type</h3>
            <select className="option-select" aria-label="Schema type" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          {type === 'Article' && <PagePicker pages={pages} onPick={fillArticleFromPage} />}
          {type === 'BreadcrumbList' && (
            <PagePicker pages={pages} label="Build from crawled page" onPick={(page) => setCrumbs(breadcrumbsFromUrl(page.url) || crumbs)} />
          )}

          {FIELDS[type] && (
            <div className="form-grid">
              {FIELDS[type].map(f => (
                <div key={f.key} className="option-group" style={f.multiline ? { gridColumn: '1 / -1' } : undefined}>
                  <label className="option-label" htmlFor={`schema-${f.key}`}>{f.label}</label>
                  {f.multiline ? (
                    <textarea id={`schema-${f.key}`} rows="3" className="code-textarea" placeholder={f.placeholder} value={v[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} />
                  ) : (
                    <input id={`schema-${f.key}`} type={f.type || 'text'} className="option-input" placeholder={f.placeholder} value={v[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          )}

          {type === 'FAQPage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faqs.map((f, i) => (
                <div key={i} className="subpanel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="option-label">Question {i + 1}</span>
                    {faqs.length > 1 && (
                      <button type="button" className="icon-btn hover-danger" style={{ width: '28px', height: '28px' }} aria-label={`Remove question ${i + 1}`}
                        onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <input className="option-input" placeholder="What is a sitemap?" value={f.q}
                    onChange={(e) => setFaqs(faqs.map((x, j) => j === i ? { ...x, q: e.target.value } : x))} />
                  <textarea className="option-input" rows="2" style={{ resize: 'vertical' }} placeholder="The answer…" value={f.a}
                    onChange={(e) => setFaqs(faqs.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} />
                </div>
              ))}
              <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setFaqs([...faqs, { q: '', a: '' }])}>
                <Plus size={14} /><span>Add question</span>
              </button>
            </div>
          )}

          {type === 'BreadcrumbList' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {crumbs.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="cell-mono" style={{ width: '1.2rem' }}>{i + 1}</span>
                  <input className="option-input" style={{ flex: '1 1 120px' }} placeholder="Name" value={c.name}
                    onChange={(e) => setCrumbs(crumbs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <input className="option-input mono" style={{ flex: '2 1 200px' }} placeholder="https://example.com/section/" value={c.url}
                    onChange={(e) => setCrumbs(crumbs.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
                  <button type="button" className="icon-btn hover-danger" aria-label={`Remove item ${i + 1}`} disabled={crumbs.length === 1}
                    onClick={() => setCrumbs(crumbs.filter((_, j) => j !== i))}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setCrumbs([...crumbs, { name: '', url: '' }])}>
                <Plus size={14} /><span>Add item</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
          <CodeOutput code={schema} filename="JSON-LD" addToast={addToast} />
          {missing.length > 0 && (
            <span className="option-hint" style={{ color: 'var(--accent-amber)' }}>Recommended for rich results: {missing.join(', ')}.</span>
          )}
          <span className="option-hint">
            Paste this into the page's <code>&lt;head&gt;</code>, then check it with{' '}
            <a href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">
              Google's Rich Results Test <ExternalLink size={11} style={{ verticalAlign: '-1px' }} />
            </a>.
          </span>
        </div>
      </div>
    </div>
  );
}
