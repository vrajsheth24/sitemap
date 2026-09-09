// Hierarchical directory tree builder for sitemap visualization

export function buildDirectoryTree(pages = []) {
  if (!pages || pages.length === 0) {
    return null;
  }

  // Determine root domain
  let rootDomain = 'Website';
  try {
    const firstUrl = new URL(pages[0].url);
    rootDomain = firstUrl.hostname;
  } catch (e) {
    // fallback
  }

  const rootNode = {
    id: 'root',
    name: rootDomain,
    path: '/',
    isFolder: true,
    page: null,
    children: [],
    pageCount: 0,
    depth: 0,
  };

  pages.forEach(page => {
    let pathname = '/';
    try {
      const u = new URL(page.url);
      pathname = u.pathname;
    } catch (e) {
      pathname = '/' + page.url.replace(/^https?:\/\/[^/]+/, '');
    }

    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      // Root homepage
      rootNode.page = page;
      rootNode.pageCount++;
      return;
    }

    let currentNode = rootNode;
    let accumulatedPath = '';

    segments.forEach((seg, idx) => {
      accumulatedPath += '/' + seg;
      const isLast = idx === segments.length - 1;

      let existingChild = currentNode.children.find(c => c.name === seg);

      if (!existingChild) {
        existingChild = {
          id: `node-${accumulatedPath.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: seg,
          path: accumulatedPath,
          isFolder: !isLast,
          page: isLast ? page : null,
          children: [],
          pageCount: 0,
          depth: idx + 1,
        };
        currentNode.children.push(existingChild);
      } else if (isLast) {
        existingChild.page = page;
      }

      existingChild.pageCount++;
      currentNode = existingChild;
    });

    rootNode.pageCount++;
  });

  return rootNode;
}
