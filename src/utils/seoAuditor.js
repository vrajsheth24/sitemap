// ============================================================================
// Comprehensive SEO, AEO & GEO Website Audit Engine
// ----------------------------------------------------------------------------
// Triple-Pillar Optimization:
// 1. SEO (Search Engine Optimization): Status, Meta, Headings, Canonicals, Images, Speed
// 2. AEO (Answer Engine Optimization): Direct Answerability, Question Headings, FAQ, Lists/Tables, E-E-A-T
// 3. GEO (Generative Engine Optimization): Schema Entities, Fact Density, Topical Depth, Citations
// ============================================================================

export function runSeoAudit(pages = []) {
  if (!pages || pages.length === 0) {
    return {
      score: 100,
      overallScore: 100,
      seoScore: 100,
      aeoScore: 100,
      geoScore: 100,
      totalChecked: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      healthyCount: 0,
      issues: [],
      seoIssues: [],
      aeoIssues: [],
      geoIssues: [],
      pillarCounts: {
        seo: { critical: 0, warning: 0, info: 0, score: 100 },
        aeo: { critical: 0, warning: 0, info: 0, score: 100 },
        geo: { critical: 0, warning: 0, info: 0, score: 100 }
      },
      breakdown: {
        titles: { passed: 0, failed: 0 },
        descriptions: { passed: 0, failed: 0 },
        h1: { passed: 0, failed: 0 },
        statusCodes: { passed: 0, failed: 0 },
        canonical: { passed: 0, failed: 0 },
        images: { passed: 0, failed: 0 },
        performance: { passed: 0, failed: 0 },
        directAnswer: { passed: 0, failed: 0 },
        questionHeadings: { passed: 0, failed: 0 },
        faq: { passed: 0, failed: 0 },
        listsAndTables: { passed: 0, failed: 0 },
        eat: { passed: 0, failed: 0 },
        schema: { passed: 0, failed: 0 },
        factDensity: { passed: 0, failed: 0 },
        topicalDepth: { passed: 0, failed: 0 },
        citations: { passed: 0, failed: 0 }
      }
    };
  }

  const issues = [];
  let healthyPages = 0;

  // Track duplicate titles and descriptions across all pages
  const titleMap = new Map();
  const descMap = new Map();
  pages.forEach(p => {
    if (p.title && p.title.trim()) {
      const t = p.title.trim().toLowerCase();
      titleMap.set(t, (titleMap.get(t) || 0) + 1);
    }
    if (p.description && p.description.trim()) {
      const d = p.description.trim().toLowerCase();
      descMap.set(d, (descMap.get(d) || 0) + 1);
    }
  });

  const breakdown = {
    titles: { passed: 0, failed: 0 },
    descriptions: { passed: 0, failed: 0 },
    h1: { passed: 0, failed: 0 },
    statusCodes: { passed: 0, failed: 0 },
    canonical: { passed: 0, failed: 0 },
    images: { passed: 0, failed: 0 },
    performance: { passed: 0, failed: 0 },
    directAnswer: { passed: 0, failed: 0 },
    questionHeadings: { passed: 0, failed: 0 },
    faq: { passed: 0, failed: 0 },
    listsAndTables: { passed: 0, failed: 0 },
    eat: { passed: 0, failed: 0 },
    schema: { passed: 0, failed: 0 },
    factDensity: { passed: 0, failed: 0 },
    topicalDepth: { passed: 0, failed: 0 },
    citations: { passed: 0, failed: 0 }
  };

  let seoPenalties = 0;
  let aeoPenalties = 0;
  let geoPenalties = 0;

  pages.forEach(page => {
    const pageIssues = [];
    const isUnreached = page.fetchFailed || (!page.statusCode && page.statusCode !== 0);

    // =========================================================================
    // PILLAR 1: SEO (Search Engine Optimization)
    // =========================================================================

    // 1. HTTP Status & Reachability
    if (page.fetchFailed || page.statusCode === 0) {
      pageIssues.push({
        pillar: 'seo',
        type: 'critical',
        category: 'HTTP Status',
        message: 'Page could not be reached during the crawl.',
        recommendation: page.fetchError || 'Check that the URL is active and reachable. Configure a custom CORS proxy in Options if cross-origin access is restricted.'
      });
      breakdown.statusCodes.failed++;
      seoPenalties += 25;
    } else if (page.statusCode >= 500) {
      pageIssues.push({
        pillar: 'seo',
        type: 'critical',
        category: 'HTTP Status',
        message: `HTTP ${page.statusCode} Server Error.`,
        recommendation: 'Fix internal server crash or upstream gateway error. Search engines will de-index 5xx pages.'
      });
      breakdown.statusCodes.failed++;
      seoPenalties += 25;
    } else if (page.statusCode >= 400) {
      pageIssues.push({
        pillar: 'seo',
        type: 'critical',
        category: 'HTTP Status',
        message: `HTTP ${page.statusCode} Broken URL / Client Error.`,
        recommendation: 'Fix broken link, redirect 301 to working equivalent, or remove from sitemap.'
      });
      breakdown.statusCodes.failed++;
      seoPenalties += 25;
    } else if (page.statusCode >= 300) {
      pageIssues.push({
        pillar: 'seo',
        type: 'warning',
        category: 'HTTP Status',
        message: `HTTP ${page.statusCode} Redirect URL in sitemap.`,
        recommendation: 'Replace redirected URL in your sitemap with the final 200 OK destination URL.'
      });
      breakdown.statusCodes.failed++;
      seoPenalties += 6;
    } else {
      breakdown.statusCodes.passed++;
    }

    // Only audit content on reached pages to prevent false findings on network failures
    if (!isUnreached) {
      // 2. Page Title Tag
      if (!page.title || page.title.trim().length === 0) {
        pageIssues.push({
          pillar: 'seo',
          type: 'critical',
          code: 'TITLE_MISSING',
          category: 'Page Title',
          message: 'Missing <title> tag entirely.',
          recommendation: 'Add a distinct, keyword-targeted <title> between 30 and 60 characters.'
        });
        breakdown.titles.failed++;
        seoPenalties += 20;
      } else if (page.title.length < 25) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'TITLE_TOO_SHORT',
          category: 'Page Title',
          message: 'Title is unusually short (<25 chars).',
          detail: `${page.title.length} chars`,
          recommendation: 'Expand title to 35-60 characters for optimal click-through rates in SERPs.'
        });
        breakdown.titles.failed++;
        seoPenalties += 5;
      } else if (page.title.length > 65) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'TITLE_TOO_LONG',
          category: 'Page Title',
          message: 'Title exceeds standard SERP truncation limit (65+ chars).',
          detail: `${page.title.length} chars`,
          recommendation: 'Keep titles under 60-65 characters to prevent snippet ellipsis in Google and Bing.'
        });
        breakdown.titles.failed++;
        seoPenalties += 4;
      } else {
        breakdown.titles.passed++;
      }

      // Duplicate title check
      if (page.title && titleMap.get(page.title.trim().toLowerCase()) > 1) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'TITLE_DUPLICATE',
          category: 'Page Title',
          message: 'Duplicate title tag detected across multiple pages.',
          recommendation: 'Every indexed page should have a unique, descriptive title tag to avoid internal keyword cannibalization.'
        });
        seoPenalties += 4;
      }

      // 3. Meta Description Check
      if (!page.description || page.description.trim().length === 0) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'DESC_MISSING',
          category: 'Meta Description',
          message: 'Missing meta description tag.',
          recommendation: 'Provide a compelling 120-160 character description summarizing the page value proposition.'
        });
        breakdown.descriptions.failed++;
        seoPenalties += 8;
      } else if (page.description.length < 60) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'DESC_TOO_SHORT',
          category: 'Meta Description',
          message: 'Meta description is unusually short (<60 chars).',
          detail: `${page.description.length} chars`,
          recommendation: 'Elaborate between 120 and 160 characters for rich, informative SERP snippets.'
        });
        breakdown.descriptions.failed++;
        seoPenalties += 4;
      } else if (page.description.length > 165) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'DESC_TOO_LONG',
          category: 'Meta Description',
          message: 'Meta description exceeds standard snippet length (160+ chars).',
          detail: `${page.description.length} chars`,
          recommendation: 'Keep descriptions under 160 characters to avoid truncation on mobile and desktop search results.'
        });
        breakdown.descriptions.failed++;
        seoPenalties += 3;
      } else {
        breakdown.descriptions.passed++;
      }

      // Duplicate description check
      if (page.description && descMap.get(page.description.trim().toLowerCase()) > 1) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'DESC_DUPLICATE',
          category: 'Meta Description',
          message: 'Duplicate meta description shared across multiple pages.',
          recommendation: 'Craft unique meta descriptions tailored to the individual topic of each URL.'
        });
        seoPenalties += 3;
      }

      // 4. H1 Heading Tag
      if (!page.h1 || page.h1.trim().length === 0) {
        pageIssues.push({
          pillar: 'seo',
          type: 'critical',
          code: 'H1_MISSING',
          category: 'Heading Structure',
          message: 'Missing primary <h1> heading tag.',
          recommendation: 'Every indexable page must contain exactly one prominent <h1> tag matching user search intent.'
        });
        breakdown.h1.failed++;
        seoPenalties += 15;
      } else if (page.h1Count > 1) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'H1_MULTIPLE',
          category: 'Heading Structure',
          message: 'Multiple <h1> headings detected on single page.',
          detail: `${page.h1Count} H1 tags`,
          recommendation: 'Best practice is to maintain a single <h1> heading per page and structure subtopics with <h2> and <h3>.'
        });
        breakdown.h1.failed++;
        seoPenalties += 4;
      } else {
        breakdown.h1.passed++;
      }

      // 5. Canonical URL
      if (!page.hasCanonical) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'CANONICAL_MISSING',
          category: 'Canonical URL',
          message: 'No canonical URL specified (<link rel="canonical">).',
          recommendation: 'Add self-referencing canonical tag to guard against duplicate content penalties across query params.'
        });
        breakdown.canonical.failed++;
        seoPenalties += 6;
      } else if (page.isCanonicalMatching === false) {
        pageIssues.push({
          pillar: 'seo',
          type: 'info',
          code: 'CANONICAL_MISMATCH',
          category: 'Canonical URL',
          message: 'Canonical tag points to an alternate URL.',
          detail: page.canonicalHref,
          recommendation: 'Ensure this cross-URL canonical is deliberate to avoid unintentional indexing suppression.'
        });
        breakdown.canonical.passed++;
      } else {
        breakdown.canonical.passed++;
      }

      // 6. Image Optimization & Alt text
      if (page.missingAltCount && page.missingAltCount > 0) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'IMAGE_MISSING_ALT',
          category: 'Image Optimization',
          message: 'Images missing descriptive alt text.',
          detail: `${page.missingAltCount} missing alts`,
          recommendation: 'Provide concise, descriptive alt attributes for accessibility compliance (WCAG) and Google Image SEO.'
        });
        breakdown.images.failed++;
        seoPenalties += 4;
      } else {
        breakdown.images.passed++;
      }

      // 7. Response Time & Speed (threshold for genuine server bottlenecks)
      if (page.loadTime && page.loadTime > 2500) {
        pageIssues.push({
          pillar: 'seo',
          type: 'warning',
          code: 'SLOW_LATENCY',
          category: 'Performance',
          message: 'Extreme server response latency detected (>2500ms).',
          detail: `${page.loadTime}ms`,
          recommendation: 'Optimize server response time (TTFB), leverage CDN caching, and compress static assets.'
        });
        breakdown.performance.failed++;
        seoPenalties += 4;
      } else {
        breakdown.performance.passed++;
      }

      // =======================================================================
      // PILLAR 2: AEO (Answer Engine Optimization)
      // Optimized for Perplexity, ChatGPT Search, Google AI Overviews, Copilot
      // =======================================================================

      // 8. Direct Answerability (Definition Paragraph in top content)
      if (page.wordCount > 150 && !page.hasDirectAnswer) {
        pageIssues.push({
          pillar: 'aeo',
          type: 'warning',
          category: 'Direct Answerability',
          message: 'Lacks concise direct answer / definition in top 200 words.',
          recommendation: 'Place a clear 35-75 word definitive summary paragraph immediately beneath the <h1> heading so AI answer engines (Perplexity, AI Overviews) can quote it directly.'
        });
        breakdown.directAnswer.failed++;
        aeoPenalties += 25;
      } else {
        breakdown.directAnswer.passed++;
      }

      // 9. Question-Formatted Headings
      if (page.wordCount > 250 && (!page.questionHeadings || page.questionHeadings.length === 0)) {
        pageIssues.push({
          pillar: 'aeo',
          type: 'info',
          category: 'Question Headings',
          message: 'No question-based headings found (What, How, Why, When, Can).',
          recommendation: 'Convert key <h2> or <h3> subheadings into conversational questions (e.g. "How does it work?", "What are the benefits?") to match user voice queries and AI prompts.'
        });
        breakdown.questionHeadings.failed++;
        aeoPenalties += 15;
      } else {
        breakdown.questionHeadings.passed++;
      }

      // 10. Structured FAQ & Q&A Markup
      if (!page.hasFaq && !page.hasFaqSchema && page.depth <= 2) {
        pageIssues.push({
          pillar: 'aeo',
          type: 'info',
          category: 'FAQ Structure',
          message: 'No FAQ section or FAQPage schema detected.',
          recommendation: 'Add a frequently asked questions section with FAQPage schema.org markup to trigger expandable accordion snippets in AI search.'
        });
        breakdown.faq.failed++;
        aeoPenalties += 20;
      } else {
        breakdown.faq.passed++;
      }

      // 11. Bulleted Lists & Comparison Tables
      if (page.wordCount > 400 && !page.hasLists && !page.hasTables) {
        pageIssues.push({
          pillar: 'aeo',
          type: 'warning',
          category: 'Content Structure',
          message: 'Content lacks structured bulleted lists or comparison tables.',
          recommendation: 'Organize steps with <ol>/<ul> and compare specifications in <table> elements. AI engines extract these directly into AI snapshot answers.'
        });
        breakdown.listsAndTables.failed++;
        aeoPenalties += 20;
      } else {
        breakdown.listsAndTables.passed++;
      }

      // 12. E-E-A-T Author & Timestamp Signals
      if (!page.hasAuthor && !page.hasDate && page.depth <= 2) {
        pageIssues.push({
          pillar: 'aeo',
          type: 'info',
          category: 'E-E-A-T Authority',
          message: 'Missing visible author byline or last updated timestamp.',
          recommendation: 'Display author credentials, publication date, and last modified date to build Experience, Expertise, Authoritativeness, and Trustworthiness.'
        });
        breakdown.eat.failed++;
        aeoPenalties += 15;
      } else {
        breakdown.eat.passed++;
      }

      // =======================================================================
      // PILLAR 3: GEO (Generative Engine Optimization)
      // Optimized for Claude, Gemini, ChatGPT, SearchGPT citation networks
      // =======================================================================

      // 13. Schema.org JSON-LD Entities
      if (!page.hasSchema || !page.schemas || page.schemas.length === 0) {
        pageIssues.push({
          pillar: 'geo',
          type: 'warning',
          category: 'Semantic Entities',
          message: 'No Schema.org JSON-LD structured data detected.',
          recommendation: 'Add Schema.org JSON-LD markup (e.g. Article, Organization, Product, SoftwareApplication) to explicitly map entities into AI Knowledge Graphs.'
        });
        breakdown.schema.failed++;
        geoPenalties += 30;
      } else {
        breakdown.schema.passed++;
      }

      // 14. Topical Depth & Word Count
      if (page.wordCount < 300) {
        pageIssues.push({
          pillar: 'geo',
          type: 'warning',
          code: 'THIN_CONTENT',
          category: 'Topical Depth',
          message: 'Thin page content detected (<300 words).',
          detail: `${page.wordCount} words`,
          recommendation: 'Expand content with comprehensive explanations, examples, and technical nuances. Generative engines favor in-depth authoritative resources.'
        });
        breakdown.topicalDepth.failed++;
        geoPenalties += 25;
      } else {
        breakdown.topicalDepth.passed++;
      }

      // 15. Factual & Statistical Density
      if (page.wordCount > 350 && (page.statDensity || 0) < 2) {
        pageIssues.push({
          pillar: 'geo',
          type: 'info',
          category: 'Fact & Stat Density',
          message: 'Low density of numerical data points, percentages, or verified facts.',
          recommendation: 'Incorporate concrete statistics, benchmark percentages, and empirical metrics. Generative LLMs strongly prefer citing quantitative evidence.'
        });
        breakdown.factDensity.failed++;
        geoPenalties += 20;
      } else {
        breakdown.factDensity.passed++;
      }

      // 16. Outbound Citations & Reference Sources
      if (page.wordCount > 600 && (!page.externalLinksCount || page.externalLinksCount === 0)) {
        pageIssues.push({
          pillar: 'geo',
          type: 'info',
          category: 'Authority Citations',
          message: 'No external citations or authoritative reference links found.',
          recommendation: 'Reference reputable primary sources, industry studies, and official documentation to anchor factual claims in trusted link networks.'
        });
        breakdown.citations.failed++;
        geoPenalties += 15;
      } else {
        breakdown.citations.passed++;
      }
    }

    // A page is considered fully healthy if it has zero critical and warning issues
    if (!pageIssues.some(iss => iss.type === 'critical' || iss.type === 'warning')) {
      healthyPages++;
    }

    pageIssues.forEach(iss => {
      issues.push({
        ...iss,
        url: page.url,
        pageTitle: page.title || '(Untitled)'
      });
    });
  });

  // Calculate Pillar-specific scores (0-100)
  const pageCount = Math.max(1, pages.length);
  const seoScore = Math.max(15, Math.min(100, Math.round(100 - (seoPenalties / pageCount))));
  const aeoScore = Math.max(20, Math.min(100, Math.round(100 - (aeoPenalties / pageCount))));
  const geoScore = Math.max(20, Math.min(100, Math.round(100 - (geoPenalties / pageCount))));

  // Overall Weighted Score: 45% SEO, 30% AEO, 25% GEO
  const overallScore = Math.round(seoScore * 0.45 + aeoScore * 0.30 + geoScore * 0.25);

  // Group issues by pillar and severity with 100% deterministic secondary sorting
  const severityRank = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => {
    if (severityRank[a.type] !== severityRank[b.type]) {
      return severityRank[a.type] - severityRank[b.type];
    }
    const urlCmp = (a.url || '').localeCompare(b.url || '');
    if (urlCmp !== 0) return urlCmp;
    return (a.category || '').localeCompare(b.category || '');
  });

  const seoIssues = issues.filter(i => i.pillar === 'seo');
  const aeoIssues = issues.filter(i => i.pillar === 'aeo');
  const geoIssues = issues.filter(i => i.pillar === 'geo');

  const criticalCount = issues.filter(i => i.type === 'critical').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const infoCount = issues.filter(i => i.type === 'info').length;

  return {
    score: overallScore, // Backwards compatible with existing UI metric cards
    overallScore,
    seoScore,
    aeoScore,
    geoScore,
    totalChecked: pages.length,
    criticalCount,
    warningCount,
    infoCount,
    healthyCount: healthyPages,
    issues,
    seoIssues,
    aeoIssues,
    geoIssues,
    pillarCounts: {
      seo: {
        critical: seoIssues.filter(i => i.type === 'critical').length,
        warning: seoIssues.filter(i => i.type === 'warning').length,
        info: seoIssues.filter(i => i.type === 'info').length,
        score: seoScore
      },
      aeo: {
        critical: aeoIssues.filter(i => i.type === 'critical').length,
        warning: aeoIssues.filter(i => i.type === 'warning').length,
        info: aeoIssues.filter(i => i.type === 'info').length,
        score: aeoScore
      },
      geo: {
        critical: geoIssues.filter(i => i.type === 'critical').length,
        warning: geoIssues.filter(i => i.type === 'warning').length,
        info: geoIssues.filter(i => i.type === 'info').length,
        score: geoScore
      }
    },
    breakdown
  };
}