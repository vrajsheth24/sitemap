import * as XLSX from 'xlsx';

export function exportAuditToExcel({
  seoAudit,
  pages = [],
  hostname = 'website'
}) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  const {
    overallScore = 100,
    seoScore = 100,
    aeoScore = 100,
    geoScore = 100,
    criticalCount = 0,
    warningCount = 0,
    infoCount = 0,
    healthyCount = 0,
    issues = [],
    breakdown = {}
  } = seoAudit || {};

  // Sheet 1: Executive Summary
  const summaryRows = [
    ['SITEMAPFLOW COMPREHENSIVE WEBSITE AUDIT REPORT', ''],
    ['Generated On', new Date().toLocaleString()],
    ['Target Website', hostname],
    ['Total URLs Audited', pages.length],
    ['Fully Healthy Pages', `${healthyCount} (${pages.length > 0 ? Math.round((healthyCount / pages.length) * 100) : 0}%)`],
    ['', ''],
    ['DISCOVERY SCORES', 'SCORE (0-100)'],
    ['Overall AI & Search Visibility Score', overallScore],
    ['SEO Score (Google / Bing Search)', seoScore],
    ['AEO Score (Answer Engines & Overviews)', aeoScore],
    ['GEO Score (Generative LLMs & Citations)', geoScore],
    ['', ''],
    ['FINDINGS SEVERITY SUMMARY', 'COUNT'],
    ['Critical Issues (High Priority)', criticalCount],
    ['Warnings (Medium Priority)', warningCount],
    ['Recommendations (Optimization Tips)', infoCount],
    ['Total Findings Identified', issues.length],
    ['', ''],
    ['AUDIT CHECK BREAKDOWN', 'STATUS'],
    ['HTTP Status & Reachability', `${breakdown.statusCodes?.passed || 0} passed, ${breakdown.statusCodes?.failed || 0} failed`],
    ['Title Tags (30–60 chars)', `${breakdown.titles?.passed || 0} passed, ${breakdown.titles?.failed || 0} failed`],
    ['Meta Descriptions (100–160 chars)', `${breakdown.descriptions?.passed || 0} passed, ${breakdown.descriptions?.failed || 0} failed`],
    ['H1 Heading Hierarchy', `${breakdown.h1?.passed || 0} passed, ${breakdown.h1?.failed || 0} failed`],
    ['Canonical Tag Compliance', `${breakdown.canonical?.passed || 0} passed, ${breakdown.canonical?.failed || 0} failed`],
    ['Image Alt Text Accessibility', `${breakdown.images?.passed || 0} passed, ${breakdown.images?.failed || 0} failed`],
    ['AEO Direct Answer Passages', `${breakdown.directAnswer?.passed || 0} passed, ${breakdown.directAnswer?.failed || 0} failed`],
    ['AEO Question-Based Headings', `${breakdown.questionHeadings?.passed || 0} passed, ${breakdown.questionHeadings?.failed || 0} failed`],
    ['AEO FAQ / Q&A Structured Data', `${breakdown.faq?.passed || 0} passed, ${breakdown.faq?.failed || 0} failed`],
    ['AEO Structured Lists & Tables', `${breakdown.listsAndTables?.passed || 0} passed, ${breakdown.listsAndTables?.failed || 0} failed`],
    ['AEO E-E-A-T Author & Timestamp', `${breakdown.eat?.passed || 0} passed, ${breakdown.eat?.failed || 0} failed`],
    ['GEO Schema.org JSON-LD Entities', `${breakdown.schema?.passed || 0} passed, ${breakdown.schema?.failed || 0} failed`],
    ['GEO Topical Depth (600+ words)', `${breakdown.topicalDepth?.passed || 0} passed, ${breakdown.topicalDepth?.failed || 0} failed`],
    ['GEO Fact & Statistical Density', `${breakdown.factDensity?.passed || 0} passed, ${breakdown.factDensity?.failed || 0} failed`],
    ['GEO Outbound Authority Citations', `${breakdown.citations?.passed || 0} passed, ${breakdown.citations?.failed || 0} failed`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 42 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // Sheet 2: Action Items & Findings
  const findingsRows = issues.map((iss, idx) => ({
    '#': idx + 1,
    'Pillar': (iss.pillar || 'seo').toUpperCase(),
    'Severity': (iss.type || 'warning').toUpperCase(),
    'Category': iss.category || 'General',
    'Issue Message': iss.message || '',
    'Specific Detail': iss.detail || '',
    'Affected Page URL': iss.url || '',
    'Actionable Recommendation': iss.recommendation || ''
  }));

  const wsFindings = XLSX.utils.json_to_sheet(findingsRows.length > 0 ? findingsRows : [{ 'Result': 'No issues detected across all audited checks.' }]);
  wsFindings['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 12 },
    { wch: 22 },
    { wch: 45 },
    { wch: 18 },
    { wch: 60 },
    { wch: 75 }
  ];
  XLSX.utils.book_append_sheet(wb, wsFindings, 'Action Items & Findings');

  // Sheet 3: All Pages Inventory
  const inventoryRows = pages.map((p, idx) => ({
    '#': idx + 1,
    'Page URL': p.url,
    'HTTP Status': p.statusCode || 200,
    'Title Tag': p.title || '',
    'Title Length': p.title ? p.title.length : 0,
    'Meta Description': p.description || '',
    'Description Length': p.description ? p.description.length : 0,
    'H1 Heading': p.h1 || '',
    'H1 Count': p.h1Count !== undefined ? p.h1Count : (p.h1 ? 1 : 0),
    'Canonical URL': p.canonicalHref || '',
    'Canonical Matches?': p.isCanonicalMatching ? 'YES' : 'NO',
    'Indexable?': p.isIndexable ? 'YES' : 'NO',
    'Word Count': p.wordCount || 0,
    'Response Latency (ms)': p.loadTime || 0,
    'Total Images': p.imagesCount || 0,
    'Images Missing Alt': p.missingAltCount || 0,
    'Schema.org Entities': Array.isArray(p.schemas) ? p.schemas.join(', ') : '',
    'Crawl Depth': p.depth !== undefined ? p.depth : 1,
    'Sitemap Priority': p.priority || 0.7,
    'Change Frequency': p.changefreq || 'weekly'
  }));

  const wsInventory = XLSX.utils.json_to_sheet(inventoryRows.length > 0 ? inventoryRows : [{ 'Result': 'No pages' }]);
  wsInventory['!cols'] = [
    { wch: 6 },
    { wch: 55 },
    { wch: 12 },
    { wch: 40 },
    { wch: 12 },
    { wch: 55 },
    { wch: 12 },
    { wch: 35 },
    { wch: 10 },
    { wch: 55 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsInventory, 'All Pages Inventory');

  // Sheet 4: AEO & GEO Deep Signals
  const aeoGeoRows = pages.map((p, idx) => ({
    '#': idx + 1,
    'Page URL': p.url,
    'Direct Answer Ready?': p.hasDirectAnswer ? 'YES' : 'NO',
    'Direct Answer Sample': p.directAnswerSample || '',
    'Question Headings Count': p.questionHeadings ? p.questionHeadings.length : 0,
    'Question Headings Sample': p.questionHeadings ? p.questionHeadings.slice(0, 3).join(' | ') : '',
    'FAQ Detected?': p.hasFaq ? 'YES' : 'NO',
    'Lists Count': p.listsCount || 0,
    'Tables Count': p.tablesCount || 0,
    'Author Name': p.authorName || '',
    'Date Published': p.datePublished || '',
    'Fact Density (Data Points)': p.statDensity || 0,
    'External Citations Count': p.externalLinksCount || 0
  }));

  const wsAeoGeo = XLSX.utils.json_to_sheet(aeoGeoRows.length > 0 ? aeoGeoRows : [{ 'Result': 'No pages' }]);
  wsAeoGeo['!cols'] = [
    { wch: 6 },
    { wch: 55 },
    { wch: 18 },
    { wch: 50 },
    { wch: 20 },
    { wch: 45 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAeoGeo, 'AEO & GEO Signals');

  const cleanHost = (hostname || 'website').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${cleanHost}_comprehensive_seo_audit_${dateStr}.xlsx`;

  if (typeof window !== 'undefined') {
    XLSX.writeFile(wb, filename);
  }

  return { wb, filename };
}
