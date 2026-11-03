// Generates the profile cards in assets/. Node 20+, no dependencies.
// Text is drawn from glyphs.json (Saira, JetBrains Mono: SIL OFL) because SVGs loaded as images cannot use web fonts.
// Usage: GITHUB_TOKEN=... node scripts/generate.mjs   (without a token, the activity card is left untouched)
import { readFileSync, writeFileSync } from 'node:fs';

const LOGIN = 'Anthony72727';
const root = new URL('../', import.meta.url);
const glyphs = JSON.parse(readFileSync(new URL('scripts/glyphs.json', root)));
const badminton = JSON.parse(readFileSync(new URL('data/badminton.json', root)));

const C = { bg: '#0A1224', panel: '#101B31', line: '#263650', ink: '#E8EEF8', muted: '#93A6C2', green: '#3DFF9E', cyan: '#2BD9F0', amber: '#FFC857' };
const HEAT = ['#17243B', '#0F4F41', '#148A63', '#25C283', '#3DFF9E'];
const n = (v) => +v.toFixed(1);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const width = (s, size, font = 'mono') => [...s].reduce((w, c) => w + (glyphs[font][c]?.a ?? 600), 0) * size / 1000;
function text(s, x, y, { size = 14, font = 'mono', fill = C.ink, anchor = 'start', track = 0 } = {}) {
  const k = size / 1000;
  const chars = [...s];
  let cx = x;
  if (anchor !== 'start') {
    const w = width(s, size, font) + track * (chars.length - 1);
    cx -= anchor === 'end' ? w : w / 2;
  }
  let d = '';
  for (const c of chars) {
    const g = glyphs[font][c] ?? glyphs[font]['?'];
    for (const [t, ...a] of g.p) {
      d += t;
      for (let i = 0; i < a.length; i += 2) d += `${n(cx + a[i] * k)} ${n(y + a[i + 1] * k)} `;
    }
    cx += g.a * k + track;
  }
  return `<path fill="${fill}" d="${d.trim()}"/>`;
}
const label = (s, x, y, o = {}) => text(s, x, y, { size: 12, fill: C.muted, track: 0.8, ...o });

