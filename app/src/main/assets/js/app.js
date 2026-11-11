/* HackSim app shell: boot sequence, dashboard, mission player and the other screens.
   Screens are built in JS and swapped in and out of #app. */
(function () {
  'use strict';
  const HS = window.HS;
  const h = HS.h;
  const root = document.getElementById('app');

  /* ---------------- progression helpers ---------------- */
  HS.rankFor = function (xp) {
    let r = HS.RANKS[0];
    for (const x of HS.RANKS) if (xp >= x.xp) r = x;
    return r;
  };
  HS.nextRank = function (xp) { return HS.RANKS.find((r) => r.xp > xp) || null; };
  function totalXp() { return HS.state.xp; }
  function levelDone(id) { const l = HS.state.levels[id]; return l && l.stars > 0; }
  function unlocked(id) {
    if (id === 1) return true;
    // A level unlocks when the previous one is done; tiers gate on the one before.
    return levelDone(id - 1);
  }
  function tierLevels(t) { return HS.LEVELS.filter((l) => l.tier === t); }

  /* ---------------- achievements ---------------- */
  let toastQ = [];
  function toast(a) {
    const node = h('div', { class: 'toast' }, h('span', { class: 'ach-ico' }, a.icon), h('div', {}, h('div', { class: 'accent' }, 'Achievement: ' + a.name), h('div', { class: 'dim small' }, a.desc)));
    document.body.appendChild(node);
    HS.sfx('unlock'); HS.buzz(40);
    requestAnimationFrame(() => node.classList.add('in'));
    setTimeout(() => { node.classList.remove('in'); setTimeout(() => node.remove(), 400); }, 3200);
  }
  HS.grant = function (id) {
    if (HS.state.achievements[id]) return;
    const a = HS.ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    HS.state.achievements[id] = Date.now();
    HS.save();
    toast(a);
  };
  HS.checkAchievements = function () {
    const done = HS.LEVELS.filter((l) => levelDone(l.id));
    if (done.length >= 1) HS.grant('first_blood');
    [1, 2, 3, 4].forEach((t) => { if (tierLevels(t).every((l) => levelDone(l.id))) HS.grant('tier' + t); });
    if (done.filter((l) => HS.state.levels[l.id].stars >= 3).length >= 10) HS.grant('flawless');
    if (HS.LEVELS.every((l) => HS.state.levels[l.id] && HS.state.levels[l.id].stars >= 3)) HS.grant('the_one');
    if (Object.keys(HS.state.toolsUsed).length >= Object.keys(HS.TOOLS).length) HS.grant('toolsmith');
  };

  /* ---------------- screen transition ---------------- */
  let current = null;
  let stopFx = null;      // stops the running canvas effect of the screen being left
  let backAction = null;  // what the system back button does on the current screen
  function go(builder, opts) {
    opts = opts || {};
    if (stopFx) { stopFx(); stopFx = null; }
    backAction = null;
    closeModal();
    const next = builder();
    next.classList.add('screen');
    if (HS.motion() && current && !opts.instant) {
      const old = current;
      next.classList.add('enter');
      root.appendChild(next);
      old.classList.add('leave');
      setTimeout(() => old.remove(), 320);
      // Force a style flush so the browser animates from the "enter" state.
      void next.offsetWidth;
      next.classList.remove('enter');
    } else {
      if (current) current.remove();
      root.appendChild(next);
    }
    current = next;
    root.scrollTop = 0;
    return next;
  }

  function header(title, onBack) {
    backAction = onBack || null;
    const left = onBack ? h('button', { class: 'icon-btn', onclick: () => { HS.sfx('tap'); onBack(); } }, '‹') : h('span', { class: 'brand' }, 'HACKSIM');
    const r = HS.rankFor(totalXp());
    return h('div', { class: 'topbar' }, left,
      h('div', { class: 'title', text: title }),
      h('div', { class: 'xp-chip', onclick: () => { HS.sfx('tap'); showProfile(); } }, h('span', { class: 'accent' }, r.name), ' · ', h('span', { text: totalXp() + ' XP' })));
  }

  /* ================= BOOT SEQUENCE ================= */
  function boot() {
    const canvas = h('canvas', { class: 'boot-rain' });
    const log = h('div', { class: 'boot-log mono' });
    const title = h('div', { class: 'boot-title' });
    const skip = h('button', { class: 'skip-btn', onclick: () => finish() }, 'SKIP ›');
    const wrap = h('div', { class: 'boot' }, canvas, h('div', { class: 'boot-center' }, title, log), skip);
    let stopRain = null, done = false, timers = [];
    function finish() {
      if (done) return; done = true;
      timers.forEach(clearTimeout);
      if (stopRain) stopRain();
      HS.sfx('tap');
      HS.state.alias ? showDashboard() : showAlias();
    }
    go(() => wrap, { instant: true });
    setTimeout(() => { stopRain = HS.rain(canvas, { fade: 0.15, alpha: 0.5 }); }, 0);
    HS.sfx('boot');
    const lines = [
      'HackSim BIOS v2.0 — POST OK',
      'initialising secure sandbox .............. [ OK ]',
      'mounting /missions (20 loaded) ........... [ OK ]',
      'loading toolkit .......................... [ OK ]',
      'arming green-on-black interface .......... [ OK ]',
      'reminder: every target in here is fake ... [ OK ]',
      'access granted.',
    ];
    if (!HS.motion()) { finish(); return; }
    let y = 0;
    function step() {
      if (done) return;
      if (y < lines.length) {
        const l = h('div', {}, '');
        log.appendChild(l);
        HS.type(l, lines[y], 8);
        if (y % 2 === 0) HS.sfx('key');
        y++;
        timers.push(setTimeout(step, 230));
      } else {
        HS.scramble(title, 'HACKSIM', 900);
        title.classList.add('show');
        timers.push(setTimeout(finish, 1100));
      }
    }
    timers.push(setTimeout(step, 400));
  }

  /* ================= ALIAS ================= */
  function showAlias() {
    go(() => {
      const input = h('input', { class: 'big-input', placeholder: 'choose an alias', maxlength: 18, autocomplete: 'off', spellcheck: 'false' });
      const begin = h('button', { class: 'btn primary', onclick: () => {
        const v = input.value.trim().replace(/[<>]/g, '') || 'neo';
        HS.state.alias = v; HS.save(); HS.sfx('ok'); showDashboard();
      } }, 'BEGIN TRAINING');
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') begin.click(); });
      setTimeout(() => input.focus(), 350);
      return h('div', { class: 'pad center-col' },
        h('div', { class: 'glyph' }, '▚'),
        h('h1', { class: 'accent glow' }, 'IDENTIFY YOURSELF'),
        h('p', { class: 'dim' }, 'Pick a handle, agent. Everything you do is simulated and safe to explore.'),
        input, begin);
    });
  }

  /* ================= DASHBOARD ================= */
  function showDashboard() {
    HS.checkAchievements();
    go(() => {
      const wrap = h('div', { class: 'screen-inner' });
      wrap.appendChild(header('MISSION MAP', null));

      // progress summary
      const doneCount = HS.LEVELS.filter((l) => levelDone(l.id)).length;
      const xp = totalXp(), r = HS.rankFor(xp), nx = HS.nextRank(xp);
      const pct = nx ? Math.round(((xp - r.xp) / (nx.xp - r.xp)) * 100) : 100;
      const progress = h('div', { class: 'card hero' },
        h('div', { class: 'hero-row' },
          h('div', {}, h('div', { class: 'dim small' }, 'OPERATIVE'), h('div', { class: 'hero-name accent' }, HS.state.alias)),
          h('div', { class: 'right' }, h('div', { class: 'dim small' }, 'RANK'), h('div', { class: 'hero-rank' }, r.name))),
        h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: 'width:' + pct + '%' })),
        h('div', { class: 'dim small spread' }, h('span', {}, xp + ' XP'), h('span', {}, nx ? (nx.xp - xp) + ' XP to ' + nx.name : 'max rank')),
        h('div', { class: 'stat-row' },
          stat(doneCount + '/20', 'missions'),
          stat(countStars() + '', 'stars ★'),
          stat(Object.keys(HS.state.achievements).length + '/' + HS.ACHIEVEMENTS.length, 'badges')));
      wrap.appendChild(progress);

      // quick actions
      wrap.appendChild(h('div', { class: 'quick' },
        quick('⚙', 'Toolkit', showTools),
        quick('✦', 'Achievements', showAchievements),
        quick('ⓘ', 'About', showAbout),
        quick('≡', 'Settings', showSettings)));

      // tiers with level grid
      HS.TIERS.forEach((tier) => {
        const lvls = tierLevels(tier.id);
        const cleared = lvls.filter((l) => levelDone(l.id)).length;
        const sec = h('div', { class: 'tier' });
        sec.appendChild(h('div', { class: 'tier-head' },
          h('div', {}, h('span', { class: 'tier-badge t' + tier.id }, tier.id), h('span', { class: 'tier-name' }, tier.name)),
          h('div', { class: 'dim small' }, cleared + '/' + lvls.length)));
        sec.appendChild(h('div', { class: 'tier-sub dim small' }, tier.sub));
        const grid = h('div', { class: 'grid' });
        lvls.forEach((l) => grid.appendChild(levelCard(l)));
        sec.appendChild(grid);
        wrap.appendChild(sec);
      });
      wrap.appendChild(h('div', { class: 'footer-note dim small' }, 'Created by Sicelo Tshuma · a safe, simulated learning lab'));
      return wrap;
    });
  }
  function stat(v, l) { return h('div', { class: 'stat' }, h('div', { class: 'stat-v accent' }, v), h('div', { class: 'stat-l dim small' }, l)); }
  function quick(ic, label, fn) { return h('button', { class: 'quick-btn', onclick: () => { HS.sfx('tap'); fn(); } }, h('span', { class: 'q-ico' }, ic), h('span', { class: 'small' }, label)); }
  function countStars() { return HS.LEVELS.reduce((n, l) => n + (HS.state.levels[l.id] ? HS.state.levels[l.id].stars : 0), 0); }

  function levelCard(l) {
    const rec = HS.state.levels[l.id];
    const open = unlocked(l.id);
    const stars = rec ? rec.stars : 0;
    const card = h('button', {
      class: 'level-card' + (open ? '' : ' locked') + (stars ? ' done' : ''),
      onclick: () => { if (!open) { HS.sfx('bad'); HS.buzz(20); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); return; } HS.sfx('tap'); showBriefing(l); },
    },
      h('div', { class: 'lc-top' }, h('span', { class: 'lc-num' }, open ? String(l.id).padStart(2, '0') : '🔒'),
        h('span', { class: 'lc-stars' }, open && rec ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '')),
      h('div', { class: 'lc-title' }, open ? l.title : 'LOCKED'),
      h('div', { class: 'lc-tag dim small' }, open ? l.tagline : 'Clear mission ' + String(l.id - 1).padStart(2, '0')));
    return card;
  }

  /* ================= BRIEFING ================= */
  function showBriefing(l) {
    go(() => {
      const wrap = h('div', { class: 'screen-inner' });
      wrap.appendChild(header('MISSION ' + String(l.id).padStart(2, '0'), showDashboard));
      const body = h('div', { class: 'pad' },
        h('div', { class: 'brief-title accent glow' }, l.title),
        h('div', { class: 'dim' }, l.tagline),
        h('div', { class: 'reward-pill' }, '+' + l.xp + ' XP · ' + HS.TIERS[l.tier - 1].name));
      const term = h('div', { class: 'card brief-card' });
      l.briefing.forEach((p) => term.appendChild(h('p', {}, HS.fill(p))));
      term.appendChild(h('div', { class: 'objective' }, h('span', { class: 'accent' }, '▸ OBJECTIVE  '), HS.fill(l.objective)));
      body.appendChild(term);
      body.appendChild(h('button', { class: 'btn primary wide', onclick: () => { HS.sfx('ok'); runMission(l); } }, 'START MISSION ▸'));
      wrap.appendChild(body);
      return wrap;
    });
  }

  /* ================= MISSION PLAYER ================= */
  function runMission(l) {
    const run = { stageIndex: 0, hintsUsed: 0, mistakes: 0, start: Date.now() };
    function render() {
      go(() => {
        const wrap = h('div', { class: 'screen-inner' });
        wrap.appendChild(header(l.title, () => confirmQuit(l)));
        wrap.appendChild(h('div', { class: 'stage-progress' },
          l.stages.map((s, i) => h('span', { class: 'sp-dot' + (i < run.stageIndex ? ' on' : i === run.stageIndex ? ' cur' : '') }))));
        const stage = l.stages[run.stageIndex];
        const host = h('div', { class: 'pad' });
        host.appendChild(h('div', { class: 'stage-title' }, h('span', { class: 'dim' }, 'STEP ' + (run.stageIndex + 1) + '/' + l.stages.length + '  '), stage.title || ''));
        host.appendChild(h('p', { class: 'stage-prompt' }, HS.fill(stage.prompt)));
        const ctx = {
          stage: stage,
          advance: function () {
            run.stageIndex++;
            if (run.stageIndex >= l.stages.length) finishMission(l, run);
            else { HS.sfx('ok'); render(); }
          },
          wrong: function () { run.mistakes++; HS.state.stats.mistakes++; HS.save(); HS.sfx('bad'); HS.buzz(30); },
        };
        host.appendChild(HS.renderStage(stage, ctx));
        // hint drawer
        if (stage.hints && stage.hints.length) host.appendChild(hintBox(stage, run));
        wrap.appendChild(host);
        return wrap;
      });
    }
    render();
  }

  function hintBox(stage, run) {
    let shown = 0;
    const list = h('div', { class: 'hint-list' });
    const btn = h('button', { class: 'btn ghost', onclick: () => {
      if (shown >= stage.hints.length) return;
      const hintNode = h('div', { class: 'hint' }, h('span', { class: 'accent' }, '💡 '), HS.fill(stage.hints[shown]));
      list.appendChild(hintNode);
      shown++;
      run.hintsUsed++;
      HS.state.stats.hints++; HS.save();
      HS.sfx('tap');
      if (shown >= stage.hints.length) { btn.textContent = 'NO MORE HINTS'; btn.disabled = true; }
      else btn.textContent = 'NEED ANOTHER HINT? (' + (stage.hints.length - shown) + ' left)';
    } }, 'NEED A HINT?');
    return h('div', { class: 'hint-box' }, list, btn);
  }

  function confirmQuit(l) {
    modal('Abort mission?', 'Your progress on this mission will not be saved.', [
      { t: 'Keep going', onclick: closeModal },
      { t: 'Abort', danger: true, onclick: () => { closeModal(); HS.sfx('bad'); showDashboard(); } },
    ]);
  }

  /* ================= MISSION COMPLETE ================= */
  function finishMission(l, run) {
    const elapsed = Math.round((Date.now() - run.start) / 1000);
    let stars = 3;
    if (run.hintsUsed > 0) stars--;
    if (run.mistakes > 1 || run.hintsUsed >= 3) stars--;
    stars = Math.max(1, stars);
    const prev = HS.state.levels[l.id];
    const firstTime = !prev || prev.stars === 0;
    const bestStars = Math.max(stars, prev ? prev.stars : 0);
    if (firstTime) HS.state.xp += l.xp;
    else if (stars > (prev ? prev.stars : 0)) HS.state.xp += Math.round(l.xp * 0.2);
    HS.state.levels[l.id] = { stars: bestStars, xp: l.xp, bestTime: Math.min(elapsed, prev && prev.bestTime ? prev.bestTime : 1e9) };
    HS.save();

    // achievements tied to this run
    if (elapsed < 60) HS.grant('speed');
    if (run.hintsUsed === 0 && l.tier >= 3) HS.grant('blind');
    HS.checkAchievements();

    const rankBefore = HS.rankFor(HS.state.xp - (firstTime ? l.xp : 0));
    const rankNow = HS.rankFor(HS.state.xp);
    const rankedUp = rankBefore.name !== rankNow.name;

    go(() => {
      const wrap = h('div', { class: 'screen-inner center-col pad win-screen' });
      const canvas = h('canvas', { class: 'win-rain' });
      wrap.appendChild(canvas);
      setTimeout(() => { if (canvas.isConnected) stopFx = HS.rain(canvas, { fade: 0.2, alpha: 0.35 }); }, 0);
      backAction = showDashboard;
      HS.sfx('win'); HS.buzz(60);
      const starEls = h('div', { class: 'big-stars' });
      [0, 1, 2].forEach((i) => {
        const s = h('span', { class: 'bstar' + (i < stars ? ' lit' : '') }, i < stars ? '★' : '☆');
        starEls.appendChild(s);
        if (i < stars && HS.motion()) setTimeout(() => { s.classList.add('pop'); HS.sfx('tap'); }, 300 + i * 260);
      });
      wrap.appendChild(h('div', { class: 'win-head accent glow' }, 'MISSION COMPLETE'));
      wrap.appendChild(starEls);
      wrap.appendChild(h('div', { class: 'reward-pill big' }, (firstTime ? '+' + l.xp : '+' + Math.round(l.xp * 0.2)) + ' XP' + (firstTime ? '' : ' (improved)')));
      if (rankedUp) wrap.appendChild(h('div', { class: 'rankup' }, '▲ PROMOTED TO ' + rankNow.name));

      const learn = h('div', { class: 'card learn' });
      learn.appendChild(h('div', { class: 'learn-head' }, '▸ WHAT YOU JUST LEARNED'));
      l.learned.forEach((pt) => learn.appendChild(h('div', { class: 'learn-pt' }, h('span', { class: 'accent' }, '• '), pt)));
      learn.appendChild(h('div', { class: 'defend' }, h('span', { class: 'accent' }, '🛡 DEFEND  '), l.defend));
      if (l.codex && l.codex.length) {
        const cx = h('div', { class: 'codex' });
        l.codex.forEach((c) => cx.appendChild(h('div', { class: 'codex-row' }, h('span', { class: 'codex-term accent' }, c.term), h('span', { class: 'dim small' }, c.def))));
        learn.appendChild(cx);
      }
      wrap.appendChild(learn);

      const next = HS.LEVELS.find((x) => x.id === l.id + 1);
      const btns = h('div', { class: 'win-btns' });
      if (next) btns.appendChild(h('button', { class: 'btn primary', onclick: () => { HS.sfx('ok'); showBriefing(next); } }, 'NEXT MISSION ▸'));
      btns.appendChild(h('button', { class: 'btn ghost', onclick: () => { HS.sfx('tap'); showDashboard(); } }, 'MISSION MAP'));
      wrap.appendChild(btns);
      return wrap;
    });
  }

  /* ================= STAGE ENGINE ================= */
  HS.renderStage = function (stage, ctx) {
    const fn = STAGES[stage.kind];
    return fn ? fn(stage, ctx) : h('div', { class: 'danger' }, 'Unknown stage: ' + stage.kind);
  };

  function toolPanel(spec) {
    if (!spec) return null;
    const tool = HS.TOOLS[spec.id];
    if (!tool) return null;
    const node = tool.make(spec);
    return h('div', { class: 'tool-embed' }, h('div', { class: 'tool-embed-head' }, h('span', { class: 'accent' }, tool.icon + ' ' + tool.name)), node);
  }

  const STAGES = {
    /* choice: tap an option, get feedback, correct one advances */
    choice: function (stage, ctx) {
      const box = h('div', {});
      if (stage.display) box.appendChild(h('pre', { class: 'display-pre' }, HS.fill(stage.display)));
      const tp = toolPanel(stage.tool); if (tp) box.appendChild(tp);
      const opts = h('div', { class: 'opts' });
      let locked = false;
      stage.options.forEach((o) => {
        const b = h('button', { class: 'opt', onclick: () => {
          if (locked && o.ok) return;
          Array.from(opts.children).forEach((c) => (c.disabled = true));
          if (o.ok) {
            b.classList.add('ok'); locked = true;
            b.appendChild(h('div', { class: 'opt-why' }, '✓ ' + o.why));
            setTimeout(ctx.advance, 1100);
          } else {
            b.classList.add('no'); ctx.wrong();
            b.appendChild(h('div', { class: 'opt-why' }, '✗ ' + o.why));
            setTimeout(() => { Array.from(opts.children).forEach((c) => { if (!c.classList.contains('no')) c.disabled = false; }); }, 400);
          }
        } }, h('span', { class: 'opt-t' }, HS.fill(o.t)));
        opts.appendChild(b);
      });
      box.appendChild(opts);
      return box;
    },

    /* sort: reorder items by tapping; check button grades the order */
    sort: function (stage, ctx) {
      const order = stage.items.map((_, i) => i);
      do { shuffleStable(order); } while (order.every((idx, pos) => idx === pos));
      const box = h('div', {});
      box.appendChild(h('div', { class: 'sort-axis dim small' }, h('span', {}, '▲ ' + stage.lowLabel), h('span', {}, stage.highLabel + ' ▼')));
      const list = h('div', { class: 'sortable' });
      function redraw() {
        HS.clear(list);
        order.forEach((idx, pos) => {
          const it = stage.items[idx];
          const row = h('div', { class: 'sort-item' },
            h('div', { class: 'sort-grip' }, (pos + 1)),
            h('div', { class: 'sort-body' }, h('div', { class: 'sort-t mono' }, it.t)),
            h('div', { class: 'sort-moves' },
              h('button', { class: 'mv', disabled: pos === 0, onclick: () => { swap(order, pos, pos - 1); HS.sfx('tap'); redraw(); } }, '▲'),
              h('button', { class: 'mv', disabled: pos === order.length - 1, onclick: () => { swap(order, pos, pos + 1); HS.sfx('tap'); redraw(); } }, '▼')));
          list.appendChild(row);
        });
      }
      redraw();
      box.appendChild(list);
      const fb = h('div', { class: 'inline-fb' });
      box.appendChild(fb);
      box.appendChild(h('button', { class: 'btn primary wide', onclick: () => {
        const correct = order.every((idx, pos) => idx === pos);
        if (correct) {
          HS.clear(fb); fb.className = 'inline-fb ok'; fb.textContent = '✓ Correct order.';
          Array.from(list.querySelectorAll('button')).forEach((b) => (b.disabled = true));
          setTimeout(ctx.advance, 800);
        } else {
          ctx.wrong(); fb.className = 'inline-fb no';
          // show how many are in the right slot, without giving it away
          const right = order.filter((idx, pos) => idx === pos).length;
          fb.textContent = '✗ ' + right + ' of ' + order.length + ' in the right place. Keep adjusting.';
        }
      } }, 'CHECK ORDER'));
      return box;
    },

    /* text: free answer checked against accept[]/contains[] */
    text: function (stage, ctx) {
      const box = h('div', {});
      if (stage.display) box.appendChild(h('pre', { class: 'display-pre' }, HS.fill(stage.display)));
      const tp = toolPanel(stage.tool); if (tp) box.appendChild(tp);
      const input = h('input', { class: 'big-input', placeholder: stage.placeholder || 'your answer', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off' });
      const fb = h('div', { class: 'inline-fb' });
      function check() {
        const raw = input.value.trim();
        const norm = raw.toLowerCase().replace(/\s+/g, ' ');
        const ok = stage.accept ? stage.accept.some((a) => norm === a.toLowerCase().replace(/\s+/g, ' '))
          : stage.contains ? stage.contains.some((c) => norm.indexOf(c.toLowerCase()) !== -1) : false;
        if (ok) { fb.className = 'inline-fb ok'; fb.textContent = '✓ Correct.'; input.disabled = true; btn.disabled = true; setTimeout(ctx.advance, 700); }
        else { ctx.wrong(); fb.className = 'inline-fb no'; fb.textContent = '✗ Not quite. Use the tool above and try again.'; }
      }
      const btn = h('button', { class: 'btn primary wide', onclick: check }, 'SUBMIT');
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      box.appendChild(input); box.appendChild(fb); box.appendChild(btn);
      return box;
    },

    /* crack: PIN cracker with bulls/cows feedback */
    crack: function (stage, ctx) {
      const digits = stage.digits || 4;
      // generate a code with all-distinct digits (so the hint holds)
      const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      shuffleStable(pool);
      const code = pool.slice(0, digits).join('');
      let left = stage.attempts || 10;
      const box = h('div', {});
      const feed = h('div', { class: 'crack-feed' });
      const display = h('div', { class: 'crack-display mono' }, '•'.repeat(digits));
      const counter = h('div', { class: 'dim small' }, left + ' attempts left');
      const pad = h('div', { class: 'keypad' });
      let entry = '';
      function setEntry(v) { entry = v; display.textContent = (entry + '•'.repeat(digits)).slice(0, digits).replace(/(.)/g, '$1 ').trim(); }
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '↵'].forEach((k) => {
        pad.appendChild(h('button', { class: 'key' + (k === '↵' ? ' go' : ''), onclick: () => {
          HS.sfx('key');
          if (k === '⌫') setEntry(entry.slice(0, -1));
          else if (k === '↵') submit();
          else if (entry.length < digits) setEntry(entry + k);
        } }, k));
      });
      function submit() {
        if (entry.length !== digits) { HS.sfx('bad'); return; }
        let bulls = 0, cows = 0;
        const cc = code.split(''), gg = entry.split('');
        const usedC = [], usedG = [];
        for (let i = 0; i < digits; i++) if (gg[i] === cc[i]) { bulls++; usedC[i] = usedG[i] = true; }
        for (let i = 0; i < digits; i++) if (!usedG[i]) for (let j = 0; j < digits; j++) if (!usedC[j] && gg[i] === cc[j]) { cows++; usedC[j] = true; break; }
        if (bulls === digits) {
          HS.sfx('win');
          feed.insertBefore(h('div', { class: 'crack-row win' }, h('span', { class: 'mono' }, entry), h('span', { class: 'accent' }, ' ✓ UNLOCKED')), feed.firstChild);
          Array.from(pad.children).forEach((b) => (b.disabled = true));
          setTimeout(ctx.advance, 900);
          return;
        }
        left--;
        counter.textContent = left + ' attempts left';
        HS.sfx('tap');
        feed.insertBefore(h('div', { class: 'crack-row' },
          h('span', { class: 'mono' }, entry),
          h('span', { class: 'pegs' }, '● '.repeat(bulls).trim() + ' ' + '○ '.repeat(cows).trim()),
          h('span', { class: 'dim small' }, bulls + ' exact, ' + cows + ' misplaced')), feed.firstChild);
        setEntry('');
        if (left <= 0) {
          ctx.wrong(); ctx.wrong();
          feed.insertBefore(h('div', { class: 'crack-row no' }, 'Lockout! The code was ' + code + '. Resetting…'), feed.firstChild);
          Array.from(pad.children).forEach((b) => (b.disabled = true));
          setTimeout(() => runStageAgain(stage, ctx, box), 1600);
        }
      }
      setEntry('');
      box.appendChild(display); box.appendChild(counter); box.appendChild(pad);
      box.appendChild(h('div', { class: 'legend dim small' }, '● correct digit, correct place   ○ correct digit, wrong place'));
      box.appendChild(feed);
      return box;
    },

    /* policy: sliders/toggles compute crack time, target reached advances */
    policy: function (stage, ctx) {
      const box = h('div', {});
      const state = { lower: true, upper: false, digit: false, sym: false, length: 8 };
      const result = h('div', { class: 'policy-result' });
      function charset() { return (state.lower ? 26 : 0) + (state.upper ? 26 : 0) + (state.digit ? 10 : 0) + (state.sym ? 32 : 0); }
      function render() {
        const cs = charset();
        const sec = HS.crackSeconds(cs, state.length, stage.rate);
        const years = sec / (60 * 60 * 24 * 365);
        const ok = years >= stage.targetYears && cs > 0;
        HS.clear(result);
        HS.add(result, [
          h('div', { class: 'policy-time ' + (ok ? 'ok' : '') }, ok ? '✓ ' : '', 'average crack time: ' + HS.humanTime(sec)),
          h('div', { class: 'dim small' }, 'alphabet ' + cs + ' chars · length ' + state.length + ' · attacker at ' + (stage.rate / 1e9) + ' billion guesses/sec'),
          h('div', { class: 'dim small' }, 'target: survive ' + stage.targetYears.toLocaleString() + ' years'),
        ]);
        if (ok) { result.classList.add('pulse'); btn.disabled = false; btn.classList.add('primary'); }
        else { btn.disabled = true; btn.classList.remove('primary'); }
      }
      [['lower', 'a-z'], ['upper', 'A-Z'], ['digit', '0-9'], ['sym', '!@#$']].forEach(([k, lbl]) => {
        box.appendChild(h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', checked: state[k], onchange: function () { state[k] = this.checked; HS.sfx('tap'); render(); } }),
          h('span', {}, 'include ' + lbl)));
      });
      const lenVal = h('span', { class: 'accent mono' }, state.length);
      const slider = h('input', { type: 'range', min: 4, max: stage.maxLength || 20, value: state.length, class: 'slider' });
      slider.addEventListener('input', () => { state.length = parseInt(slider.value, 10); lenVal.textContent = state.length; HS.sfx('key'); render(); });
      box.appendChild(h('div', { class: 'tool-row' }, h('label', {}, 'length '), lenVal));
      box.appendChild(slider);
      box.appendChild(result);
      const btn = h('button', { class: 'btn wide', disabled: true, onclick: ctx.advance }, 'LOCK IN POLICY ▸');
      box.appendChild(btn);
      render();
      return box;
    },

    /* inbox: classify each email phishing/legit */
    inbox: function (stage, ctx) {
      const box = h('div', {});
      let open = 0;
      const total = stage.emails.length;
      const bar = h('div', { class: 'dim small' }, '0/' + total + ' triaged');
      box.appendChild(bar);
      const results = {};
      stage.emails.forEach((em, i) => {
        const card = h('div', { class: 'email' });
        const head = h('div', { class: 'email-head', onclick: () => { body.classList.toggle('open'); HS.sfx('tap'); } },
          h('div', {}, h('div', { class: 'email-from' }, HS.fill(em.from)), h('div', { class: 'email-addr mono dim small' }, em.addr)),
          h('div', { class: 'email-subj' }, HS.fill(em.subject)));
        const body = h('div', { class: 'email-body' });
        if (em.context) body.appendChild(h('div', { class: 'email-ctx' }, '📎 ' + em.context));
        body.appendChild(h('pre', { class: 'email-text' }, HS.fill(em.body)));
        const verdict = h('div', { class: 'email-verdict' });
        const btns = h('div', { class: 'email-btns' },
          h('button', { class: 'btn small danger', onclick: () => decide(true) }, '⚠ PHISHING'),
          h('button', { class: 'btn small', onclick: () => decide(false) }, '✓ LEGITIMATE'));
        body.appendChild(btns); body.appendChild(verdict);
        function decide(asPhish) {
          if (results[i]) return;
          const right = asPhish === em.phish;
          results[i] = true;
          if (!right) ctx.wrong(); else HS.sfx('ok');
          card.classList.add(right ? 'correct' : 'wrong');
          verdict.className = 'email-verdict ' + (right ? 'ok' : 'no');
          verdict.textContent = (right ? '✓ ' : '✗ ') + (em.phish ? 'Phishing. ' : 'Legitimate. ') + em.why;
          btns.remove();
          open++; bar.textContent = open + '/' + total + ' triaged';
          if (open >= total) cont.disabled = false, cont.classList.add('primary');
          else { const nb = card.nextElementSibling && card.nextElementSibling.querySelector('.email-body'); if (nb) nb.classList.add('open'); }
        }
        card.appendChild(head); card.appendChild(body);
        if (i === 0) body.classList.add('open');
        box.appendChild(card);
      });
      const cont = h('button', { class: 'btn wide', disabled: true, onclick: ctx.advance }, 'CONTINUE ▸');
      box.appendChild(cont);
      return box;
    },

    /* spot: tap the lines that are red flags; find them all to advance */
    spot: function (stage, ctx) {
      const box = h('div', {});
      const flags = stage.lines.filter((l) => l.flag).length;
      let found = 0;
      const counter = h('div', { class: 'dim small' }, 'red flags found: 0/' + flags);
      box.appendChild(counter);
      const doc = h('div', { class: 'spot-doc' + (stage.mono ? ' mono' : '') });
      stage.lines.forEach((ln) => {
        const row = h('div', { class: 'spot-line', onclick: () => {
          if (row.classList.contains('done')) return;
          if (ln.flag) {
            row.classList.add('done', 'flagged'); found++; counter.textContent = 'red flags found: ' + found + '/' + flags; HS.sfx('ok');
            row.appendChild(h('div', { class: 'spot-why ok' }, '⚠ ' + ln.why));
            if (found >= flags) { box.querySelector('.spot-advance').disabled = false; box.querySelector('.spot-advance').classList.add('primary'); }
          } else {
            row.classList.add('miss'); ctx.wrong();
            const w = h('div', { class: 'spot-why no' }, '✓ fine — ' + ln.why);
            row.appendChild(w);
            setTimeout(() => { row.classList.remove('miss'); }, 500);
          }
        } }, h('span', { class: 'spot-text' }, HS.fill(ln.t)));
        doc.appendChild(row);
      });
      box.appendChild(doc);
      box.appendChild(h('button', { class: 'btn wide spot-advance', disabled: true, onclick: ctx.advance }, 'CONTINUE ▸'));
      return box;
    },

    /* terminal: hands-on simulated shell */
    terminal: function (stage, ctx) {
      const box = h('div', {});
      const objState = {};
      const found = {};
      const chipRow = h('div', { class: 'chip-row' });
      const objWrap = h('div', { class: 'obj-list' });
      (stage.objectives || []).forEach((o, i) => objWrap.appendChild(h('div', { class: 'obj', 'data-i': i }, h('span', { class: 'obj-box' }, '☐'), HS.fill(o.t))));
      if (stage.objectives) box.appendChild(objWrap);
      const term = HS.makeTerminal(stage, {
        fire: function (ev) {
          (stage.objectives || []).forEach((o, i) => {
            if (objState[i]) return;
            if (ev === o.ev || ev.indexOf(o.ev) === 0) {
              objState[i] = true;
              const el = objWrap.querySelector('[data-i="' + i + '"]');
              if (el) { el.classList.add('done'); el.firstChild.textContent = '☑'; }
            }
          });
        },
        win: function () { HS.sfx('win'); ctx.advance(); },
        // Values the player uncovers (hashes, addresses, flags) become tappable chips,
        // so nobody has to retype 32 hex characters on a phone keyboard.
        token: function (t) {
          if (found[t]) return;
          found[t] = true;
          chipRow.appendChild(h('button', { class: 'chip found', onclick: () => { term.insert(t); HS.sfx('tap'); } }, t));
        },
        wrong: ctx.wrong,
      });
      box.appendChild(h('div', { class: 'term' }, term.el));
      // command chips
      const chips = (stage.cmds || []).concat(stage.chips || []);
      (stage.chips || []).forEach((c) => { found[c] = true; });
      chips.forEach((c) => chipRow.appendChild(h('button', { class: 'chip', onclick: () => { term.insert(c); HS.sfx('tap'); } }, HS.fill(c))));
      box.appendChild(chipRow);
      setTimeout(() => term.input.focus(), 400);
      return box;
    },
  };

  function runStageAgain(stage, ctx, box) {
    const fresh = STAGES[stage.kind](stage, ctx);
    box.parentNode.replaceChild(fresh, box);
  }

  /* ================= TOOLKIT SCREEN ================= */
  function showTools() {
    go(() => {
      const wrap = h('div', { class: 'screen-inner' });
      wrap.appendChild(header('TOOLKIT', showDashboard));
      const body = h('div', { class: 'pad' });
      body.appendChild(h('p', { class: 'dim' }, 'Your instruments. Everything here runs offline, inside the app. Experiment freely.'));
      Object.keys(HS.TOOLS).forEach((id) => {
        const t = HS.TOOLS[id];
        const panel = h('div', { class: 'card tool-card collapsed' });
        const head = h('div', { class: 'tool-card-head', onclick: () => { panel.classList.toggle('collapsed'); if (!panel.classList.contains('collapsed') && !panel.dataset.built) { panel.dataset.built = '1'; panel.appendChild(t.make({})); } HS.sfx('tap'); } },
          h('div', { class: 'tch-text' }, h('span', { class: 'accent tch-name' }, t.icon + ' ' + t.name), h('span', { class: 'dim small' }, t.desc)), h('span', { class: 'chev accent' }, '▾'));
        panel.appendChild(head);
        body.appendChild(panel);
      });
      wrap.appendChild(body);
      return wrap;
    });
  }

  /* ================= ACHIEVEMENTS ================= */
  function showAchievements() {
    go(() => {
      const wrap = h('div', { class: 'screen-inner' });
      wrap.appendChild(header('ACHIEVEMENTS', showDashboard));
      const body = h('div', { class: 'pad' });
      const got = Object.keys(HS.state.achievements).length;
      body.appendChild(h('p', { class: 'dim' }, got + ' of ' + HS.ACHIEVEMENTS.length + ' unlocked.'));
      const grid = h('div', { class: 'ach-grid' });
      HS.ACHIEVEMENTS.forEach((a) => {
        const have = !!HS.state.achievements[a.id];
        const hidden = a.secret && !have;
        grid.appendChild(h('div', { class: 'ach' + (have ? ' have' : '') },
          h('div', { class: 'ach-ico' }, hidden ? '?' : a.icon),
          h('div', { class: 'ach-name' }, hidden ? '???' : a.name),
          h('div', { class: 'ach-desc dim small' }, hidden ? 'Hidden achievement' : a.desc)));
      });
      body.appendChild(grid);
      wrap.appendChild(body);
      return wrap;
    });
  }

  /* ================= PROFILE ================= */
  function showProfile() {
    go(() => {
      const wrap = h('div', { class: 'screen-inner' });
      wrap.appendChild(header('AGENT PROFILE', showDashboard));
      const body = h('div', { class: 'pad' });
      const r = HS.rankFor(totalXp());
      body.appendChild(h('div', { class: 'card' },
        h('div', { class: 'hero-name accent glow' }, HS.state.alias),
        h('div', { class: 'hero-rank' }, r.name),
        h('div', { class: 'stat-row' },
          stat(totalXp() + '', 'total XP'),
          stat(HS.LEVELS.filter((l) => levelDone(l.id)).length + '/20', 'missions'),
          stat(countStars() + '/60', 'stars'))));
      body.appendChild(h('div', { class: 'card' },
        h('div', { class: 'learn-head' }, '▸ CAREER STATS'),
        kv('Commands run', HS.state.stats.commands),
        kv('Hints used', HS.state.stats.hints),
        kv('Badges earned', Object.keys(HS.state.achievements).length)));
      // rank ladder
      const ladder = h('div', { class: 'card' }, h('div', { class: 'learn-head' }, '▸ RANK LADDER'));
      HS.RANKS.forEach((rk) => ladder.appendChild(h('div', { class: 'rank-row' + (totalXp() >= rk.xp ? ' reached' : '') }, h('span', {}, (totalXp() >= rk.xp ? '✓ ' : '· ') + rk.name), h('span', { class: 'dim small' }, rk.xp + ' XP'))));
      body.appendChild(ladder);
      wrap.appendChild(body);
      return wrap;
    });
  }
  function kv(k, v) { return h('div', { class: 'kv' }, h('span', { class: 'dim' }, k), h('span', { class: 'mono accent' }, String(v))); }

  /* ================= ABOUT (text preserved verbatim) ================= */
  function showAbout() {
    go(() => {
      const wrap = h('div', { class: 'screen-inner' });
      wrap.appendChild(header('ABOUT', showDashboard));
      const body = h('div', { class: 'pad' });
      const card = h('div', { class: 'card about-card' });
      card.appendChild(h('div', { class: 'about-logo accent glow' }, 'HackSim'));
      // The original description and creator credit, kept exactly.
      card.appendChild(h('p', {}, 'Created in 2025 by ', h('strong', { class: 'accent' }, 'Sicelo Tshuma'), '.'));
      card.appendChild(h('p', {}, 'Purpose: Missions like decoding passwords, tracing IPs, etc.'));
      card.appendChild(h('p', {}, 'Teaches: networking and cybersecurity fundamentals.'));
      card.appendChild(h('p', {}, 'Progression: Level-based challenges.'));
      body.appendChild(card);
      body.appendChild(h('div', { class: 'card safe-card' },
        h('div', { class: 'learn-head' }, '🛡 SAFETY'),
        h('p', { class: 'dim small' }, 'Every target, network, hash and terminal in HackSim is fully simulated inside this app. Nothing here scans, connects to, or attacks any real system. It teaches concepts; it never performs them. Use what you learn only on systems you own or are authorised to test.')));
      wrap.appendChild(body);
      return wrap;
    });
  }

  /* ================= SETTINGS ================= */
  function showSettings() {
    go(() => {
      const wrap = h('div', { class: 'screen-inner' });
      wrap.appendChild(header('SETTINGS', showDashboard));
      const body = h('div', { class: 'pad' });
      const s = HS.state.settings;
      function row(key, label, desc) {
        return h('label', { class: 'set-row' },
          h('div', {}, h('div', {}, label), h('div', { class: 'dim small' }, desc)),
          h('input', { type: 'checkbox', class: 'switch', checked: s[key], onchange: function () { s[key] = this.checked; HS.save(); HS.sfx('tap'); } }));
      }
      body.appendChild(h('div', { class: 'card' },
        row('sound', 'Sound effects', 'Synth beeps and confirmations.'),
        row('haptics', 'Haptics', 'Vibration feedback on key moments.'),
        row('motion', 'Animations', 'Typing effects, matrix rain, transitions.')));
      // text size
      const szVal = h('span', { class: 'accent mono' }, s.textSize + '%');
      const sz = h('input', { type: 'range', min: 85, max: 130, step: 5, value: s.textSize, class: 'slider' });
      sz.addEventListener('input', () => { s.textSize = parseInt(sz.value, 10); szVal.textContent = s.textSize + '%'; document.documentElement.style.setProperty('--text-zoom', s.textSize + '%'); HS.save(); });
      body.appendChild(h('div', { class: 'card' }, h('div', { class: 'tool-row' }, h('label', {}, 'Text size '), szVal), sz));
      body.appendChild(h('button', { class: 'btn danger wide', onclick: () => {
        modal('Reset all progress?', 'This erases your XP, stars and achievements. Your alias and settings stay. This cannot be undone.', [
          { t: 'Cancel', onclick: closeModal },
          { t: 'Erase', danger: true, onclick: () => { HS.reset(); closeModal(); HS.sfx('bad'); showDashboard(); } },
        ]);
      } }, 'RESET PROGRESS'));
      body.appendChild(h('div', { class: 'footer-note dim small' }, 'HackSim v2.0 · bundled JetBrains Mono (SIL OFL) · all activity simulated'));
      wrap.appendChild(body);
      return wrap;
    });
  }

  /* ================= modal ================= */
  let modalEl = null;
  function modal(title, body, actions) {
    closeModal();
    const btns = h('div', { class: 'modal-btns' }, actions.map((a) => h('button', { class: 'btn' + (a.danger ? ' danger' : ' ghost'), onclick: a.onclick }, a.t)));
    modalEl = h('div', { class: 'modal-wrap', onclick: (e) => { if (e.target === modalEl) closeModal(); } },
      h('div', { class: 'modal' }, h('div', { class: 'modal-title accent' }, title), h('p', { class: 'dim' }, body), btns));
    document.body.appendChild(modalEl);
    requestAnimationFrame(() => modalEl.classList.add('in'));
  }
  function closeModal() { if (modalEl) { modalEl.remove(); modalEl = null; } }

  /* ================= helpers ================= */
  function swap(a, i, j) { const t = a[i]; a[i] = a[j]; a[j] = t; }
  function shuffleStable(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); swap(a, i, j); } }

  /* ================= easter egg: the white rabbit ================= */
  function plantRabbit() {
    // A faint ◐ appears once in a while in the corner. Follow it.
    setTimeout(function tick() {
      if (!document.getElementById('rabbit') && Math.random() > 0.4) {
        const r = h('button', { id: 'rabbit', class: 'rabbit', onclick: () => { r.remove(); HS.grant('rabbit'); } }, '◐');
        document.body.appendChild(r);
        setTimeout(() => { if (r.parentNode) r.remove(); }, 6000);
      }
      setTimeout(tick, 18000);
    }, 12000);
  }

  /* ================= boot ================= */
  HS.load();
  document.documentElement.style.setProperty('--text-zoom', (HS.state.settings.textSize || 100) + '%');
  /* Called by the Android shell for the system back button. Returns true when handled. */
  window.HackSim = {
    onBack: function () {
      if (modalEl) { closeModal(); return true; }
      if (backAction) { HS.sfx('tap'); backAction(); return true; }
      return false;
    },
  };
  boot();
  plantRabbit();
})();
