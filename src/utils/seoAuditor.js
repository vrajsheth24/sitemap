// Comprehensive client-side SEO Health & Audit Engine

export function runSeoAudit(pages = []) {
  if (!pages || pages.length === 0) {
    return {
      score: 100,
      totalChecked: 0,
      criticalCount: 0,
      warningCount: 0,
      healthyCount: 0,
      issues: [],
      breakdown: {
        titles: { passed: 0, failed: 0 },
        descriptions: { passed: 0, failed: 0 },
        h1: { passed: 0, failed: 0 },
        statusCodes: { passed: 0, failed: 0 },
        performance: { passed: 0, failed: 0 },
        canonical: { passed: 0, failed: 0 }
      }
    };
  }

  const issues = [];
  let criticalCount = 0;
  let warningCount = 0;
  let healthyPages = 0;

  const breakdown = {
    titles: { passed: 0, failed: 0 },
    descriptions: { passed: 0, failed: 0 },
    h1: { passed: 0, failed: 0 },
    statusCodes: { passed: 0, failed: 0 },
    performance: { passed: 0, failed: 0 },
    canonical: { passed: 0, failed: 0 }
  };

  pages.forEach(page => {
    const pageIssues = [];

    // 1. HTTP Status Check
    if (page.statusCode >= 400) {
      pageIssues.push({
        type: 'critical',
        category: 'HTTP Status',
        message: `Page returned HTTP ${page.statusCode} error.`,
        recommendation: 'Fix broken link, redirect to active equivalent, or remove from sitemap.'
      });
      breakdown.statusCodes.failed++;
    } else {
      breakdown.statusCodes.passed++;
    }

    // 2. Title Tag Check
    if (!page.title || page.title.trim().length === 0) {
      pageIssues.push({
        type: 'critical',
        category: 'Page Title',
        message: 'Missing <title> tag entirely.',
        recommendation: 'Add a distinct, keyword-targeted <title> between 30 and 60 characters.'
      });
      breakdown.titles.failed++;
    } else if (page.title.length < 20) {
      pageIssues.push({
        type: 'warning',
        category: 'Page Title',
        message: `Title is unusually short (${page.title.length} characters).`,
        recommendation: 'Expand title to 30-60 characters for optimal click-through rates.'
      });
      breakdown.titles.failed++;
    } else if (page.title.length > 70) {
      pageIssues.push({
        type: 'warning',
        category: 'Page Title',
        message: `Title exceeds standard truncation limit (${page.title.length} chars).`,
        recommendation: 'Keep titles under 60-65 characters to prevent snippet ellipsis in SERPs.'
      });
      breakdown.titles.failed++;
    } else {
      breakdown.titles.passed++;
    }

    // 3. Meta Description Check
    if (!page.description || page.description.trim().length === 0) {
      pageIssues.push({
        type: 'warning',
        category: 'Meta Description',
        message: 'Missing meta description.',
        recommendation: 'Provide a compelling 120-160 character description summarizing the page.'
      });
      breakdown.descriptions.failed++;
    } else if (page.description.length < 50) {
      pageIssues.push({
        type: 'warning',
        category: 'Meta Description',
        message: `Meta description is very short (${page.description.length} chars).`,
        recommendation: 'Elaborate between 120 and 160 characters for rich SERP snippets.'
      });
      breakdown.descriptions.failed++;
    } else {
      breakdown.descriptions.passed++;
    }

    // 4. H1 Tag Check
    if (!page.h1 || page.h1.trim().length === 0) {
      pageIssues.push({
        type: 'warning',
        category: 'Heading Structure',
        message: 'Missing <h1> heading tag.',
        recommendation: 'Every indexable page should have exactly one prominent <h1> tag.'
      });
      breakdown.h1.failed++;
    } else {
      breakdown.h1.passed++;
    }

    // 5. Canonical Check
    if (page.hasCanonical === false) {
      pageIssues.push({
        type: 'info',
        category: 'Canonical URL',
        message: 'No canonical URL specified.',
        recommendation: 'Add <link rel="canonical"> to guard against duplicate content penalties.'
      });
      breakdown.canonical.failed++;
    } else {
      breakdown.canonical.passed++;
    }

    // 6. Response Time Check
    if (page.loadTime && page.loadTime > 500) {
      pageIssues.push({
        type: 'warning',
        category: 'Performance',
        message: `High response time detected (${page.loadTime}ms).`,
        recommendation: 'Optimize server response time and enable asset caching to stay under 400ms.'
      });
      breakdown.performance.failed++;
    } else {
      breakdown.performance.passed++;
    }

    if (pageIssues.length === 0) {
      healthyPages++;
    } else {
      pageIssues.forEach(iss => {
        if (iss.type === 'critical') criticalCount++;
        else if (iss.type === 'warning') warningCount++;
        issues.push({ ...iss, url: page.url, pageTitle: page.title });
      });
    }
  });

  // Calculate score 0-100: deduct 15 for critical, 5 for warning, clamp between 0 and 100
  const penalty = (criticalCount * 15) + (warningCount * 4);
  const score = Math.max(10, Math.min(100, Math.round(100 - (penalty / (pages.length || 1)))));

  return {
    score,
    totalChecked: pages.length,
    criticalCount,
    warningCount,
    healthyCount: healthyPages,
    issues,
    breakdown
  };
}
