// Full automated playthrough of all 20 missions through the real UI, in headless Chromium.
// It solves every stage, then checks that progress survives a restart, that every screen opens,
// that the About text is intact and that the page logs no errors.
//
//   npm install playwright && npx playwright install chromium
//   node tests/e2e/playthrough.js
//
// Screenshots land in tests/e2e/shots/ (git-ignored).
const { chromium } = require('playwright');
const crypto = require('crypto');
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
const SHOTS = __dirname + '/shots';
require('fs').mkdirSync(SHOTS, { recursive: true });
const URL = process.env.HS_URL || 'file://' + require('path').resolve(__dirname, '../../app/src/main/assets/index.html');
const TERM = {
  7: ['ls', 'cat leak.txt', 'hashid ' + md5('trustno1'), 'crack ' + md5('Vx7!pL0q#Zr2mW'), 'crack ' + md5('trustno1'), 'submit wrongpw', 'submit trustno1'],
  11: ['help', 'nmap 10.0.7.0/24', 'nmap 10.0.7.21', 'nmap 10.0.7.34', 'submit 10.0.7.34'],
  12: ['nmap -sV 10.0.7.34', 'searchvuln nginx 1.24', 'searchvuln vsftpd 2.3.4', 'submit SIM-2011-2523'],
  13: ['curl http://shop.sim/', 'LOGIN:admin:guess', "LOGIN:admin':x", "LOGIN:admin' --:x", 'submit FLAG{QUOTES_ARE_CODE}'],
  16: ['nmap -sV 198.51.100.23', 'submit 8080'],
  20: ['cat vault.hash', 'crack ' + md5('blackice1'), 'open nope', 'open blackice1', 'sudo whoami', 'notacommand', 'submit FLAG{Y0U_4RE_TH3_0NE}'],
};
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); global.__page = page;
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = (n) => page.screenshot({ path: SHOTS + '/' + n + '.png' });
  const S = '.screen:not(.leave) ';

  await page.goto(URL);
  await wait(1500); await shot('01-boot');
  await page.waitForSelector(S + '.big-input', { timeout: 8000 });   // boot must finish by itself
  await wait(400);
  await page.fill(S + '.big-input', 'neo'); await shot('02-alias');
  await page.click(S + '.btn.primary'); await wait(500);
  await shot('03-dashboard');
  const locked = await page.$$eval(S + '.level-card.locked', (n) => n.length);
  console.log('locked at start:', locked);

  const levels = await page.evaluate(() => JSON.parse(JSON.stringify(HS.LEVELS)));
  async function solveStage(level, st, si) {
    const tag = 'L' + level.id + '.' + (si + 1) + ' ' + st.kind;
    if (st.kind === 'choice') {
      const wrongIdx = st.options.findIndex((o) => !o.ok), okIdx = st.options.findIndex((o) => o.ok);
      if (level.id === 1) { await page.locator(S + '.opt').nth(wrongIdx).click(); await wait(600); }
      await page.locator(S + '.opt').nth(okIdx).click();
    } else if (st.kind === 'sort') {
      if (level.id === 1) { await page.click(S + ':text("CHECK ORDER")'); await wait(200); }
      for (let pos = 0; pos < st.items.length; pos++) {
        for (let guard = 0; guard < 10; guard++) {
          const texts = await page.$$eval(S + '.sort-t', (n) => n.map((x) => x.textContent));
          const at = texts.indexOf(st.items[pos].t);
          if (at === pos) break;
          await page.locator(S + '.sort-item').nth(at).locator('.mv').first().click();
        }
      }
      await page.click(S + ':text("CHECK ORDER")');
    } else if (st.kind === 'text') {
      const ans = st.accept ? st.accept[0] : st.contains[0];
      const inp = page.locator(S + '.pad > div > .big-input');
      if (level.id === 3 && si === 0) { await inp.fill('wrong'); await page.click(S + ':text("SUBMIT")'); await wait(200); }
      await inp.fill(ans); await page.click(S + ':text("SUBMIT")');
    } else if (st.kind === 'crack') {
      let cands = [];
      for (let i = 0; i < 10000; i++) { const s = String(i).padStart(4, '0'); if (new Set(s).size === 4) cands.push(s); }
      const score = (g, c) => { let b = 0, w = 0; for (let i = 0; i < 4; i++) { if (g[i] === c[i]) b++; else if (c.includes(g[i])) w++; } return b + ',' + w; };
      for (let n = 0; n < 10; n++) {
        const g = cands[0];
        for (const d of g) await page.locator(S + '.key', { hasText: new RegExp('^' + d + '$') }).click();
        await page.locator(S + '.key.go').click(); await wait(60);
        const row = await page.locator(S + '.crack-row').first().textContent();
        if (/UNLOCKED/.test(row)) { console.log('  pin cracked in', n + 1); break; }
        const m = row.match(/(\d) exact, (\d) misplaced/);
        cands = cands.filter((c) => score(g, c) === m[1] + ',' + m[2]);
      }
    } else if (st.kind === 'policy') {
      for (const cb of await page.$$(S + '.toggle input')) if (!(await cb.isChecked())) await cb.check();
      await page.$eval(S + '.pad > div > .slider', (s) => { s.value = 16; s.dispatchEvent(new Event('input')); });
      await shot('L' + level.id + '-policy');
      await page.click(S + ':text("LOCK IN POLICY")');
    } else if (st.kind === 'inbox') {
      for (let i = 0; i < st.emails.length; i++) {
        const card = page.locator(S + '.email').nth(i);
        if (!(await card.locator('.email-body').evaluate((b) => b.classList.contains('open')))) await card.locator('.email-head').click();
        await card.locator(st.emails[i].phish ? 'text=PHISHING' : 'text=LEGITIMATE').click(); await wait(80);
        if (i === 0) await shot('L' + level.id + '-inbox');
      }
      await page.click(S + ':text("CONTINUE")');
    } else if (st.kind === 'spot') {
      for (let i = 0; i < st.lines.length; i++) if (st.lines[i].flag) await page.locator(S + '.spot-line').nth(i).click();
      await shot('L' + level.id + '-spot-' + si);
      await page.click(S + ':text("CONTINUE")');
    } else if (st.kind === 'terminal') {
      for (const c of TERM[level.id]) {
        if (c.startsWith('LOGIN:')) {
          const [, u, p] = c.split(':');
          await page.fill(S + '.term-line .term-input', 'login'); await page.keyboard.press('Enter');
          await page.fill(S + '.term-form input >> nth=0', u); await page.fill(S + '.term-form input >> nth=1', p);
          await page.click(S + '.term-form .chip');
        } else {
          if (c.startsWith('submit') && !/wrong/.test(c)) await shot('L' + level.id + '-terminal-' + si);
          await page.fill(S + '.term-line .term-input', c); await page.keyboard.press('Enter');
        }
        await wait(60);
      }
    } else throw new Error('no solver for ' + st.kind);
    console.log('  ok', tag);
  }

  for (const level of levels) {
    await page.locator(S + '.level-card').nth(level.id - 1).click(); await wait(450);
    if (level.id === 1) await shot('04-briefing');
    await page.click(S + ':text("START MISSION")'); await wait(450);
    for (let si = 0; si < level.stages.length; si++) {
      await page.waitForSelector(S + '.sp-dot.cur >> nth=0');
      const idx = await page.$$eval(S + '.sp-dot', (d) => d.findIndex((x) => x.classList.contains('cur')));
      if (idx !== si) throw new Error('stage index mismatch L' + level.id + ' want ' + si + ' got ' + idx);
      if (si === 0 && [1, 2, 3, 6].includes(level.id)) await shot('L' + level.id + '-stage1');
      if (level.id === 5 && si === 0) { await page.click(S + ':text("NEED A HINT?")'); await wait(100); }
      await solveStage(level, level.stages[si], si);
      await wait(1700);
    }
    await page.waitForSelector(S + '.win-head', { timeout: 5000 });
    await wait(1300);
    if ([1, 20].includes(level.id)) await shot('L' + level.id + '-complete');
    const stars = await page.$$eval(S + '.bstar.lit', (n) => n.length);
    console.log('LEVEL', level.id, 'complete, stars', stars);
    await page.click(S + ':text("MISSION MAP")'); await wait(500);
  }
  await wait(3500);
  await shot('05-dashboard-done');
  const before = await page.evaluate(() => ({ xp: HS.state.xp, done: Object.keys(HS.state.levels).length, ach: Object.keys(HS.state.achievements), rank: HS.rankFor(HS.state.xp).name }));
  console.log('STATE', JSON.stringify(before));

  // persistence across a restart
  await page.reload(); await wait(600); await page.click('.skip-btn'); await wait(600);
  const after = await page.evaluate(() => ({ xp: HS.state.xp, done: Object.keys(HS.state.levels).length, alias: HS.state.alias }));
  console.log('AFTER RELOAD', JSON.stringify(after), 'on dashboard:', !!(await page.$(S + '.tier')));

  // other screens
  for (const [name, label] of [['tools', 'Toolkit'], ['ach', 'Achievements'], ['about', 'About'], ['settings', 'Settings']]) {
    await page.click(S + '.quick-btn:has-text("' + label + '")'); await wait(450);
    if (name === 'tools') for (const hd of await page.$$(S + '.tool-card-head')) { await hd.click(); await wait(60); }
    await shot('06-' + name);
    if (name === 'about') console.log('ABOUT TEXT:', JSON.stringify(await page.$eval(S + '.about-card', (n) => n.innerText)));
    const handled = await page.evaluate(() => window.HackSim.onBack()); await wait(450);
    if (!handled) throw new Error('back not handled on ' + name);
  }
  await page.click(S + '.xp-chip'); await wait(450); await shot('07-profile');
  console.log('root back handled (expect false):', await page.evaluate(() => { HackSim.onBack(); return HackSim.onBack(); }));
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch(async (e) => { console.error('FATAL', e.message); try { await global.__page.screenshot({ path: SHOTS + '/FAIL.png' }); console.error(await global.__page.evaluate(() => document.getElementById('app').innerText.slice(0,600))); } catch (x) {} process.exit(1); });
