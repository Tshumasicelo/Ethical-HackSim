/* The toolkit. Each tool returns a DOM node. Tools are the player's instruments:
   a cipher wheel, an encoder, a password meter, a hash lab. All offline, all simulated. */
(function () {
  'use strict';
  const HS = window.HS;
  const h = HS.h;

  function markUsed(id) {
    if (!HS.state.toolsUsed[id]) { HS.state.toolsUsed[id] = Date.now(); HS.save(); if (HS.checkAchievements) HS.checkAchievements(); }
  }

  /* Caesar / ROT cipher wheel. opts.text seeds the ciphertext. */
  function caesar(opts) {
    opts = opts || {};
    markUsed('caesar');
    const input = h('textarea', { class: 'tool-in', rows: 2, placeholder: 'ciphertext' });
    input.value = HS.fill(opts.text || 'WKH TXLFN EURZQ IRA');
    const out = h('div', { class: 'tool-out' });
    const shiftLabel = h('span', { class: 'mono accent' }, '0');
    const slider = h('input', { type: 'range', min: 0, max: 25, value: 0, class: 'slider' });
    function render() {
      const s = parseInt(slider.value, 10);
      shiftLabel.textContent = s;
      out.textContent = HS.caesar(input.value, 26 - s);   // shift letters BACK to decode
    }
    slider.addEventListener('input', () => { HS.sfx('key'); render(); });
    input.addEventListener('input', render);
    render();
    return h('div', { class: 'tool' },
      h('div', { class: 'tool-row' }, h('label', {}, 'shift back by '), shiftLabel,
        h('button', { class: 'chip', onclick: () => { slider.value = 13; HS.sfx('tap'); render(); } }, 'ROT13')),
      slider, input, h('div', { class: 'tool-label' }, 'output'), out);
  }

  /* Multi-format encoder/decoder. */
  function encoder(opts) {
    opts = opts || {};
    markUsed('encoder');
    const input = h('textarea', { class: 'tool-in', rows: 2, placeholder: 'text or encoded value' });
    input.value = HS.fill(opts.text || 'open_sesame');
    const out = h('div', { class: 'tool-out' });
    const fmtDefs = [['base64', 'BASE64'], ['hex', 'HEX'], ['binary', 'BINARY'], ['url', 'URL']];
    let fmt = opts.mode || 'base64';
    const btns = fmtDefs.map(([id, lbl]) => h('button', {
      class: 'chip' + (id === fmt ? ' on' : ''),
      onclick: function () { fmt = id; btns.forEach((b) => b.classList.toggle('on', b === this)); HS.sfx('tap'); render(); },
    }, lbl));
    function render() {
      const t = input.value;
      let enc = '', dec = '';
      if (fmt === 'base64') { enc = HS.b64enc(t); dec = HS.b64dec(t); }
      else if (fmt === 'hex') { enc = HS.hexenc(t); dec = HS.hexdec(t); }
      else if (fmt === 'binary') { enc = HS.binenc(t); dec = HS.bindec(t); }
      else { try { enc = encodeURIComponent(t); } catch (e) { enc = ''; } try { dec = decodeURIComponent(t); } catch (e) { dec = null; } }
      HS.clear(out);
      HS.add(out, [h('div', { class: 'tool-label' }, 'encode →'), h('div', { class: 'mono' }, enc || '—'),
        h('div', { class: 'tool-label' }, 'decode →'), h('div', { class: 'mono' }, dec == null ? 'not valid ' + fmt : dec)]);
    }
    input.addEventListener('input', render);
    render();
    return h('div', { class: 'tool' }, h('div', { class: 'tool-row' }, btns), input, out);
  }

  /* Vigenere tool with a key box. */
  function vigenere(opts) {
    opts = opts || {};
    markUsed('vigenere');
    const input = h('textarea', { class: 'tool-in', rows: 2 });
    input.value = HS.fill(opts.text || '');
    const key = h('input', { class: 'tool-in', placeholder: 'KEY' });
    const out = h('div', { class: 'tool-out' });
    let decrypt = true;
    const toggle = h('button', { class: 'chip on', onclick: function () { decrypt = !decrypt; this.textContent = decrypt ? 'DECRYPT' : 'ENCRYPT'; this.classList.toggle('on', decrypt); HS.sfx('tap'); render(); } }, 'DECRYPT');
    function render() { out.textContent = HS.vigenere(input.value, key.value, decrypt); }
    input.addEventListener('input', render); key.addEventListener('input', render);
    render();
    return h('div', { class: 'tool' }, h('div', { class: 'tool-row' }, h('label', {}, 'key'), key, toggle), input, h('div', { class: 'tool-label' }, 'output'), out);
  }

  /* Password strength meter. */
  function meter() {
    markUsed('meter');
    const input = h('input', { class: 'tool-in', type: 'text', placeholder: 'type a password', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const bar = h('div', { class: 'meter-fill' });
    const barWrap = h('div', { class: 'meter' }, bar);
    const verdict = h('div', { class: 'mono' });
    const detail = h('div', { class: 'tool-label' });
    function render() {
      const pw = input.value;
      if (!pw) { bar.style.width = '0%'; verdict.textContent = ''; detail.textContent = ''; return; }
      const common = HS.COMMON_PASSWORDS.indexOf(pw.toLowerCase()) !== -1;
      const charset = HS.charsetSize(pw);
      const sec = common ? 0 : HS.crackSeconds(charset, pw.length, 1e10);
      let score = Math.min(100, Math.log10(Math.max(1, Math.pow(charset, pw.length))) * 4);
      if (common) score = 4;
      bar.style.width = score + '%';
      const tier = common ? 0 : score < 35 ? 1 : score < 60 ? 2 : score < 80 ? 3 : 4;
      bar.style.background = ['#ff4d6d', '#ff8a5b', '#ffd166', '#9ef01a', '#00ff9f'][tier];
      verdict.textContent = ['in a breach list', 'very weak', 'weak', 'strong', 'very strong'][tier];
      verdict.style.color = bar.style.background;
      detail.textContent = common ? 'This exact password appears in public breach lists — cracked instantly.'
        : 'Alphabet ' + charset + ' chars, length ' + pw.length + ' → a 10 billion/sec rig averages ' + HS.humanTime(sec) + '.';
    }
    input.addEventListener('input', () => { HS.sfx('key'); render(); });
    return h('div', { class: 'tool' }, input, barWrap, verdict, detail);
  }

  /* Hash lab: live MD5 with avalanche highlighting against a comparison value. */
  function hashlab(opts) {
    opts = opts || {};
    markUsed('hashlab');
    const input = h('input', { class: 'tool-in', type: 'text', placeholder: 'type anything', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    input.value = HS.fill(opts.text || '');
    const hashOut = h('div', { class: 'mono hash-out' });
    const cmp = h('input', { class: 'tool-in', placeholder: 'optional: paste a hash to compare', autocomplete: 'off', spellcheck: 'false' });
    const cmpNote = h('div', { class: 'tool-label' });
    function render() {
      const hx = HS.md5(input.value);
      HS.clear(hashOut);
      const other = cmp.value.trim().toLowerCase();
      for (let i = 0; i < hx.length; i++) {
        const diff = other && other[i] && other[i] !== hx[i];
        hashOut.appendChild(h('span', { class: diff ? 'hl' : '' }, hx[i]));
      }
      if (!other) cmpNote.textContent = 'MD5 is always 32 hex characters, whatever the input length.';
      else if (other === hx) { cmpNote.textContent = '✓ exact match — this input produced that hash.'; cmpNote.style.color = 'var(--accent)'; }
      else { cmpNote.textContent = '✗ no match — highlighted characters differ.'; cmpNote.style.color = 'var(--danger)'; }
    }
    input.addEventListener('input', () => { HS.sfx('key'); render(); });
    cmp.addEventListener('input', render);
    render();
    return h('div', { class: 'tool' }, input, h('div', { class: 'tool-label' }, 'MD5 fingerprint'), hashOut, cmp, cmpNote);
  }

  HS.TOOLS = {
    caesar: { name: 'Cipher Wheel', icon: '◎', make: caesar, desc: 'Shift letters along the alphabet (Caesar / ROT13).' },
    encoder: { name: 'Encoder', icon: '⇄', make: encoder, desc: 'Convert Base64, hex, binary and URL encoding.' },
    vigenere: { name: 'Vigenère', icon: '⚿', make: vigenere, desc: 'A keyword cipher with many keys.' },
    meter: { name: 'Strength Meter', icon: '▮', make: meter, desc: 'Estimate how long a password survives.' },
    hashlab: { name: 'Hash Lab', icon: '#', make: hashlab, desc: 'See MD5 fingerprints and the avalanche effect.' },
  };
})();
