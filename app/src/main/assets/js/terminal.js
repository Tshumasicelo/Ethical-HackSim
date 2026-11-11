/* Simulated terminal used by the hands-on missions. It parses typed commands against
   the mission's "world" object and prints canned, deterministic output. There is NO real
   shell, filesystem, or network here: every command is matched by name and answered from data.
   The terminal reports progress by calling ctx.fire(event) and completes via ctx.win(). */
(function () {
  'use strict';
  const HS = window.HS;
  const h = HS.h;

  HS.makeTerminal = function (stage, ctx) {
    const world = stage.world || {};
    const screen = h('div', { class: 'term-screen' });
    const prompt = h('span', { class: 'term-prompt' }, HS.fill('{{alias}}@hacksim:~$ '));
    const input = h('input', { class: 'term-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', autocorrect: 'off' });
    const line = h('div', { class: 'term-line' }, prompt, input);
    screen.appendChild(line);
    const history = []; let hi = 0;
    const seen = {};               // objective events already fired
    let target = input;            // where chips insert: the prompt, or a form field
    let loginUser = null;          // state for the sqli-login app
    let sqlBroken = false;

    function out(text, cls) {
      const node = h('div', { class: 'term-out' + (cls ? ' ' + cls : '') }, HS.fill(text));
      screen.insertBefore(node, line);
      screen.scrollTop = screen.scrollHeight;
      if (ctx.token && cls !== 'dim') {
        const found = node.textContent.match(/\b[0-9a-f]{32}\b|\b\d{1,3}(?:\.\d{1,3}){3}\b|FLAG\{[^}]+\}|SIM-\d{4}-\d+/g);
        if (found) found.forEach(ctx.token);
      }
      return node;
    }
    function echo(cmd) { out(HS.fill('{{alias}}@hacksim:~$ ') + cmd, 'dim'); }
    function fire(ev) { if (!seen[ev]) { seen[ev] = 1; seen._any = 1; if (ctx.fire) ctx.fire(ev); } }

    (stage.intro || []).forEach((l) => out(l, 'dim'));
    out('');

    const fs = {};
    for (const k in (world.fs || {})) fs[k] = HS.fill(world.fs[k]);

    function cracked(hash) {
      // "crack" a hash by hashing each common wordlist entry — the real dictionary-attack loop.
      const list = (fs['wordlist.txt'] || HS.COMMON_PASSWORDS.join('\n')).split(/\s+/).filter(Boolean);
      hash = hash.toLowerCase();
      for (const w of list) if (HS.md5(w) === hash) return w;
      return null;
    }

    const COMMANDS = {
      help: function () {
        out('available commands:');
        (stage.cmds || []).concat(['help', 'clear', 'submit']).forEach((c) => out('  ' + c));
        out('submit <answer>   hand in your answer when you have it', 'dim');
      },
      clear: function () { Array.from(screen.querySelectorAll('.term-out')).forEach((n) => n.remove()); },
      ls: function () {
        const names = Object.keys(fs);
        if (!names.length) { out('(no files)'); return; }
        names.forEach((n) => out(n, 'accent'));
      },
      cat: function (args) {
        const f = args[0];
        if (!f) { out('usage: cat <file>', 'dim'); return; }
        if (fs[f] == null) { out('cat: ' + f + ': no such file', 'danger'); return; }
        fs[f].split('\n').forEach((l) => out(l));
        fire('cat:' + f);
      },
      hashid: function (args) {
        const hx = (args[0] || '').toLowerCase();
        if (/^[0-9a-f]{32}$/.test(hx)) { out('hash: ' + hx); out('best guess: MD5 (128-bit, 32 hex chars)', 'accent'); fire('hashid'); }
        else out('usage: hashid <32-hex-char hash>   (try one from the dump)', 'dim');
      },
      crack: function (args) {
        const hx = (args[0] || '').toLowerCase();
        if (!/^[0-9a-f]{32}$/.test(hx)) { out('usage: crack <hash>   — runs the wordlist against it', 'dim'); return; }
        out('running wordlist against hash...', 'dim');
        const pw = cracked(hx);
        if (pw) { out('[+] cracked: ' + pw, 'accent'); if (ctx.token) ctx.token(pw); fire('crack:' + pw); HS.sfx('ok'); }
        else { out('[-] not found in wordlist. This password is not a common one.', 'danger'); }
      },
      ping: function (args) {
        const ip = args[0] || '';
        const alive = hostAlive(ip);
        if (alive) out('64 bytes from ' + ip + ': icmp_seq=1 time=0.4 ms  (host up)', 'accent');
        else out('Request timeout for ' + (ip || '?') + '  (no reply)', 'dim');
      },
      nmap: function (args) {
        const sv = args.indexOf('-sV') !== -1;
        const target = args.filter((a) => a[0] !== '-')[0] || '';
        if (/\/\d+$/.test(target)) {              // subnet sweep
          const hosts = (world.nets && world.nets[target]) || [];
          if (!hosts.length) { out('nmap: no hosts found on ' + target, 'danger'); return; }
          out('Scanning ' + target + ' ...', 'dim');
          hosts.forEach((ip) => out('Host up: ' + ip + '  (' + (world.hosts[ip] ? world.hosts[ip].name : 'unknown') + ')', 'accent'));
          out(hosts.length + ' hosts up. Scan a single host to see its ports.', 'dim');
          fire('sweep:' + target);
          return;
        }
        const host = world.hosts && world.hosts[target];
        if (!host) { out('nmap: cannot resolve ' + (target || '(none)') + '. Give a host or a range.', 'danger'); return; }
        out('Scanning ' + target + ' (' + host.name + ') ...', 'dim');
        out('PORT     STATE  SERVICE' + (sv ? '    VERSION' : ''));
        Object.keys(host.ports).forEach((p) => {
          const [svc, ver] = host.ports[p];
          out((p + '/tcp').padEnd(9) + 'open   ' + svc.padEnd(8) + (sv ? '   ' + ver : ''), 'accent');
        });
        fire('scan:' + target);
        if (sv) fire('scanv:' + target);
      },
      searchvuln: function (args) {
        const q = args.join(' ').toLowerCase().trim();
        if (!q) { out('usage: searchvuln <product> <version>', 'dim'); return; }
        const db = world.vulndb || [];
        const hit = db.find((v) => q.indexOf(v.match.toLowerCase()) !== -1 || v.match.toLowerCase().indexOf(q) !== -1);
        if (!hit) { out('No entry for "' + q + '" in the local advisory database.', 'dim'); return; }
        if (hit.id) { out('[' + hit.sev + '] ' + hit.id, 'danger'); out(hit.desc); fire('vuln:' + hit.id); }
        else out('[none] ' + hit.desc, 'dim');
        fire('vuln');
      },
      curl: function (args) {
        const url = args.filter((a) => a[0] !== '-')[0] || '';
        const web = world.web || {};
        if (web[url] != null) { web[url].split('\n').forEach((l) => out(l)); fire('curl:' + url); }
        else out('curl: (6) could not resolve host — this is a simulated target.', 'dim');
      },
      login: function () {
        const app = (stage.apps && stage.apps.login);
        if (!app) { out('no login service here', 'dim'); return; }
        askLogin(app);
      },
      open: function (args) {
        if (!world.vault) { out('nothing to open here', 'dim'); return; }
        const pw = (args[0] || '');
        if (pw === world.vault.password) {
          out('vault: access granted.', 'accent');
          out('vault: flag → ' + world.vault.flag, 'flag');
          fire('vaultopen'); HS.sfx('win');
        } else out('vault: wrong password. Crack the hash first.', 'danger');
      },
      submit: function (args) {
        const ans = args.join(' ').trim().toLowerCase();
        const ok = (stage.goal.accept || []).some((a) => a.toLowerCase() === ans);
        if (ok) { out('>> ' + args.join(' '), 'accent'); ctx.win(); }
        else { out('submit: "' + args.join(' ') + '" is not it. Keep digging.', 'danger'); ctx.wrong && ctx.wrong(); }
      },
      // Easter egg: there is no root here.
      sudo: function () { out('{{alias}} is not in the sudoers file. This incident will be reported. (relax — it is a joke)', 'danger'); if (HS.grant) HS.grant('sudo'); },
      whoami: function () { out(HS.fill('{{alias}} — ethical hacker in training')); },
    };
    COMMANDS.rm = COMMANDS.sudo;   // any destructive-looking attempt hits the same safe joke

    function hostAlive(ip) {
      if (world.hosts && world.hosts[ip]) return true;
      if (world.nets) for (const n in world.nets) if (world.nets[n].indexOf(ip) !== -1) return true;
      return false;
    }

    /* Simulated SQL login. We SHOW the query string so the lesson is visible, then
       interpret a tiny, safe subset: a classic auth-bypass pattern logs you in as the
       first row; a lone quote prints a syntax error. Nothing is executed. */
    function askLogin(app) {
      const u = h('input', { class: 'term-input inline', placeholder: 'username', autocomplete: 'off', spellcheck: 'false' });
      const p = h('input', { class: 'term-input inline', placeholder: 'password', autocomplete: 'off', spellcheck: 'false' });
      const go = h('button', { class: 'chip on' }, 'LOGIN');
      const box = h('div', { class: 'term-form' }, h('span', {}, 'user '), u, h('span', {}, ' pass '), p, go);
      screen.insertBefore(box, line); u.focus(); target = u;
      u.addEventListener('focus', () => { target = u; });
      p.addEventListener('focus', () => { target = p; });
      function attempt() {
        const user = u.value, pass = p.value;
        box.remove(); target = input;
        const query = "SELECT * FROM " + app.table + " WHERE " + app.userCol + "='" + user + "' AND " + app.passCol + "='" + pass + "'";
        out('query → ' + query, 'dim');
        fire('login:try');
        // Unbalanced quote with nothing to neutralise it → syntax error (the probe).
        const quotes = (user + pass).split("'").length - 1;
        const neutralised = /--/.test(user) || /#/.test(user) || /'\s*or\s*'?1'?\s*=\s*'?1/i.test(user + "'" + pass);
        if (quotes % 2 === 1 && !neutralised) { out("SQL error: unterminated quoted string near \"'\"", 'danger'); out('(interesting — your quote became part of the query)', 'dim'); fire('sql:error'); sqlBroken = true; return; }
        // Auth-bypass: a comment after the username, or a tautology, logs in as the first row.
        const bypass = /^[^']*'\s*(--|#)/.test(user) || /'\s*or\s*'?1'?\s*=\s*'?1/i.test(user) || /'\s*or\s*1=1/i.test(user);
        if (bypass) {
          const row = app.rows[0];
          out('Logged in as ' + row.username + ' (' + row.role + ').', 'accent');
          out('flag → ' + app.flag, 'flag');
          fire('sql:error'); fire('login:' + row.username); HS.sfx('win');
          return;
        }
        const row = app.rows.find((r) => r[app.userCol] === user && r[app.passCol] === pass);
        if (row) { out('Logged in as ' + row.username + '.', 'accent'); if (row.role === 'admin') { out('flag → ' + app.flag, 'flag'); fire('login:' + row.username); } }
        else out('Login failed: invalid credentials.', 'danger');
      }
      go.addEventListener('click', attempt);
      [u, p].forEach((f) => f.addEventListener('keydown', (e) => { if (e.key === 'Enter') attempt(); }));
    }

    function run(raw) {
      const cmd = raw.trim();
      echo(cmd);
      if (!cmd) return;
      history.push(cmd); hi = history.length;
      HS.state.stats.commands++; HS.save();
      const parts = cmd.split(/\s+/);
      const name = parts[0].toLowerCase();
      const fn = COMMANDS[name];
      if (fn) fn(parts.slice(1));
      else out(name + ': command not found. Type help.', 'danger');
      screen.scrollTop = screen.scrollHeight;
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const v = input.value; input.value = ''; run(v); HS.sfx('key'); }
      else if (e.key === 'ArrowUp') { if (hi > 0) input.value = history[--hi] || ''; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { hi = Math.min(history.length, hi + 1); input.value = history[hi] || ''; }
    });
    screen.addEventListener('click', () => input.focus());

    return { el: screen, input: input, insert: function (t) { target.value += (target.value && !/\s$/.test(target.value) ? ' ' : '') + t; target.focus(); } };
  };
})();