const svg = (w, h, title, body, style = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${style ? `<style>${style}</style>` : ''}<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="14" fill="${C.bg}" stroke="${C.line}"/>${body}</svg>\n`;
const save = (name, content) => writeFileSync(new URL(`assets/${name}.svg`, root), content);

// Court drawn to the BWF dimensions, in metres: 13.40 x 6.10, singles sidelines 0.46 in,
// short service lines 1.98 from the net, doubles long service lines 0.76 from the back.
function court(x, y, s, { stroke = C.green, opacity = 0.75, sw = 1.25, area } = {}) {
  const L = 13.4 * s, H = 6.1 * s, mid = x + L / 2, cy = y + H / 2;
  const v = (px) => `M${n(px)} ${n(y)}V${n(y + H)}`;
  const h = (py) => `M${n(x)} ${n(py)}H${n(x + L)}`;
  const d = [h(y + 0.46 * s), h(y + H - 0.46 * s), v(mid - 1.98 * s), v(mid + 1.98 * s), v(x + 0.76 * s), v(x + L - 0.76 * s),
    `M${n(x)} ${n(cy)}H${n(mid - 1.98 * s)}M${n(mid + 1.98 * s)} ${n(cy)}H${n(x + L)}`].join('');
  const fill = area === 'singles' ? `<rect x="${n(x)}" y="${n(y + 0.46 * s)}" width="${n(L)}" height="${n(H - 0.92 * s)}" fill="${C.green}" fill-opacity=".2"/>`
    : area === 'doubles' ? `<rect x="${n(x)}" y="${n(y)}" width="${n(L)}" height="${n(H)}" fill="${C.green}" fill-opacity=".2"/>` : '';
  return `${fill}<g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${sw}"><path d="${d}"/><rect x="${n(x)}" y="${n(y)}" width="${n(L)}" height="${n(H)}"/></g><path d="M${n(mid)} ${n(y - 4)}V${n(y + H + 4)}" stroke="${C.cyan}" stroke-width="${sw + 0.75}" stroke-linecap="round"/>`;
}
function shuttle(x, y, size, angle) {
  const s = n(size / 30);
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${angle}) scale(${s})"><path d="M-5 -5L-27 -14V14L-5 5Z" fill="${C.bg}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/><path d="M-5 -2L-27 -6M-5 2L-27 6M-15 -9.5V9.5" fill="none" stroke="${C.ink}" stroke-width="1"/><path d="M-5 -6.5A7 7 0 0 1 -5 6.5Z" fill="${C.green}"/></g>`;
}

// Banner
const PULSE = '.flow{animation:flow 9s linear infinite}.dot{animation:dot 2.8s ease-in-out infinite}@keyframes flow{to{stroke-dashoffset:-96}}@keyframes dot{50%{opacity:.35}}@media (prefers-reduced-motion:reduce){.flow,.dot{animation:none}}';
function statusPill(x, y) {
  const s = 'OPEN TO APPRENTICESHIP', w = width(s, 12) + 0.8 * s.length + 44;
  return `<rect x="${x}" y="${y}" width="${n(w)}" height="30" rx="15" fill="${C.green}" fill-opacity=".1" stroke="${C.green}" stroke-opacity=".6"/><circle class="dot" cx="${x + 17}" cy="${y + 15}" r="4" fill="${C.green}"/>${label(s, x + 30, y + 19, { fill: C.green })}`;
}
function trajectory(x, y, s) {
  const L = 13.4 * s, H = 6.1 * s;
  const a = [x + L * 0.09, y + H * 0.82], c = [x + L * 0.42, y - H * 0.5], b = [x + L * 0.79, y + H * 0.34];
  const angle = Math.round(Math.atan2(b[1] - c[1], b[0] - c[0]) * 180 / Math.PI);
  return `<path class="flow" d="M${n(a[0])} ${n(a[1])}Q${n(c[0])} ${n(c[1])} ${n(b[0])} ${n(b[1])}" fill="none" stroke="${C.cyan}" stroke-width="1.5" stroke-dasharray="3 5" stroke-linecap="round"/>${shuttle(b[0], b[1], Math.max(30, s * 1.15), angle)}`;
}
function dimensions(x, y, s, withHeight) {
  const L = 13.4 * s, H = 6.1 * s, top = y - 16;
  const o = { size: 11, fill: C.muted };
  let out = `<path d="M${n(x)} ${top - 4}v8M${n(x + L)} ${top - 4}v8M${n(x)} ${top}H${n(x + L / 2 - 30)}M${n(x + L / 2 + 30)} ${top}H${n(x + L)}" stroke="${C.line}" fill="none"/>${text('13.40 m', x + L / 2, top + 4, { ...o, anchor: 'middle' })}`;
  if (withHeight) out += `<g transform="translate(${n(x + L + 18)} ${n(y + H / 2)}) rotate(90)">${text('6.10 m', 0, 4, { ...o, anchor: 'middle' })}</g>`;
  return out;
}
const bannerTitle = 'Anthony Richard, full-stack developer, Mastère EADL at DIIAGE, open to apprenticeship. Top view of a badminton court with a shuttle in flight.';
save('banner', svg(880, 300, bannerTitle, `
  ${court(440, 72, 30)}${trajectory(440, 72, 30)}${dimensions(440, 72, 30, true)}
  ${label('@ANTHONY72727', 36, 74)}
  ${text('Anthony Richard', 36, 128, { size: 46, font: 'display' })}
  ${text('Full-stack developer', 36, 164, { size: 18 })}
  ${text('Mastère EADL · DIIAGE', 36, 192, { size: 14, fill: C.muted })}
  ${statusPill(36, 218)}`, PULSE));
save('banner-mobile', svg(440, 396, bannerTitle, `
  ${court(32, 52, 28)}${trajectory(32, 52, 28)}${dimensions(32, 52, 28, false)}
  ${text('Anthony Richard', 32, 280, { size: 42, font: 'display' })}
  ${text('Full-stack developer', 32, 312, { size: 17 })}
  ${text('Mastère EADL · DIIAGE', 32, 336, { size: 14, fill: C.muted })}
  ${statusPill(32, 350)}`, PULSE));

// Project cards: a small service map of each project
function serviceMap(nodes, x, y, w, gap) {
  return nodes.map(([role, tech], i) => {
    const nx = x + i * (w + gap);
    const arrow = i < nodes.length - 1 ? `<path d="M${nx + w + 4} ${y + 33}H${nx + w + gap - 5}m-5 -4l5 4l-5 4" fill="none" stroke="${C.cyan}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>` : '';
    return `<rect x="${nx}" y="${y}" width="${w}" height="66" rx="8" fill="${C.panel}" stroke="${C.line}"/>${label(role, nx + 12, y + 25, { size: 11 })}${text(tech, nx + 12, y + 48, { size: 14, font: 'monoBold' })}${arrow}`;
  }).join('');
}
function project(file, { name, kicker, meta, nodes }) {
  const title = `${name}. ${kicker}. ${meta}. Architecture: ${nodes.map((x) => x[1]).join(' to ')}.`;
  save(file, svg(880, 164, title, `${label(kicker, 32, 50, { fill: C.green })}${text(name, 32, 94, { size: 36, font: 'display' })}${text(meta, 32, 124, { size: 13, fill: C.muted })}${serviceMap(nodes, 406, 49, 134, 22)}`));
  save(`${file}-mobile`, svg(440, 222, title, `${label(kicker, 28, 42, { fill: C.green, size: 11 })}${text(name, 28, 84, { size: 34, font: 'display' })}${text(meta, 28, 112, { size: 13, fill: C.muted })}${serviceMap(nodes, 28, 132, 116, 18)}`));
}
project('project-ejdr', { name: 'E-JDR', kicker: 'WITH A FRIEND · IN DEVELOPMENT', meta: 'Kotlin · TypeScript · WebSocket', nodes: [['CLIENT', 'Compose'], ['API', 'Express'], ['DATA', 'MySQL']] });
project('project-modularnote', { name: 'ModularNote', kicker: 'PERSONAL · IN DEVELOPMENT', meta: 'TypeScript · C# · .NET 10', nodes: [['CLIENT', 'React'], ['API', 'ASP.NET'], ['DATA', 'Database']] });
project('project-imaflow', { name: 'Imaflow', kicker: 'INTERNSHIP · JAN–MAR 2025', meta: 'PHP developer intern · research lab', nodes: [['ENTRY', 'Router'], ['LOGIC', 'Controllers'], ['DATA', 'Models']] });

