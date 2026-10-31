// Analysis helpers behind the SEO Tools tab

// Treat /about and /about/ (and host casing) as the same page when matching links
export function urlKey(url) {
  try {
    const u = new URL(url);
    let path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}`;
  } catch (e) {
    return url.replace(/\/+$/, '');
  }
}

// ---------------------------------------------------------------------------
// Internal link graph
// ---------------------------------------------------------------------------
export function analyzeInternalLinks(pages = []) {
  const hasLinkData = pages.some(p => Array.isArray(p.links));
  const byKey = new Map(pages.map(p => [urlKey(p.url), p]));
  const inlinks = new Map(pages.map(p => [urlKey(p.url), new Set()]));
  const brokenLinks = [];

  pages.forEach(page => {
    const sourceKey = urlKey(page.url);
    (page.links || []).forEach(link => {
      const key = urlKey(link);
      if (key === sourceKey) return;
      if (inlinks.has(key)) inlinks.get(key).add(page.url);
      const target = byKey.get(key);
      if (target && (target.statusCode >= 400)) {
        brokenLinks.push({ from: page.url, to: target.url, statusCode: target.statusCode });
      }
    });
  });

  const minDepth = pages.reduce((min, p) => Math.min(min, p.depth ?? 0), Infinity);
  const rows = pages.map(page => {
    const key = urlKey(page.url);
    const sources = inlinks.get(key) || new Set();
    const isRoot = (page.depth ?? 0) === minDepth;
    return {
      page,
      inlinks: sources.size,
      sources: [...sources],
      outlinks: (page.links || []).length,
      isOrphan: hasLinkData && sources.size === 0 && !isRoot,
      isDeep: (page.depth ?? 0) > 3
    };
  });

  return {
    hasLinkData,
    rows,
    orphans: rows.filter(r => r.isOrphan),
    deepPages: rows.filter(r => r.isDeep),
    brokenLinks,
    totalLinks: rows.reduce((sum, r) => sum + r.outlinks, 0)
  };
}

// ---------------------------------------------------------------------------
// Duplicate metadata, thin content and URL hygiene
// ---------------------------------------------------------------------------
function groupDuplicates(pages, field) {
  const groups = new Map();
  pages.forEach(page => {
    const value = (page[field] || '').trim();
    if (!value) return;
    const key = value.toLowerCase().replace(/\s+/g, ' ');
    if (!groups.has(key)) groups.set(key, { value, pages: [] });
    groups.get(key).pages.push(page);
  });
  return [...groups.values()]
    .filter(g => g.pages.length > 1)
    .sort((a, b) => b.pages.length - a.pages.length);
}

export function findContentIssues(pages = [], thinThreshold = 300) {
  const reachable = pages.filter(p => !p.fetchFailed);
  return {
    titles: groupDuplicates(reachable, 'title'),
    descriptions: groupDuplicates(reachable, 'description'),
    h1s: groupDuplicates(reachable, 'h1'),
    thin: reachable
      .filter(p => typeof p.wordCount === 'number' && p.wordCount < thinThreshold)
      .sort((a, b) => a.wordCount - b.wordCount),
    hasWordCounts: reachable.some(p => typeof p.wordCount === 'number')
  };
}

export function analyzeUrls(pages = []) {
  const results = [];
  pages.forEach(page => {
    const problems = [];
    let u;
    try {
      u = new URL(page.url);
    } catch (e) {
      results.push({ page, problems: ['Not a valid URL'] });
      return;
    }
    const path = decodeURIComponentSafe(u.pathname);
    if (page.url.length > 115) problems.push(`Long URL (${page.url.length} chars)`);
    if (/[A-Z]/.test(u.pathname)) problems.push('Uppercase letters');
    if (/_/.test(u.pathname)) problems.push('Underscores (use hyphens)');
    if (/\s|%20/.test(u.pathname)) problems.push('Spaces');
    if (u.search) problems.push('Query parameters');
    if (/\/\/+/.test(u.pathname)) problems.push('Repeated slashes');
    if (/[^\x00-\x7F]/.test(path)) problems.push('Non-ASCII characters');
    if (path.split('/').filter(Boolean).length > 4) problems.push('Deeply nested folders');
    if (u.protocol === 'http:') problems.push('Not HTTPS');
    if (problems.length > 0) results.push({ page, problems });
  });
  return results;
}

function decodeURIComponentSafe(text) {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Keyword density
// ---------------------------------------------------------------------------
const STOPWORDS = new Set(`a about above after again against all am an and any are aren't as at be because been before being below
between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further
had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm
i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our
ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them
themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we
we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's will with won't would
wouldn't you you'd you'll you're you've your yours yourself yourselves also just get got one two us use used using may might much
many new like via per`.split(/\s+/));

export function tokenize(text = '') {
  return (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [])
    .map(w => w.replace(/[’]/g, "'").replace(/^[-']+|[-']+$/g, ''))
    .filter(Boolean);
}

function topNgrams(words, n, limit) {
  const counts = new Map();
  for (let i = 0; i + n <= words.length; i++) {
    const gram = words.slice(i, i + n);
    // Skip phrases that start or end with a stopword ("of the", "the best")
    if (STOPWORDS.has(gram[0]) || STOPWORDS.has(gram[n - 1])) continue;
    if (n === 1 && (gram[0].length < 3 || /^\d+$/.test(gram[0]))) continue;
    const key = gram.join(' ');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => n === 1 || count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([phrase, count]) => ({ phrase, count, density: words.length ? (count * n * 100) / words.length : 0 }));
}

export function analyzeKeywords(text = '', targetKeyword = '') {
  const words = tokenize(text);
  const totalWords = words.length;
  const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length || (totalWords > 0 ? 1 : 0);

  let target = null;
  const targetWords = tokenize(targetKeyword);
  if (targetWords.length > 0) {
    let count = 0;
    let firstIndex = -1;
    for (let i = 0; i + targetWords.length <= words.length; i++) {
      if (targetWords.every((w, j) => words[i + j] === w)) {
        count++;
        if (firstIndex === -1) firstIndex = i;
      }
    }
    const density = totalWords ? (count * targetWords.length * 100) / totalWords : 0;
    target = {
      phrase: targetWords.join(' '),
      count,
      density,
      inFirst100: firstIndex !== -1 && firstIndex < 100,
      verdict: count === 0 ? 'missing' : density > 3 ? 'high' : density < 0.5 ? 'low' : 'good'
    };
  }

  return {
    totalWords,
    uniqueWords: new Set(words).size,
    sentences,
    avgSentenceLength: sentences ? totalWords / sentences : 0,
    readingMinutes: totalWords / 238,
    single: topNgrams(words, 1, 20),
    double: topNgrams(words, 2, 15),
    triple: topNgrams(words, 3, 10),
    target
  };
}

export function escapeHtmlAttr(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function copyText(text, addToast, successMessage = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text);
    addToast?.(successMessage, 'success');
    return true;
  } catch (e) {
    addToast?.('Clipboard access was blocked by the browser.', 'error');
    return false;
  }
}

export function downloadText(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Readable text of a fetched page (title, description, body) without scripts/styles
export function extractVisibleText(html, isMarkdown) {
  if (isMarkdown || typeof DOMParser === 'undefined') {
    return html.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript, template, svg, iframe').forEach(el => el.remove());
  const title = doc.querySelector('title')?.textContent || '';
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const body = (doc.body?.innerText || doc.body?.textContent || '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n');
  return [title, description, body].filter(Boolean).join('\n\n').trim();
}
