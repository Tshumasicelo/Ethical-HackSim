//   node tests/e2e/bridge.js
// Checks the game against a stand-in for the Android bridge: saves go through it, and a save
// that exists only in the bridge (not in browser storage) is restored on the next launch.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const URL = 'file://' + require('path').resolve(__dirname, '../../app/src/main/assets/index.html');
  const mock = (saved) => `window.__calls={save:0,vib:0}; window.__saved=${JSON.stringify(saved)};
    window.AndroidBridge={ saveProgress:(j)=>{window.__calls.save++; window.__saved=j;}, loadProgress:()=>window.__saved, vibrate:()=>{window.__calls.vib++;} };`;
  const errors = [];
  let ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  let p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript(mock(''));
  await p.goto(URL); await p.waitForTimeout(400); await p.click('.skip-btn'); await p.waitForTimeout(500);
  await p.fill('.screen:not(.leave) .big-input', 'trinity'); await p.click('.screen:not(.leave) .btn.primary'); await p.waitForTimeout(400);
  await p.locator('.screen:not(.leave) .level-card').nth(1).click(); await p.waitForTimeout(300);   // locked card -> buzz
  const r1 = await p.evaluate(() => ({ calls: window.__calls, saved: JSON.parse(window.__saved).alias }));
  console.log('first run:', JSON.stringify(r1));
  const save = await p.evaluate(() => { HS.state.xp = 777; HS.state.levels[1] = { stars: 3, xp: 100 }; HS.save(); return window.__saved; });
  await ctx.close();
  // "Fresh install of the web side": brand-new context, so no localStorage. Only the bridge has the save.
  ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript(mock(save));
  await p.goto(URL); await p.waitForTimeout(400); await p.click('.skip-btn'); await p.waitForTimeout(500);
  console.log('restored from bridge:', JSON.stringify(await p.evaluate(() => ({ alias: HS.state.alias, xp: HS.state.xp, onDash: !!document.querySelector('.tier'), unlocked: document.querySelectorAll('.level-card:not(.locked)').length }))));
  // corrupt save must not crash
  await ctx.close(); ctx = await b.newContext(); p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript(mock('{not json'));
  await p.goto(URL); await p.waitForTimeout(400); await p.click('.skip-btn'); await p.waitForTimeout(500);
  console.log('corrupt save -> alias screen:', !!(await p.$('.screen:not(.leave) .big-input')));
  // animations off: boot must go straight through
  const off = await p.evaluate(() => { HS.state.alias = 'x'; HS.state.settings.motion = false; HS.save(); return window.__saved; });
  await ctx.close(); ctx = await b.newContext(); p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript(mock(off)); await p.goto(URL); await p.waitForTimeout(500);
  console.log('motion off -> dashboard without boot:', !!(await p.$('.tier')), 'boot gone:', !(await p.$('.boot')));
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