// Skills
const SKILLS = [
  ['FRONTEND', [['React'], ['TypeScript'], ['Angular'], ['Vue.js'], ['HTML / CSS'], ['Kotlin Compose'], ['WPF', 1]]],
  ['BACKEND', [['ASP.NET / C#'], ['Node.js / Express'], ['PHP'], ['Java']]],
  ['DATABASES', [['SQL Server'], ['SQLite'], ['MySQL'], ['MongoDB'], ['Neo4j', 1]]],
  ['TOOLS', [['Git'], ['GitHub Actions'], ['Docker'], ['Gradle'], ['Vite']]],
];
const chipW = (s) => width(s, 14) + 24;
function chip(s, x, y, familiar) {
  return `<rect x="${n(x)}" y="${y}" width="${n(chipW(s))}" height="32" rx="6" fill="${familiar ? 'none' : C.panel}" stroke="${familiar ? C.muted : C.line}"${familiar ? ' stroke-dasharray="3 3"' : ''}/>${text(s, x + 12, y + 21, { size: 14, fill: familiar ? C.muted : C.ink })}`;
}
function skills(w, labelCol, stacked) {
  const left = stacked ? 28 : 32, x0 = left + labelCol, right = w - left;
  let y = 30, body = '';
  SKILLS.forEach(([group, items], i) => {
    if (i) body += `<path d="M${left} ${y - 14}H${right}" stroke="${C.line}"/>`;
    body += label(group, left, y + (stacked ? 8 : 21), { fill: C.green });
    if (stacked) y += 22;
    let x = x0;
    for (const [s, familiar] of items) {
      if (x + chipW(s) > right) { x = x0; y += 40; }
      body += chip(s, x, y, familiar);
      x += chipW(s) + 8;
    }
    y += 32 + 28;
  });
  body += `<rect x="${left}" y="${y - 12}" width="22" height="14" rx="3" fill="${C.panel}" stroke="${C.line}"/>${label('CORE', left + 30, y - 1, { size: 11 })}<rect x="${left + 80}" y="${y - 12}" width="22" height="14" rx="3" fill="none" stroke="${C.muted}" stroke-dasharray="3 3"/>${label('FAMILIAR', left + 110, y - 1, { size: 11 })}`;
  return [body, y + 22];
}
const skillsTitle = `Skills. ${SKILLS.map(([g, i]) => `${g}: ${i.map((x) => x[0] + (x[1] ? ' (familiar)' : '')).join(', ')}`).join('. ')}.`;
for (const [file, ...args] of [['skills', 880, 130, false], ['skills-mobile', 440, 0, true]]) {
  const [body, h] = skills(...args);
  save(file, svg(args[0], h, skillsTitle, body));
}

