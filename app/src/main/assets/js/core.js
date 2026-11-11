/* HackSim core: namespace, DOM helper, simulated crypto helpers, storage, sound, haptics.
   Everything in this app is a simulation. Nothing here opens a network connection. */
(function () {
  'use strict';
  const HS = (window.HS = window.HS || {});

  /* ---------- DOM helper (text only: user input never becomes HTML) ---------- */
  HS.h = function (tag, attrs) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
        else if (k === 'style') node.style.cssText = v;
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    for (let i = 2; i < arguments.length; i++) HS.add(node, arguments[i]);
    return node;
  };
  HS.add = function (node, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) child.forEach((c) => HS.add(node, c));
    else node.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  };
  HS.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); };

  /* ---------- Text codecs used by levels and tools ---------- */
  HS.caesar = function (text, shift) {
    const s = ((shift % 26) + 26) % 26;
    return text.replace(/[a-z]/gi, (c) => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base);
    });
  };
  HS.vigenere = function (text, key, decrypt) {
    const k = (key || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!k) return text;
    let i = 0;
    return text.replace(/[a-z]/gi, (c) => {
      const base = c <= 'Z' ? 65 : 97;
      let s = k.charCodeAt(i++ % k.length) - 65;
      if (decrypt) s = 26 - s;
      return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base);
    });
  };
  HS.b64enc = function (t) { try { return btoa(unescape(encodeURIComponent(t))); } catch (e) { return ''; } };
  HS.b64dec = function (t) {
    try { return decodeURIComponent(escape(atob(t.replace(/\s+/g, '')))); } catch (e) { return null; }
  };
  HS.hexenc = function (t) {
    return Array.from(t).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
  };
  HS.hexdec = function (t) {
    const clean = t.replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
    if (!clean || clean.length % 2) return null;
    let out = '';
    for (let i = 0; i < clean.length; i += 2) out += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
    return out;
  };
  HS.binenc = function (t) {
    return Array.from(t).map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  };
  HS.bindec = function (t) {
    const clean = t.replace(/[^01]/g, '');
    if (!clean || clean.length % 8) return null;
    let out = '';
    for (let i = 0; i < clean.length; i += 8) out += String.fromCharCode(parseInt(clean.substr(i, 8), 2));
    return out;
  };

  /* MD5 (RFC 1321). Used only to make the hashing lessons genuine. MD5 is broken
     for real security use, which is exactly what several levels teach. */
  HS.md5 = function (str) {
    const s = unescape(encodeURIComponent(str));
    const n = s.length;
    const words = [];
    for (let i = 0; i < n; i++) words[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    words[n >> 2] |= 0x80 << ((n % 4) * 8);
    const len = (((n + 8) >> 6) + 1) * 16;
    for (let i = 0; i < len; i++) words[i] = words[i] | 0;
    words[len - 2] = n * 8;
    const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    const K = [];
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
    let a = 0x67452301, b = 0xefcdab89 | 0, c = 0x98badcfe | 0, d = 0x10325476;
    for (let o = 0; o < len; o += 16) {
      let A = a, B = b, C = c, D = d;
      for (let i = 0; i < 64; i++) {
        let f, g;
        const r = i >> 4;
        if (r === 0) { f = (B & C) | (~B & D); g = i; }
        else if (r === 1) { f = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (r === 2) { f = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { f = C ^ (B | ~D); g = (7 * i) % 16; }
        const t = D; D = C; C = B;
        const x = (A + f + K[i] + words[o + g]) | 0;
        const rot = S[r * 4 + (i % 4)];
        B = (B + ((x << rot) | (x >>> (32 - rot)))) | 0;
        A = t;
      }
      a = (a + A) | 0; b = (b + B) | 0; c = (c + C) | 0; d = (d + D) | 0;
    }
    return [a, b, c, d].map((v) => {
      let out = '';
      for (let i = 0; i < 4; i++) out += ((v >>> (i * 8)) & 255).toString(16).padStart(2, '0');
      return out;
    }).join('');
  };

  /* Level text may contain {{codec:args}} so content stays readable as data.
     {{md5:word}} {{b64:text}} {{hex:text}} {{bin:text}} {{caesar:3:TEXT}} {{vig:KEY:TEXT}} {{alias}} */
  HS.fill = function (text) {
    if (typeof text !== 'string') return text;
    return text.replace(/\{\{(\w+)(?::([^}]*))?\}\}/g, (m, fn, arg) => {
      arg = arg || '';
      const cut = arg.indexOf(':');
      switch (fn) {
        case 'md5': return HS.md5(arg);
        case 'b64': return HS.b64enc(arg);
        case 'hex': return HS.hexenc(arg);
        case 'bin': return HS.binenc(arg);
        case 'caesar': return HS.caesar(arg.slice(cut + 1), parseInt(arg.slice(0, cut), 10));
        case 'vig': return HS.vigenere(arg.slice(cut + 1), arg.slice(0, cut));
        case 'alias': return (HS.state && HS.state.alias) || 'agent';
        default: return m;
      }
    });
  };

  /* ---------- Password maths (shared by the meter tool and the policy level) ---------- */
  HS.COMMON_PASSWORDS = ['123456', 'password', '12345678', 'qwerty', '123456789', '111111', 'abc123',
    'letmein', 'monkey', 'dragon', 'sunshine', 'iloveyou', 'admin', 'welcome', 'football', 'princess',
    'password1', 'shadow', 'master', 'superman', 'trustno1', 'hunter2', 'summer2024', 'qwerty123'];
  HS.charsetSize = function (pw) {
    let n = 0;
    if (/[a-z]/.test(pw)) n += 26;
    if (/[A-Z]/.test(pw)) n += 26;
    if (/[0-9]/.test(pw)) n += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) n += 32;
    return n;
  };
  HS.crackSeconds = function (charset, length, rate) {
    if (!charset || !length) return 0;
    return Math.pow(charset, length) / 2 / rate;
  };
  HS.humanTime = function (sec) {
    if (sec < 1) return 'instantly';
    const units = [['second', 60], ['minute', 60], ['hour', 24], ['day', 365], ['year', 1000],
      ['thousand years', 1000], ['million years', 1000], ['billion years', 1000], ['trillion years', Infinity]];
    let v = sec;
    for (let i = 0; i < units.length; i++) {
      if (v < units[i][1]) {
        const n = v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
        const name = units[i][0];
        return n + ' ' + name + (n !== 1 && !/years$/.test(name) ? 's' : '');
      }
      v /= units[i][1];
    }
    return 'longer than the universe';
  };

  /* ---------- Persistence ---------- */
  const KEY = 'hacksim_v2';
  HS.defaultState = function () {
    return {
      v: 2, alias: '', xp: 0,
      levels: {},            // id -> { stars, xp, bestTime }
      achievements: {},      // id -> timestamp
      toolsUsed: {},
      stats: { hints: 0, commands: 0, mistakes: 0 },
      settings: { sound: true, haptics: true, motion: true, textSize: 100 },
    };
  };
  HS.load = function () {
    let raw = '';
    try { if (window.AndroidBridge) raw = window.AndroidBridge.loadProgress() || ''; } catch (e) { /* ignore */ }
    if (!raw) { try { raw = localStorage.getItem(KEY) || ''; } catch (e) { /* ignore */ } }
    const base = HS.defaultState();
    try {
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && saved.v === 2) {
        Object.assign(base, saved);
        base.settings = Object.assign(HS.defaultState().settings, saved.settings || {});
        base.stats = Object.assign(HS.defaultState().stats, saved.stats || {});
        ['levels', 'achievements', 'toolsUsed'].forEach((k) => {
          if (!base[k] || typeof base[k] !== 'object') base[k] = {};
        });
      }
    } catch (e) { /* corrupt save: start fresh rather than crash */ }
    HS.state = base;
    return base;
  };
  HS.save = function () {
    const json = JSON.stringify(HS.state);
    try { if (window.AndroidBridge) window.AndroidBridge.saveProgress(json); } catch (e) { /* ignore */ }
    try { localStorage.setItem(KEY, json); } catch (e) { /* ignore */ }
  };
  HS.reset = function () {
    const settings = HS.state.settings;
    HS.state = HS.defaultState();
    HS.state.settings = settings;
    HS.save();
  };

  /* ---------- Sound (synthesised, no audio files) ---------- */
  let ctx = null;
  function audio() {
    if (!HS.state || !HS.state.settings.sound) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function tone(freq, start, dur, type, gain) {
    const ac = audio();
    if (!ac) return;
    try {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      const t = ac.currentTime + start;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.05, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* audio is decoration: never let it break the game */ }
  }
  const SOUNDS = {
    tap: () => tone(880, 0, 0.04, 'square', 0.025),
    key: () => tone(1400 + Math.random() * 300, 0, 0.018, 'square', 0.012),
    ok: () => { tone(660, 0, 0.09); tone(990, 0.08, 0.14); },
    bad: () => { tone(160, 0, 0.18, 'sawtooth', 0.06); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.16, 'square', 0.05)),
    unlock: () => { tone(440, 0, 0.08, 'triangle', 0.07); tone(880, 0.09, 0.2, 'triangle', 0.07); },
    boot: () => { tone(110, 0, 0.5, 'sawtooth', 0.03); tone(220, 0.15, 0.4, 'sawtooth', 0.02); },
  };
  HS.sfx = function (name) { if (SOUNDS[name]) SOUNDS[name](); };
  HS.buzz = function (ms) {
    if (!HS.state || !HS.state.settings.haptics) return;
    try {
      if (window.AndroidBridge) window.AndroidBridge.vibrate(ms);
      else if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { /* ignore */ }
  };

  /* ---------- Small effects ---------- */
  HS.motion = function () { return !HS.state || HS.state.settings.motion; };
  /* Type text into a node. Returns a function that finishes instantly. */
  HS.type = function (node, text, speed, done) {
    if (!HS.motion()) { node.textContent = text; if (done) done(); return function () {}; }
    let i = 0, stopped = false;
    node.textContent = '';
    node.classList.add('typing');
    function finish() {
      if (stopped) return;
      stopped = true;
      node.textContent = text;
      node.classList.remove('typing');
      if (done) done();
    }
    (function step() {
      if (stopped) return;
      i += 2;
      node.textContent = text.slice(0, i);
      if (i >= text.length) finish(); else setTimeout(step, speed || 14);
    })();
    return finish;
  };
  /* "Decrypt" a label: random glyphs settle into the real text. */
  HS.scramble = function (node, text, ms) {
    if (!HS.motion()) { node.textContent = text; return; }
    const glyphs = '01<>/\\[]{}#$%&*+=ABCDEF';
    const start = Date.now();
    (function step() {
      const p = Math.min(1, (Date.now() - start) / (ms || 700));
      const fixed = Math.floor(p * text.length);
      let out = text.slice(0, fixed);
      for (let i = fixed; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      node.textContent = out;
      if (p < 1) requestAnimationFrame(step);
    })();
  };

  /* Matrix rain on a canvas. Returns a stop() function. */
  HS.rain = function (canvas, opts) {
    opts = opts || {};
    const g = canvas.getContext('2d');
    const glyphs = 'アイウエオカキクケコサシスセソ0123456789ABCDEF<>/{}';
    let w, h, cols, drops, raf = 0, last = 0, alive = true;
    const size = opts.size || 16;
    function fit() {
      const r = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * r; canvas.height = h * r;
      g.setTransform(r, 0, 0, r, 0, 0);
      cols = Math.ceil(w / size);
      drops = [];
      for (let i = 0; i < cols; i++) drops[i] = Math.random() * -40;
    }
    function frame(t) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (t - last < (opts.interval || 55)) return;
      last = t;
      g.fillStyle = 'rgba(3,8,6,' + (opts.fade || 0.12) + ')';
      g.fillRect(0, 0, w, h);
      g.font = size + 'px monospace';
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * size;
        if (y > 0) {
          g.fillStyle = Math.random() > 0.96 ? '#d7ffe9' : '#00ff9f';
          g.globalAlpha = opts.alpha || 0.8;
          g.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * size, y);
        }
        drops[i] = y > h && Math.random() > 0.975 ? 0 : drops[i] + 1;
      }
      g.globalAlpha = 1;
    }
    fit();
    window.addEventListener('resize', fit);
    raf = requestAnimationFrame(frame);
    return function stop() {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
    };
  };
})();
