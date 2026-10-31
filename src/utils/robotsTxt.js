// robots.txt parsing and matching (Google-style: most specific user-agent group,
// longest matching rule wins, Allow wins ties, `*` wildcards and `$` end anchors)

function ruleToRegex(value) {
  const escaped = value
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\\\$$/, '$');
  return new RegExp('^' + escaped);
}

export function parseRobotsTxt(text = '') {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();

    if (field === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }

    if (field === 'user-agent') {
      // Consecutive user-agent lines share one group
      if (!lastWasAgent || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }

    lastWasAgent = false;
    if (!current || (field !== 'allow' && field !== 'disallow')) continue;
    // An empty Disallow means "allow everything" and adds no rule
    if (!value) continue;
    current.rules.push({ allow: field === 'allow', value, length: value.length, regex: ruleToRegex(value) });
  }

  return { groups, sitemaps };
}

// Picks the rules that apply to a user-agent string: the group with the longest
// agent token contained in the UA, otherwise the `*` group(s).
export function getRulesForAgent(parsed, userAgent = '*') {
  const ua = userAgent.toLowerCase();
  let bestLength = 0;
  let specific = [];
  for (const group of parsed.groups) {
    for (const agent of group.agents) {
      if (agent === '*' || !ua.includes(agent)) continue;
      if (agent.length > bestLength) {
        bestLength = agent.length;
        specific = [group];
      } else if (agent.length === bestLength) {
        specific.push(group);
      }
    }
  }
  const groups = specific.length > 0 ? specific : parsed.groups.filter(g => g.agents.includes('*'));
  return {
    agent: specific.length > 0 ? specific[0].agents.find(a => ua.includes(a)) : '*',
    rules: groups.flatMap(g => g.rules)
  };
}

export function checkUrlAgainstRules(rules, urlStr) {
  let path = urlStr;
  try {
    const u = new URL(urlStr);
    path = u.pathname + u.search;
  } catch (e) {
    if (!path.startsWith('/')) path = '/' + path;
  }

  let best = null;
  for (const rule of rules) {
    if (!rule.regex.test(path)) continue;
    if (!best || rule.length > best.length || (rule.length === best.length && rule.allow)) {
      best = rule;
    }
  }
  return { allowed: !best || best.allow, rule: best, path };
}