// Badminton
const sampleTag = (x, y) => {
  const s = 'EXAMPLE DATA', w = width(s, 11) + 0.8 * s.length + 20, left = x - w;
  return badminton.sample ? `<rect x="${n(left)}" y="${y}" width="${n(w)}" height="24" rx="12" fill="none" stroke="${C.amber}"/>${label(s, left + 10, y + 16, { size: 11, fill: C.amber })}` : '';
};
const badTitle = `Badminton rankings from the French federation${badminton.sample ? ' (example data)' : ''}. ${badminton.disciplines.map((d) => `${d.name}: ${d.rank}`).join(', ')}.`;
const footer = badminton.sample ? 'Placeholder ranks until FFBaD data is connected' : `Source: ${badminton.source}`;
save('badminton', svg(880, 262, badTitle, `
  ${label('ON COURT', 32, 44, { fill: C.green })}${text('FFBaD rankings', 32, 72, { size: 22, font: 'display' })}${sampleTag(848, 34)}
  ${badminton.disciplines.map((d, i) => {
    const x = 32 + i * 277;
    return `<rect x="${x}" y="92" width="262" height="124" rx="8" fill="${C.panel}" stroke="${C.line}"/>${court(x + 16, 118, 7.8, { sw: 1, opacity: 0.7, area: d.court })}${label(d.name.toUpperCase(), x + 138 - 2, 124 + 0 + 2, { size: 11 })}${text(d.rank, x + 136, 176, { size: 44, font: 'display' })}`;
  }).join('')}
  ${text(footer, 32, 242, { size: 12, fill: C.muted })}`));
save('badminton-mobile', svg(440, 408, badTitle, `
  ${label('ON COURT', 28, 42, { fill: C.green })}${text('FFBaD rankings', 28, 70, { size: 24, font: 'display' })}${sampleTag(412, 28)}
  ${badminton.disciplines.map((d, i) => {
    const y = 88 + i * 94;
    return `<rect x="28" y="${y}" width="384" height="84" rx="8" fill="${C.panel}" stroke="${C.line}"/>${court(44, y + 18, 8, { sw: 1, opacity: 0.7, area: d.court })}${label(d.name.toUpperCase(), 180, y + 30)}${text(d.rank, 180, y + 68, { size: 34, font: 'display' })}`;
  }).join('')}
  ${text(footer, 28, 392, { size: 12, fill: C.muted })}`));

// Contact badges
for (const [file, tag, value] of [['contact-linkedin', 'LINKEDIN', 'anthony-richard-dev'], ['contact-email', 'EMAIL', 'anthony_richard2005@outlook.fr'], ['contact-discord', 'DISCORD', 'avocat727']]) {
  const tw = width(tag, 11) + 0.8 * tag.length;
  const w = Math.ceil(tw + width(value, 14) + 44);
  save(file, svg(w, 42, `${tag}: ${value}`, `${label(tag, 16, 25, { size: 11, fill: C.green })}${text(value, 16 + tw + 12, 26, { size: 14 })}`));
}

// Activity
const LANGUAGES = { ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', cs: 'C#', kt: 'Kotlin', kts: 'Kotlin', java: 'Java', php: 'PHP', py: 'Python', vue: 'Vue', sql: 'SQL', html: 'HTML', css: 'CSS', scss: 'CSS' };
const IGNORED_PATH = /(^|\/)(node_modules|dist|build|vendor)\//;
const languageOf = (file) => (IGNORED_PATH.test(file) ? undefined : LANGUAGES[file.split('.').pop().toLowerCase()]);
async function rest(path) {
  const res = await fetch(`https://api.github.com/${path}`, { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': LOGIN } });
  if (!res.ok) throw new Error(`GitHub API error ${res.status} on ${path}`);
  return res.json();
}
// A commit counts once for each language it touches. Merge commits are skipped: they carry no code of their own.
async function commitsByLanguage(repositories) {
  const since = new Date(Date.now() - 365 * 864e5).toISOString();
  const langs = {};
  for (const name of repositories) {
    for (let page = 1; ; page++) {
      const commits = await rest(`repos/${name}/commits?author=${LOGIN}&since=${since}&per_page=100&page=${page}`);
      for (const commit of commits) {
        if (commit.parents.length > 1) continue;
        const { files = [] } = await rest(`repos/${name}/commits/${commit.sha}`);
        for (const l of new Set(files.map((file) => languageOf(file.filename)).filter(Boolean))) langs[l] = (langs[l] ?? 0) + 1;
      }
      if (commits.length < 100) break;
    }
  }
  return langs;
}
async function fetchActivity() {
  const query = 'query($login:String!){user(login:$login){contributionsCollection{totalPullRequestContributions totalIssueContributions contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}} commitContributionsByRepository(maxRepositories:50){contributions{totalCount} repository{nameWithOwner}}}}}';
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': LOGIN }, body: JSON.stringify({ query, variables: { login: LOGIN } }) });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub API error ${res.status}: ${JSON.stringify(json.errors ?? json.message)}`);
  const data = json.data.user.contributionsCollection;
  data.langs = await commitsByLanguage(data.commitContributionsByRepository.map((r) => r.repository.nameWithOwner));
  return data;
}
function activity(data) {
  const cal = data.contributionCalendar;
  const weeks = cal.weeks.map((w) => w.contributionDays).filter((days, i, all) => i < all.length - 1 || days.length === 7);
  const counts = weeks.flat().map((d) => d.contributionCount).filter(Boolean).sort((a, b) => a - b);
  const q = [0.25, 0.5, 0.75].map((p) => counts[Math.floor(counts.length * p)] ?? 1);
  const level = (c) => (!c ? 0 : c <= q[0] ? 1 : c <= q[1] ? 2 : c <= q[2] ? 3 : 4);
  const top = Object.entries(data.langs).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const stats = [[cal.totalContributions, 'CONTRIBUTIONS'], [counts.length, 'ACTIVE DAYS'], [data.totalPullRequestContributions, 'PULL REQUESTS'], [data.totalIssueContributions, 'ISSUES']];
  const title = `GitHub activity over the last 12 months: ${stats.map(([v, l]) => `${v} ${l.toLowerCase()}`).join(', ')}. Commits by language touched: ${top.map(([l, v]) => `${l} ${v}`).join(', ')}.`;

  const heat = (shown, x, y, cell, gap) => {
    let out = '', lastMonth = null, lastLabel = -9;
    shown.forEach((week, i) => {
      const cx = x + i * (cell + gap);
      const m = week[0].date.slice(5, 7);
      if (m !== lastMonth) {
        if (i - lastLabel >= 3 && i < shown.length - 2) {
          out += label(new Date(`${week[0].date}T00:00Z`).toLocaleString('en', { month: 'short', timeZone: 'UTC' }).toUpperCase(), cx, y - 8, { size: 10 });
          lastLabel = i;
        }
        lastMonth = m;
      }
      for (const d of week) {
        const row = new Date(`${d.date}T00:00Z`).getUTCDay();
        out += `<rect x="${cx}" y="${y + row * (cell + gap)}" width="${cell}" height="${cell}" rx="2" fill="${HEAT[level(d.contributionCount)]}"/>`;
      }
    });
    return out;
  };
  const legend = (x, y, cell) => label('LESS', x, y + 10, { size: 10 }) + HEAT.map((c, i) => `<rect x="${x + 38 + i * (cell + 3)}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${c}"/>`).join('') + label('MORE', x + 44 + 5 * (cell + 3), y + 10, { size: 10 });
  const bars = (x, y, nameW, max) => top.map(([l, v], i) => {
    const by = y + i * 26, w = Math.max(4, v / top[0][1] * max);
    return `${text(l, x, by + 11, { size: 13 })}<rect x="${x + nameW}" y="${by}" width="${n(w)}" height="12" rx="4" fill="${C.cyan}"/>${text(String(v), x + nameW + w + 8, by + 11, { size: 13 })}`;
  }).join('');
  const tile = ([v, l], x, y) => `${text(String(v), x, y, { size: 38, font: 'display' })}${label(l, x, y + 22, { size: 11 })}`;

  const bh = top.length * 26;
  save('stats', svg(880, 326 + bh + 24, title, `
    ${label('ACTIVITY · LAST 12 MONTHS', 32, 44, { fill: C.green })}
    ${stats.map((s, i) => tile(s, 32 + i * 208, 100)).join('')}
    ${heat(weeks, 32, 170, 12, 3)}
    ${legend(32, 286, 12)}
    ${label('COMMITS BY LANGUAGE TOUCHED', 32, 334, { size: 11 })}
    ${bars(32, 348, 110, 620)}`));
  save('stats-mobile', svg(440, 430 + bh + 8, title, `
    ${label('ACTIVITY · LAST 12 MONTHS', 28, 42, { fill: C.green })}
    ${stats.map((s, i) => tile(s, 28 + (i % 2) * 192, 94 + Math.floor(i / 2) * 76)).join('')}
    ${heat(weeks.slice(-24), 28, 234, 13, 3)}
    ${legend(28, 360, 12)}
    ${label('COMMITS BY LANGUAGE TOUCHED', 28, 408, { size: 11 })}
    ${bars(28, 422, 92, 240)}`));
}
if (process.env.GITHUB_TOKEN) activity(await fetchActivity());
else console.log('No GITHUB_TOKEN: activity card left untouched.');
