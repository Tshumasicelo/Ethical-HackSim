/* HackSim content. All 20 missions live here as plain data: add a mission by adding an object.

   LEVEL  { id, tier, title, tagline, xp, briefing[], objective, stages[], learned[], defend, codex[] }
   STAGE  { kind, title, prompt, hints[], tool? }   plus fields for its kind:
     choice   options[{ t, ok?, why }]
     sort     items[{ t, note }] listed in the CORRECT order, lowLabel, highLabel
     text     display?, accept[] (exact, normalised) or contains[] (substring), placeholder
     crack    digits, attempts
     policy   rate (guesses per second), targetYears, maxLength
     inbox    emails[{ from, addr, subject, body, context?, phish, why }]
     spot     lines[{ t, flag?, why }], mono?
     terminal world{...}, cmds[], apps{}, objectives[{ t, ev }], goal{ accept[] }, intro[]
   Text supports {{md5:x}} {{b64:x}} {{hex:x}} {{bin:x}} {{caesar:N:x}} {{vig:KEY:x}} (see core.js).

   Every host, company, person and address below is fictional. Addresses use reserved
   documentation ranges and the made-up ".sim" domain so nothing can point at a real system. */
(function () {
  'use strict';
  const HS = window.HS;

  HS.TIERS = [
    { id: 1, name: 'BEGINNER', sub: 'Passwords, codes and classic ciphers' },
    { id: 2, name: 'INTERMEDIATE', sub: 'Hashes, brute force and phishing' },
    { id: 3, name: 'ADVANCED', sub: 'Recon and web attacks in the terminal' },
    { id: 4, name: 'EXPERT', sub: 'Multi-step operations' },
  ];

  HS.RANKS = [
    { xp: 0, name: 'Script Kiddie' },
    { xp: 150, name: 'Apprentice' },
    { xp: 500, name: 'Analyst' },
    { xp: 1000, name: 'Pentester' },
    { xp: 1800, name: 'Red Teamer' },
    { xp: 2700, name: 'White Hat' },
    { xp: 3600, name: 'Guardian' },
  ];

  HS.ACHIEVEMENTS = [
    { id: 'first_blood', icon: '◆', name: 'First Blood', desc: 'Complete your first mission.' },
    { id: 'tier1', icon: '①', name: 'Boot Camp', desc: 'Clear every Beginner mission.' },
    { id: 'tier2', icon: '②', name: 'Hash Slinger', desc: 'Clear every Intermediate mission.' },
    { id: 'tier3', icon: '③', name: 'Shell Shock', desc: 'Clear every Advanced mission.' },
    { id: 'tier4', icon: '④', name: 'Operator', desc: 'Clear every Expert operation.' },
    { id: 'flawless', icon: '★', name: 'Flawless', desc: 'Earn 3 stars on 10 missions.' },
    { id: 'blind', icon: '◉', name: 'Flying Blind', desc: 'Clear an Advanced or Expert mission without hints.' },
    { id: 'speed', icon: '»', name: 'Zero Cool', desc: 'Clear any mission in under 60 seconds.' },
    { id: 'toolsmith', icon: '⚙', name: 'Toolsmith', desc: 'Try every tool in the toolkit.' },
    { id: 'sudo', icon: '#', name: 'Nice Try', desc: 'Ask the terminal for powers you do not have.', secret: true },
    { id: 'rabbit', icon: '◐', name: 'White Rabbit', desc: 'Follow it.', secret: true },
    { id: 'the_one', icon: '∞', name: 'The One', desc: 'Earn 3 stars on all 20 missions.' },
  ];

  const WORDLIST = ['123456', 'password', 'qwerty', 'letmein', 'sunshine', 'iloveyou', 'monkey',
    'dragon', 'football', 'welcome1', 'shadow', 'trustno1', 'qwerty123', 'summer2024', 'admin123',
    'falcon99', 'blackice1', 'starwars', 'hunter2', 'princess'].join('\n');

  HS.LEVELS = [
    /* ============================ BEGINNER ============================ */
    {
      id: 1, tier: 1, title: 'Weakest Link', tagline: 'What makes a password strong?', xp: 100,
      briefing: [
        'Welcome to the lab, {{alias}}. Nimbus Corp has hired us to test their security. That permission is what separates an ethical hacker from a criminal: we only touch what we are allowed to touch.',
        'Most break-ins start with a weak password. Before you can attack or defend one, you need to know what "weak" really means.',
      ],
      objective: 'Rank four passwords by strength, then explain why.',
      stages: [
        {
          kind: 'sort', title: 'Rank the passwords',
          prompt: 'Use the arrows to arrange the passwords, from the one an attacker cracks FIRST (top) to the one cracked LAST (bottom).',
          lowLabel: 'cracked first', highLabel: 'cracked last',
          items: [
            { t: '123456', note: 'The most common password on Earth. Cracked on the first guess.' },
            { t: 'Sunshine1', note: 'A dictionary word with a capital and a digit. Attackers try these patterns early.' },
            { t: 'xK9#mQ2$', note: 'Random, but only 8 characters. Short enough for fast hardware to grind through.' },
            { t: 'purple-tiger-eats-9-waffles', note: '27 characters. Length beats cleverness: the search space is astronomically larger.' },
          ],
          hints: [
            'Ask yourself: which of these would appear in a list of the most popular passwords?',
            'A real word plus a capital letter and a number is a pattern attackers guess early.',
            'The longest one is the strongest, even though it uses simple words. Order: 123456, Sunshine1, xK9#mQ2$, then the long passphrase.',
          ],
        },
        {
          kind: 'choice', title: 'Why did the last one win?',
          prompt: 'What is the single biggest factor that made the passphrase the hardest to crack?',
          options: [
            { t: 'It contains a number', why: 'One digit barely changes anything. "Sunshine1" had a digit too.' },
            { t: 'Its length', ok: true, why: 'Every extra character multiplies the number of guesses needed. Length wins.' },
            { t: 'It uses hyphens', why: 'Symbols help a little, but they are not the main reason here.' },
            { t: 'It is hard for a human to read', why: 'It is actually easy to read and remember. That is the beauty of a passphrase.' },
          ],
          hints: ['Compare the two strongest: one is 8 characters, the other is 27.', 'The answer is its length.'],
        },
      ],
      learned: [
        'Common passwords and dictionary words fall first, because attackers try known lists before anything else.',
        'Length matters more than complexity. Each added character multiplies the work for an attacker.',
        'A passphrase of several random words is both strong and easy to remember.',
      ],
      defend: 'Use a long, unique passphrase for every account and let a password manager remember them.',
      codex: [{ term: 'Passphrase', def: 'A password made of several words. Long, memorable and hard to guess.' }],
    },
    {
      id: 2, tier: 1, title: 'Four Digits', tagline: 'Crack a PIN using feedback', xp: 100,
      briefing: [
        'A test door in the lab is protected by a 4-digit PIN. The lock was built badly: after each attempt it tells you how close you were.',
        'That feedback is a leak. Use it to work out the code long before you run out of attempts.',
      ],
      objective: 'Crack the 4-digit PIN in 10 attempts or fewer.',
      stages: [
        {
          kind: 'crack', title: 'Crack the lock', digits: 4, attempts: 10,
          prompt: 'Every digit in the PIN is different. ● means a correct digit in the correct place. ○ means a correct digit in the wrong place.',
          hints: [
            'Start with 0123, then 4567. The dots tell you which group of digits is in the code.',
            'Once you know which digits are in the code, change one position at a time and watch how ● changes.',
            'If a guess scores no dots at all, that is great news: you can cross out all four of those digits.',
          ],
        },
        {
          kind: 'choice', title: 'How big was the haystack?',
          prompt: 'Without any feedback, how many different 4-digit PINs (0000 to 9999) would an attacker have to try at worst?',
          options: [
            { t: '40', why: 'That would be 4 × 10. But each position multiplies, it does not add.' },
            { t: '1,000', why: 'Close, but that is the count for 3 digits.' },
            { t: '10,000', ok: true, why: '10 × 10 × 10 × 10. A computer tries that many in well under a second.' },
            { t: '1,000,000', why: 'That would be a 6-digit PIN.' },
          ],
          hints: ['Each of the 4 positions has 10 possibilities. Multiply them.', '10 × 10 × 10 × 10 = 10,000.'],
        },
      ],
      learned: [
        'A short numeric code has a tiny search space: only 10,000 options for 4 digits.',
        'Feedback that reveals which part of a guess was right makes cracking dramatically faster. This is called an information leak.',
        'Real systems defend short codes with attempt limits and lockouts, and never say which part was wrong.',
      ],
      defend: 'Limit attempts, add delays after failures, and give the same generic error for every wrong guess.',
      codex: [{ term: 'Information leak', def: 'Any response that tells an attacker more than "yes" or "no".' }],
    },
    {
      id: 3, tier: 1, title: "Caesar's Secret", tagline: 'Break a 2,000-year-old cipher', xp: 100,
      briefing: [
        'We intercepted a note inside the training network. It was scrambled with a Caesar cipher: every letter is shifted along the alphabet by the same amount.',
        'There are only 25 possible shifts, so you can simply try them all. Use the Cipher Wheel below.',
      ],
      objective: 'Decode two intercepted notes.',
      stages: [
        {
          kind: 'text', title: 'Intercept #1',
          prompt: 'Slide the shift until the message becomes readable. What is the password?',
          display: '{{caesar:3:THE PASSWORD IS SUNRISE}}',
          tool: { id: 'caesar', text: '{{caesar:3:THE PASSWORD IS SUNRISE}}' },
          accept: ['sunrise'], placeholder: 'the password',
          hints: [
            'Move the slider one step at a time and watch the output.',
            'Julius Caesar himself used a shift of 3.',
            'At shift 3 the note reads THE PASSWORD IS SUNRISE.',
          ],
        },
        {
          kind: 'text', title: 'Intercept #2',
          prompt: 'This one uses a different shift. Where is the meeting?',
          display: '{{caesar:13:MEET AT THE NORTH GATE}}',
          tool: { id: 'caesar', text: '{{caesar:13:MEET AT THE NORTH GATE}}' },
          contains: ['north'], placeholder: 'the place',
          hints: [
            'Same approach: try every shift until you see real words.',
            'A shift of 13 is so popular it has its own name, ROT13.',
            'The note reads MEET AT THE NORTH GATE.',
          ],
        },
      ],
      learned: [
        'A Caesar cipher shifts every letter by the same amount. The shift is the key.',
        'With only 25 keys you can try every one. Trying all keys is called a brute-force attack.',
        'A cipher is only as strong as the number of keys an attacker must try.',
      ],
      defend: 'Never invent your own cipher. Modern encryption such as AES has more keys than there are atoms on Earth.',
      codex: [{ term: 'Cipher', def: 'A method for scrambling a message so only someone with the key can read it.' },
        { term: 'Brute force', def: 'Trying every possible key or password until one works.' }],
    },
    {
      id: 4, tier: 1, title: 'Not Encryption', tagline: 'Encoding hides nothing', xp: 100,
      briefing: [
        'A developer at Nimbus says the config file is "encrypted". It is not. It is encoded, and encoding needs no key at all.',
        'Base64, hex and binary are just different ways to write the same data. Anyone can reverse them. Use the Encoder to prove it.',
      ],
      objective: 'Decode two "protected" values and explain the difference.',
      stages: [
        {
          kind: 'text', title: 'Base64',
          prompt: 'The config file contains this value. Decode it. What is the secret after the colon?',
          display: '{{b64:secret:open_sesame}}',
          tool: { id: 'encoder', text: '{{b64:secret:open_sesame}}', mode: 'base64' },
          accept: ['open_sesame', 'opensesame', 'open sesame'], placeholder: 'the secret',
          hints: [
            'Letters, digits and a trailing "=" sign are the fingerprint of Base64.',
            'Set the Encoder to BASE64 and press DECODE.',
            'It decodes to secret:open_sesame.',
          ],
        },
        {
          kind: 'text', title: 'Hex',
          prompt: 'A log line stores a login as hex bytes. Decode it. What is the password after the colon?',
          display: '{{hex:admin:hunter2}}',
          tool: { id: 'encoder', text: '{{hex:admin:hunter2}}', mode: 'hex' },
          accept: ['hunter2'], placeholder: 'the password',
          hints: [
            'Pairs of characters using only 0-9 and a-f are hexadecimal bytes.',
            'Switch the Encoder to HEX and press DECODE.',
            'It decodes to admin:hunter2.',
          ],
        },
        {
          kind: 'choice', title: 'Encoding vs encryption',
          prompt: 'What is the real difference between encoding and encryption?',
          options: [
            { t: 'Encoding is just a slower kind of encryption', why: 'Speed is not the difference. Encoding offers no secrecy at all.' },
            { t: 'Encryption needs a secret key to reverse; encoding does not', ok: true, why: 'Exactly. Without a key, anyone can decode. With encryption, only the key holder can.' },
            { t: 'Encoding only works on text', why: 'Encoding works on any data, including images and files.' },
            { t: 'There is no difference', why: 'There is a huge one: you just reversed both values with no key.' },
          ],
          hints: ['Did you need a password or key to decode those values?', 'Encryption requires a secret key. Encoding does not.'],
        },
      ],
      learned: [
        'Encoding (Base64, hex, binary) changes how data looks, not who can read it.',
        'You can often recognise an encoding by its alphabet: "=" padding for Base64, 0-9 and a-f for hex.',
        'Encryption needs a secret key. If no key is involved, it is not protection.',
      ],
      defend: 'Never store secrets in Base64 and call it secure. Use real encryption and keep keys out of config files.',
      codex: [{ term: 'Encoding', def: 'A reversible format change that needs no key, such as Base64 or hex.' }],
    },
    {
      id: 5, tier: 1, title: 'Lock & Key', tagline: 'A cipher with a real key', xp: 100,
      briefing: [
        'The Caesar cipher fell because it has only 25 keys. The Vigenère cipher fixes that by using a keyword: each letter of the key gives a different shift.',
        'We recovered a message and a sticky note that says: "key = the emperor from mission 3".',
      ],
      objective: 'Use the keyword to decrypt the message.',
      stages: [
        {
          kind: 'text', title: 'Decrypt with the key',
          prompt: 'Enter the keyword in the Vigenère tool and decrypt. What is the vault code? (digits are fine)',
          display: '{{vig:CAESAR:THE VAULT CODE IS SEVEN TWO NINE}}',
          tool: { id: 'vigenere', text: '{{vig:CAESAR:THE VAULT CODE IS SEVEN TWO NINE}}' },
          accept: ['729', 'seven two nine', 'seventwonine', '7 2 9'], placeholder: 'the code',
          hints: [
            'Mission 3 was named after a Roman ruler.',
            'Type CAESAR into the KEY box and press DECRYPT.',
            'The message reads THE VAULT CODE IS SEVEN TWO NINE, so the code is 729.',
          ],
        },
        {
          kind: 'choice', title: 'Where does the security live?',
          prompt: 'You knew exactly how the cipher worked, yet you could not read the message until you had the key. What does that teach us?',
          options: [
            { t: 'A cipher is only safe if its method is kept secret', why: 'Secret methods always leak eventually. This is called "security through obscurity" and it fails.' },
            { t: 'A good system stays secure even when everything except the key is public', ok: true, why: 'This is Kerckhoffs\'s principle, and all modern cryptography is built on it.' },
            { t: 'Longer messages are always safer', why: 'Longer messages actually give an attacker more material to analyse.' },
            { t: 'Keys should be short so they are easy to share', why: 'Short keys repeat quickly, and repetition is exactly how Vigenère gets broken.' },
          ],
          hints: ['Think about what you were missing: the method, or the key?', 'Security should depend only on the key staying secret.'],
        },
      ],
      learned: [
        'A key turns one cipher into millions of different ciphers. Without the key, knowing the method is not enough.',
        'Kerckhoffs\'s principle: a system should stay secure even if everything about it, except the key, is public.',
        'Writing a key on a sticky note undoes all of that. Protecting the key is the whole job.',
      ],
      defend: 'Use well-known public algorithms, long random keys, and store keys separately from the data they protect.',
      codex: [{ term: 'Key', def: 'The secret value that locks and unlocks encrypted data.' }],
    },

    /* ============================ INTERMEDIATE ============================ */
    {
      id: 6, tier: 2, title: 'Fingerprints', tagline: 'How hashing works', xp: 150,
      briefing: [
        'Good systems never store your actual password. They store a hash: a fixed-length fingerprint calculated from it.',
        'A hash goes one way only. You can turn "hello" into a hash, but you cannot turn the hash back into "hello". Experiment in the Hash Lab.',
      ],
      objective: 'Explore how a hash behaves, then identify a leaked one.',
      stages: [
        {
          kind: 'text', title: 'Make a fingerprint',
          prompt: 'Type the word hello (lowercase) into the Hash Lab. Enter the first 4 characters of its MD5 hash.',
          tool: { id: 'hashlab' },
          accept: ['5d41'], placeholder: 'first 4 characters',
          hints: [
            'Type hello into the Hash Lab input. The hash appears underneath.',
            'Copy the first four characters of the hash.',
            'The hash of hello starts with 5d41.',
          ],
        },
        {
          kind: 'choice', title: 'One small change',
          prompt: 'Now change it to Hello with a capital H and compare the two hashes. What happened?',
          tool: { id: 'hashlab', text: 'hello' },
          options: [
            { t: 'Only the first character of the hash changed', why: 'Try it in the lab: nearly every character is different.' },
            { t: 'The hash stayed the same', why: 'Hashes are case sensitive. Even one changed bit gives a new hash.' },
            { t: 'The hash got longer', why: 'A hash is always the same length, whatever the input size.' },
            { t: 'Almost the whole hash changed', ok: true, why: 'This is the avalanche effect. A tiny change in the input scrambles the entire output.' },
          ],
          hints: ['Type Hello into the lab and look at the highlighted characters.', 'Nearly everything changes.'],
        },
        {
          kind: 'choice', title: 'Identify the leak',
          prompt: 'This hash leaked from a test database. You cannot reverse it, but you CAN hash guesses and compare. Which password produced it?',
          display: '{{md5:dragon}}',
          tool: { id: 'hashlab' },
          options: [
            { t: 'sunshine', why: 'Hash it in the lab and compare: it does not match.' },
            { t: 'monkey', why: 'Hash it in the lab and compare: it does not match.' },
            { t: 'dragon', ok: true, why: 'Match. You did not reverse the hash. You guessed, hashed and compared. That is how hash cracking works.' },
            { t: 'shadow', why: 'Hash it in the lab and compare: it does not match.' },
          ],
          hints: ['Type each candidate into the Hash Lab and compare with the leaked hash.', 'The leaked hash starts with 8621. Which word gives that?', 'It is dragon.'],
        },
      ],
      learned: [
        'A hash is a one-way fingerprint with a fixed length, whatever the size of the input.',
        'The avalanche effect: change one character and the whole hash changes.',
        'Attackers do not reverse hashes. They hash guesses and compare, so common passwords fall instantly.',
      ],
      defend: 'Store passwords with a slow, salted algorithm built for the job (bcrypt, scrypt, Argon2). Never plain MD5.',
      codex: [{ term: 'Hash', def: 'A one-way fingerprint of data. Same input, same hash. You cannot run it backwards.' }],
    },
    {
      id: 7, tier: 2, title: 'Rainbow Hunt', tagline: 'Run a dictionary attack', xp: 150,
      briefing: [
        'Nimbus gave us a dump of password hashes from their old staff portal and asked: "how bad is it?"',
        'You have a terminal and a wordlist of common passwords. Your simulated crack tool hashes each word and compares. This is a dictionary attack.',
      ],
      objective: 'Recover the admin password from the leaked hashes.',
      stages: [
        {
          kind: 'terminal', title: 'Crack the dump',
          prompt: 'Find the admin password and submit it.',
          cmds: ['ls', 'cat', 'hashid', 'crack'],
          intro: ['Leaked dump loaded into your sandbox.', 'Type help to list commands. Tap a chip to insert it.'],
          world: {
            fs: {
              'leak.txt': 'alice:{{md5:sunshine}}\nbob:{{md5:qwerty123}}\nadmin:{{md5:trustno1}}\ncarol:{{md5:Vx7!pL0q#Zr2mW}}',
              'wordlist.txt': WORDLIST,
            },
          },
          objectives: [
            { t: 'Read leak.txt', ev: 'cat:leak.txt' },
            { t: 'Identify the hash type', ev: 'hashid' },
            { t: 'Crack the admin hash', ev: 'crack:trustno1' },
          ],
          goal: { accept: ['trustno1'] },
          hints: [
            'Use ls to see your files, then cat leak.txt to read the dump.',
            'Run hashid followed by a hash to learn its type, then crack followed by the admin hash.',
            'The admin hash cracks to trustno1. Finish with: submit trustno1',
          ],
        },
        {
          kind: 'choice', title: 'The one that survived',
          prompt: 'Try cracking carol\'s hash if you have not already: the wordlist finds nothing. Why did hers survive?',
          options: [
            { t: 'Her hash used a better algorithm', why: 'All four were plain MD5. The algorithm was the same.' },
            { t: 'Her password was long, random and not in any wordlist', ok: true, why: 'A dictionary attack only finds passwords that someone has already thought of.' },
            { t: 'The crack tool had a bug', why: 'The tool worked. It simply ran out of words.' },
            { t: 'Admins cannot see her account', why: 'Access rights have nothing to do with hash strength.' },
          ],
          hints: ['Three passwords were on the wordlist. One was not.', 'Her password was unique and random.'],
        },
      ],
      learned: [
        'A dictionary attack hashes every word in a list and compares the results with the leaked hashes.',
        'Fast hashes like MD5 let attackers test billions of guesses per second.',
        'A salt (random data mixed into each hash) forces attackers to crack every account separately.',
        'A long, unique password is simply not in the dictionary.',
      ],
      defend: 'Hash passwords with a salt and a slow algorithm, and block passwords that appear in breach lists.',
      codex: [{ term: 'Dictionary attack', def: 'Guessing passwords from a list of likely candidates.' },
        { term: 'Salt', def: 'Random data added to each password before hashing, so identical passwords get different hashes.' }],
    },
    {
      id: 8, tier: 2, title: 'Brute Force Math', tagline: 'Make guessing take forever', xp: 150,
      briefing: [
        'Brute force means trying every combination. It always works eventually. The only question is how long "eventually" is.',
        'Nimbus wants a password policy that survives an attacker with a cracking rig doing 10 billion guesses per second.',
      ],
      objective: 'Design a policy that resists brute force for 1,000 years.',
      stages: [
        {
          kind: 'policy', title: 'Design the policy',
          prompt: 'Adjust the rules until an average brute-force attack takes at least 1,000 years.',
          rate: 1e10, targetYears: 1000, maxLength: 20,
          hints: [
            'Turn on more character types to grow the alphabet, and raise the length.',
            'Watch how one extra character changes the time much more than one extra character type.',
            'For example: lowercase + uppercase + digits at 14 characters is more than enough.',
          ],
        },
        {
          kind: 'choice', title: 'Online attacks',
          prompt: 'Those numbers assume the attacker stole the hashes and guesses offline. What best stops brute force against a live login page?',
          options: [
            { t: 'Hiding the login page URL', why: 'Hidden pages get found. This is security through obscurity.' },
            { t: 'Rate limiting and lockouts, plus multi-factor authentication', ok: true, why: 'Limits make each guess slow, and MFA means even a correct password is not enough.' },
            { t: 'Forcing a password change every week', why: 'Frequent forced changes push people toward weaker, predictable passwords.' },
            { t: 'Showing "wrong password" versus "wrong username"', why: 'That is a leak: it tells attackers which usernames exist.' },
          ],
          hints: ['Think about slowing the attacker down, and about needing more than a password.', 'Rate limits, lockouts and MFA.'],
        },
      ],
      learned: [
        'Search space = (alphabet size) to the power of (length). Length is the exponent, so it dominates.',
        'Offline attacks run at billions of guesses per second. Online attacks can be throttled to a handful.',
        'Multi-factor authentication protects an account even after its password is guessed.',
      ],
      defend: 'Require length over complexity, rate-limit logins, and turn on multi-factor authentication everywhere.',
      codex: [{ term: 'MFA', def: 'Multi-factor authentication: proving who you are with something more than a password.' }],
    },
    {
      id: 9, tier: 2, title: 'Gone Phishing', tagline: 'Sort real mail from bait', xp: 150,
      briefing: [
        'Attackers rarely break in. They log in, with a password someone handed over. Phishing is the art of asking nicely.',
        'You work at Nimbus Corp. Your address is {{alias}}@nimbuscorp.sim. Five messages just arrived. Decide which are attacks.',
      ],
      objective: 'Classify five emails as phishing or legitimate.',
      stages: [
        {
          kind: 'inbox', title: 'Triage the inbox',
          prompt: 'Read each message carefully. Check the sender address, the links and what is being asked of you.',
          emails: [
            {
              from: 'PayPaI Security', addr: 'security@paypa1-alerts.example', subject: 'Your account has been limited!',
              body: 'Dear Customer,\n\nWe noticed unusual activity. Your account will be permanently closed within 24 hours unless you confirm your details:\n\nhttp://paypa1-alerts.example/verify', phish: true,
              why: 'Lookalike name ("PayPaI" with a capital i, "paypa1" with a one), a generic greeting, and a deadline designed to make you panic.',
            },
            {
              from: 'IT Helpdesk', addr: 'helpdesk@nimbuscorp.sim', subject: 'Planned maintenance this Saturday',
              body: 'Hi all,\n\nThe file server will be offline on Saturday from 02:00 to 04:00 for updates. No action is needed from you.\n\nThanks,\nIT', phish: false,
              why: 'Internal domain, no links, no attachment, no request. It asks nothing of you, so it has nothing to steal.',
            },
            {
              from: 'Dana Whitfield (CEO)', addr: 'dana.whitfield.ceo@freemail.example', subject: 'Quick favour, are you at your desk?',
              body: 'I am stuck in a meeting and need you to buy 5 gift cards for a client right now. Keep this between us and send me the codes by reply. I will reimburse you today.', phish: true,
              why: 'The "CEO" writes from a free mail account, demands secrecy and urgency, and asks for gift cards. This is a classic business email compromise scam.',
            },
            {
              from: 'Parcel Express', addr: 'tracking@parcel-express.sim', subject: 'Your order #88213 is out for delivery',
              context: 'You ordered headphones from Parcel Express yesterday. Your receipt shows order #88213.',
              body: 'Hello,\n\nYour parcel #88213 will arrive today between 14:00 and 16:00.\n\nTrack it at https://parcel-express.sim/track/88213', phish: false,
              why: 'You were expecting it, the order number matches your receipt, and the link goes to the company\'s own domain. Context matters.',
            },
            {
              from: 'HR Team', addr: 'hr@nimbuscorp.sim.payroll-update.example', subject: 'Salary review 2026: action required',
              body: 'Please open the attached document to see your new salary.\n\nAttachment: Salary_Review_2026.pdf.exe', phish: true,
              why: 'The real domain is the END of the address: payroll-update.example, not nimbuscorp.sim. And ".pdf.exe" is a program pretending to be a document.',
            },
          ],
          hints: [
            'Read the sender address character by character. Lookalikes hide in plain sight.',
            'In an address, the true domain is the part just before the final dot-ending.',
            'Messages 1, 3 and 5 are phishing. Messages 2 and 4 are legitimate.',
          ],
        },
      ],
      learned: [
        'Phishing relies on urgency, authority and fear to stop you thinking.',
        'Check the real sender domain, not the display name. Lookalike characters (1 for l, 0 for o) are common.',
        'Unexpected attachments and requests for money, gift cards or secrecy are red flags.',
        'Not every email is an attack. Context, such as an order you really placed, matters.',
      ],
      defend: 'When in doubt, do not click. Contact the sender through a channel you already trust, and report the message.',
      codex: [{ term: 'Phishing', def: 'Tricking someone into giving up secrets or running malware by pretending to be someone they trust.' }],
    },
    {
      id: 10, tier: 2, title: 'Hook, Line & Sinker', tagline: 'Dissect a spear-phish', xp: 150,
      briefing: [
        'Spotting a phish is good. Explaining exactly why it is a phish is how you teach an entire company.',
        'This message reached a Nimbus employee this morning. Take it apart, piece by piece.',
      ],
      objective: 'Find every red flag, then pick the genuine link.',
      stages: [
        {
          kind: 'spot', title: 'Find the 4 red flags',
          prompt: 'Tap each part of the email that gives the attack away.',
          lines: [
            { t: 'From: Microsoft 365 Team <no-reply@micros0ft-support.example>', flag: true, why: 'Lookalike domain: "micros0ft" is spelled with a zero.' },
            { t: 'Subject: URGENT: your mailbox will be deleted in 2 hours', flag: true, why: 'Artificial urgency. Real providers do not delete mailboxes on a two-hour timer.' },
            { t: 'Dear User,', flag: true, why: 'Generic greeting. A real provider knows your name.' },
            { t: 'We detected an unusual sign-in to your account.', why: 'On its own this sentence is plausible. Real alerts say this too.' },
            { t: 'To keep your mailbox, verify your password here:', why: 'Suspicious in context, but the hard evidence is the link below it.' },
            { t: 'http://login.microsoftonline.com.account-verify.example/signin', flag: true, why: 'The real domain is account-verify.example. Everything before it is just a subdomain made to look familiar. It is also plain http.' },
            { t: 'Thank you, The Microsoft 365 Team', why: 'A polite sign-off proves nothing either way.' },
          ],
          hints: [
            'Look at the sender address, the subject, the greeting and the link.',
            'In the link, read the domain from right to left, starting at the first single slash.',
            'Flags: the sender domain, the urgent subject, "Dear User" and the link.',
          ],
        },
        {
          kind: 'choice', title: 'Which link is real?',
          prompt: 'Your bank is Nimbus Bank and its domain is nimbusbank.sim. Which link actually goes there?',
          options: [
            { t: 'https://nimbusbank.sim.secure-login.example/', why: 'The real domain here is secure-login.example. "nimbusbank.sim" is only a subdomain label.' },
            { t: 'https://secure.nimbusbank.sim/login', ok: true, why: 'The domain is nimbusbank.sim, and "secure" is a subdomain that the bank controls.' },
            { t: 'https://nimbusbank-sim.example/login', why: 'A hyphen instead of a dot makes this an entirely different domain.' },
            { t: 'http://nimbusbank.sim@198.51.100.7/login', why: 'Everything before the @ is a username. The browser really connects to 198.51.100.7.' },
          ],
          hints: ['Find the part immediately before the first single slash, then read right to left.', 'Only one option ends in nimbusbank.sim before the path.'],
        },
      ],
      learned: [
        'Read a URL from the first single slash backwards: the last two labels are the real domain.',
        'Subdomains, hyphens and the @ symbol are all used to disguise where a link really goes.',
        'Urgency, generic greetings and requests for credentials are the classic phishing trio.',
      ],
      defend: 'Type important addresses yourself or use bookmarks, and use a password manager: it will not auto-fill on a fake domain.',
      codex: [{ term: 'Spear phishing', def: 'Phishing aimed at one specific person or company, using details that make it convincing.' }],
    },

    /* ============================ ADVANCED ============================ */
    {
      id: 11, tier: 3, title: 'Knock Knock', tagline: 'Map a network with a port scan', xp: 200,
      briefing: [
        'Before testing a network, a pentester maps it: which machines are alive, and which doors (ports) are open on each.',
        'Scanning networks you do not own is illegal in many countries. This lab network is fully simulated inside the app, and Nimbus signed off on the test.',
      ],
      objective: 'Find the machine that is running Telnet.',
      stages: [
        {
          kind: 'terminal', title: 'Scan the lab network',
          prompt: 'One host on 10.0.7.0/24 still runs Telnet on port 23. Submit its IP address.',
          cmds: ['nmap', 'ping'],
          intro: ['Simulated network 10.0.7.0/24 attached. No real packets are sent.'],
          chips: ['10.0.7.0/24'],
          world: {
            nets: { '10.0.7.0/24': ['10.0.7.1', '10.0.7.21', '10.0.7.34', '10.0.7.50'] },
            hosts: {
              '10.0.7.1': { name: 'gateway', ports: { 53: ['domain', 'dnsmasq 2.89'], 443: ['https', 'nginx 1.24'] } },
              '10.0.7.21': { name: 'web01', ports: { 22: ['ssh', 'OpenSSH 9.6'], 80: ['http', 'nginx 1.24'], 443: ['https', 'nginx 1.24'] } },
              '10.0.7.34': { name: 'legacy-hr', ports: { 22: ['ssh', 'OpenSSH 7.2'], 23: ['telnet', 'Linux telnetd'], 80: ['http', 'Apache 2.2.8'] } },
              '10.0.7.50': { name: 'printer', ports: { 631: ['ipp', 'CUPS 2.4'], 9100: ['jetdirect', ''] } },
            },
          },
          objectives: [
            { t: 'Discover live hosts on the subnet', ev: 'sweep:10.0.7.0/24' },
            { t: 'Scan the ports of a host', ev: 'scan' },
            { t: 'Find port 23', ev: 'scan:10.0.7.34' },
          ],
          goal: { accept: ['10.0.7.34'] },
          hints: [
            'Scan the whole range first: nmap 10.0.7.0/24',
            'Then scan each live host in turn, for example: nmap 10.0.7.21',
            'Host 10.0.7.34 has 23/tcp open. Finish with: submit 10.0.7.34',
          ],
        },
        {
          kind: 'choice', title: 'Why does Telnet matter?',
          prompt: 'Why is an open Telnet port a serious finding in your report?',
          options: [
            { t: 'Telnet uses too much bandwidth', why: 'Telnet is tiny. Bandwidth is not the concern.' },
            { t: 'Telnet sends everything, including passwords, as readable text', ok: true, why: 'Anyone on the network path can read the session. SSH replaced Telnet for exactly this reason.' },
            { t: 'Port 23 is an unlucky number', why: 'Port numbers are only labels.' },
            { t: 'Telnet only works on printers', why: 'Telnet runs on almost anything, which is part of the problem.' },
          ],
          hints: ['Think about what an eavesdropper would see.', 'Telnet has no encryption.'],
        },
      ],
      learned: [
        'A port is a numbered door on a machine. Each open port is a service that is listening.',
        'Scanning has two phases: find live hosts, then find open ports on each one.',
        'Well-known ports hint at the service: 22 SSH, 23 Telnet, 80 HTTP, 443 HTTPS.',
        'Every open port is attack surface. Unencrypted services such as Telnet are findings by themselves.',
      ],
      defend: 'Close every port you do not need, replace Telnet with SSH, and put a firewall in front of everything else.',
      codex: [{ term: 'Port', def: 'A numbered endpoint on a machine where a network service listens.' },
        { term: 'Attack surface', def: 'Everything an attacker could possibly reach and poke at.' }],
    },
    {
      id: 12, tier: 3, title: 'Banner Grab', tagline: 'Fingerprint services and find the weak one', xp: 200,
      briefing: [
        'Knowing that a port is open is step one. Knowing exactly which software and version is behind it tells you whether it is vulnerable.',
        'Services often announce their version in a "banner". Scan with version detection, then look the versions up in the lab\'s advisory database.',
      ],
      objective: 'Find the outdated service and its advisory ID.',
      stages: [
        {
          kind: 'terminal', title: 'Fingerprint the server',
          prompt: 'One service on 10.0.7.34 has a known critical advisory. Submit the advisory ID.',
          cmds: ['nmap', 'searchvuln'],
          intro: ['Target: 10.0.7.34 (legacy-hr). Advisory database loaded offline.'],
          chips: ['10.0.7.34', '-sV'],
          world: {
            hosts: {
              '10.0.7.34': { name: 'legacy-hr', ports: { 21: ['ftp', 'vsftpd 2.3.4'], 22: ['ssh', 'OpenSSH 9.6'], 80: ['http', 'nginx 1.24'] } },
            },
            vulndb: [
              { match: 'vsftpd 2.3.4', id: 'SIM-2011-2523', sev: 'CRITICAL', desc: 'This release shipped with a backdoor that opens a remote shell.' },
              { match: 'openssh 9.6', id: null, desc: 'No critical advisories in the lab database.' },
              { match: 'nginx 1.24', id: null, desc: 'No critical advisories in the lab database.' },
            ],
          },
          objectives: [
            { t: 'Detect service versions (-sV)', ev: 'scanv:10.0.7.34' },
            { t: 'Look up a version in the advisory database', ev: 'vuln' },
            { t: 'Find the critical advisory', ev: 'vuln:SIM-2011-2523' },
          ],
          goal: { accept: ['sim-2011-2523'] },
          hints: [
            'Add the version flag: nmap -sV 10.0.7.34',
            'Look up each product and version, for example: searchvuln vsftpd 2.3.4',
            'The FTP server is the problem. Finish with: submit SIM-2011-2523',
          ],
        },
        {
          kind: 'choice', title: 'Your recommendation',
          prompt: 'You must not exploit this further without permission. What goes in your report as the fix?',
          options: [
            { t: 'Move FTP to a different port number', why: 'A scanner finds it again in seconds. The backdoor is still there.' },
            { t: 'Hide the version banner', why: 'That slows fingerprinting slightly, but the vulnerable software is still running.' },
            { t: 'Update or remove the vulnerable software', ok: true, why: 'Patching removes the flaw itself. Removing unused services is even better.' },
            { t: 'Nothing: it is an internal server', why: 'Attackers who get inside, and malicious insiders, love forgotten internal servers.' },
          ],
          hints: ['Which option actually removes the vulnerable code?', 'Patch it or remove it.'],
        },
      ],
      learned: [
        'Version detection turns "port 21 is open" into "this exact vulnerable release is running".',
        'Public advisory databases (such as CVE) list known flaws by product and version.',
        'Most real breaches use old, known vulnerabilities that simply were never patched.',
      ],
      defend: 'Keep an inventory of what you run, patch quickly, and uninstall services nobody uses.',
      codex: [{ term: 'CVE', def: 'Common Vulnerabilities and Exposures: the public catalogue of known security flaws.' },
        { term: 'Banner', def: 'Text a service sends when you connect, often revealing its name and version.' }],
    },
    {
      id: 13, tier: 3, title: 'Little Bobby Tables', tagline: 'Bypass a login with SQL injection', xp: 200,
      briefing: [
        'The Nimbus shop builds its login query by gluing your input straight into a SQL command. If your input contains SQL, the database will run it.',
        'The simulator shows you the exact query that the server builds. Watch how your input changes its meaning.',
      ],
      objective: 'Log in as admin without knowing the password.',
      stages: [
        {
          kind: 'terminal', title: 'Break the login',
          prompt: 'Log in to the simulated shop as admin without the password, then submit the flag.',
          cmds: ['curl', 'login'],
          intro: ['Target: http://shop.sim (simulated web app).', 'Type login and you will be asked for a username and a password.'],
          chips: ['http://shop.sim/', 'admin', "'", '--'],
          world: { web: { 'http://shop.sim/': 'Nimbus Shop\n-----------\nStaff login available. Use the login command.\n<!-- TODO: stop building SQL with string concatenation -->' } },
          apps: {
            login: {
              type: 'sqli-login', table: 'users', userCol: 'username', passCol: 'password',
              rows: [{ username: 'admin', password: 'S3cure!Vault#91', role: 'admin' }, { username: 'guest', password: 'guest', role: 'guest' }],
              flag: 'FLAG{QUOTES_ARE_CODE}',
            },
          },
          objectives: [
            { t: 'Try a normal login and read the query', ev: 'login:try' },
            { t: 'Break the query with a single quote', ev: 'sql:error' },
            { t: 'Log in as admin', ev: 'login:admin' },
          ],
          goal: { accept: ['flag{quotes_are_code}'] },
          hints: [
            'Log in as admin with any password and study the query. Then try a username that contains a single quote.',
            "A quote closes the string early. After it you can write SQL. Two dashes (--) turn the rest of the line into a comment.",
            "Username: admin' --   Password: anything. Then submit the flag that appears.",
          ],
        },
        {
          kind: 'choice', title: 'The fix',
          prompt: 'What is the correct way to stop this attack?',
          options: [
            { t: 'Block the word OR in usernames', why: 'Attackers have endless variations. Blocklists always miss something (and ban Mr. Orlando).' },
            { t: 'Use parameterised queries so input is always treated as data', ok: true, why: 'With parameters the database never interprets input as SQL, whatever it contains.' },
            { t: 'Hide the error messages', why: 'Good practice, but the injection still works without them.' },
            { t: 'Make the password field longer', why: 'Field length has nothing to do with it.' },
          ],
          hints: ['The root cause is that data and code were mixed together.', 'Parameterised queries (prepared statements).'],
        },
      ],
      learned: [
        'SQL injection happens when user input is pasted directly into a database query.',
        "A single quote ends the string. Everything after it is treated as SQL code.",
        'Error messages that show the query help an attacker to tune the attack.',
        'Parameterised queries keep code and data separate and stop injection completely.',
      ],
      defend: 'Always use parameterised queries, give the database account the least privilege it needs, and never show raw SQL errors to users.',
      codex: [{ term: 'SQL injection', def: 'Smuggling database commands into an application through its input fields.' }],
    },
    {
      id: 14, tier: 3, title: 'Union Jack', tagline: 'How a search box can leak a whole table', xp: 200,
      briefing: [
        'Bypassing a login is only the start. A search box that is built the same unsafe way can be steered into returning rows it was never meant to show.',
        'This is a safe reconstruction. You will match concepts to outcomes rather than run anything live, so you understand the risk well enough to report and fix it.',
      ],
      objective: 'Show you understand how data leaks through an injectable query, and how to stop it.',
      stages: [
        {
          kind: 'choice', title: 'Why the column count matters',
          prompt: 'To graft a second query onto a product search, an attacker must match the number of columns the page already shows. Why?',
          options: [
            { t: 'The database rejects a combined result unless both halves have the same shape', ok: true, why: 'Combining two result sets requires the same number of columns, so an attacker probes until the shapes line up.' },
            { t: 'Databases can only ever return one column', why: 'They return many columns. The constraint is that the two halves match each other.' },
            { t: 'It makes the page load faster', why: 'Performance is not the reason.' },
            { t: 'Column names have to be in alphabetical order', why: 'Order of names is not the constraint.' },
          ],
          hints: ['Think about stacking two tables on top of each other.', 'They must have the same number of columns to stack.'],
        },
        {
          kind: 'spot', title: 'Where did the leak come from?', mono: true,
          prompt: 'Here is the server code that built the search. Tap the single line that makes data leakage possible.',
          lines: [
            { t: 'app.get("/search", (req, res) => {', why: 'Defining a route is normal.' },
            { t: '  const term = req.query.q;', why: 'Reading the user\'s input is fine on its own.' },
            { t: '  const sql = "SELECT name, price FROM products WHERE name LIKE \'%" + term + "%\'";', flag: true, why: 'User input is glued straight into the SQL string, so the input can change the query\'s meaning. This is the flaw.' },
            { t: '  db.query(sql).then(rows => res.render("list", { rows }));', why: 'Rendering rows is fine once the query is safe.' },
            { t: '});', why: 'Closing the handler is normal.' },
          ],
          hints: ['Look for the line where text typed by a user becomes part of a command.', 'It is the line that concatenates term into the SQL string.'],
        },
        {
          kind: 'choice', title: 'The fix',
          prompt: 'Rewrite that line safely. Which approach stops the leak?',
          options: [
            { t: 'Pass the term as a bound parameter: ...WHERE name LIKE ? , then supply the value separately', ok: true, why: 'A bound parameter is always treated as data, never as query structure, so a search box can only ever search.' },
            { t: 'Remove spaces from the term', why: 'Injection does not need spaces; this is easily bypassed.' },
            { t: 'Uppercase the term before using it', why: 'Case has nothing to do with it.' },
            { t: 'Trust it because it is only a search box', why: 'Read-only injection still leaks every table the account can see.' },
          ],
          hints: ['The same fix as the login mission applies here.', 'Bind the value as a parameter instead of concatenating it.'],
        },
      ],
      learned: [
        'Any query built by concatenating user input is injectable, not just logins. Search, filters and sort fields all count.',
        'A read-only injection can still expose entire tables of data.',
        'Parameterised queries keep user input as data, which closes the whole class of attack.',
        'Giving each database account only the access it needs limits how much a single flaw can leak.',
      ],
      defend: 'Parameterise every query, apply least privilege to database accounts, and review code for string-built SQL.',
      codex: [{ term: 'Least privilege', def: 'Giving an account only the access it truly needs, so a breach reaches as little as possible.' }],
    },
    {
      id: 15, tier: 3, title: 'Script Kitty', tagline: 'Cross-site scripting, and why output must be escaped', xp: 200,
      briefing: [
        'A guestbook on the Nimbus site shows whatever visitors type, exactly as typed. If someone types markup instead of words, the browser may treat it as part of the page.',
        'That is cross-site scripting (XSS). You will reason about it in a sandbox, no live pages involved, so you can spot and fix it later.',
      ],
      objective: 'Understand how unescaped output becomes executable, and how escaping stops it.',
      stages: [
        {
          kind: 'choice', title: 'Why does the browser run it?',
          prompt: 'A comment is stored and later written straight into the page\'s HTML. Why can that let an attacker\'s content do more than display text?',
          options: [
            { t: 'The browser cannot tell the attacker\'s markup apart from the page\'s own markup', ok: true, why: 'Once content lands in the HTML unescaped, the browser parses it as part of the trusted page.' },
            { t: 'Comments are always trusted by browsers', why: 'Browsers do not have a notion of trusted comments; the problem is where the text is placed.' },
            { t: 'Because the page uses HTTPS', why: 'HTTPS protects data in transit; it does not change how the page is parsed.' },
            { t: 'Only old browsers do this', why: 'Every browser parses the HTML it is given.' },
          ],
          hints: ['The browser just parses whatever HTML it receives.', 'It cannot distinguish injected markup from the site\'s own markup.'],
        },
        {
          kind: 'choice', title: 'Stored vs reflected',
          prompt: 'The guestbook saves comments and shows them to every future visitor. What kind of XSS is that, and why is it worse?',
          options: [
            { t: 'Stored XSS: it is saved once and then served to everyone who views the page', ok: true, why: 'A single malicious comment affects every visitor, with no action needed from them.' },
            { t: 'Reflected XSS: it only runs for someone who clicks a crafted link', why: 'That describes reflected XSS, where the input bounces straight back in a response.' },
            { t: 'It is not XSS because it is saved in a database', why: 'Being stored is exactly what makes it stored XSS.' },
            { t: 'It is harmless because it is on the attacker\'s own screen', why: 'It is served to other visitors, not just the author.' },
          ],
          hints: ['One kind is saved and shown to everyone; the other needs a crafted link per victim.', 'Saved-and-served is stored XSS.'],
        },
        {
          kind: 'spot', title: 'Fix the render', mono: true,
          prompt: 'Tap the one line that lets a comment become part of the page instead of plain text.',
          lines: [
            { t: 'function renderComment(c) {', why: 'A render function is fine.' },
            { t: '  const el = document.createElement("div");', why: 'Creating an element is safe.' },
            { t: '  el.innerHTML = c.text;', flag: true, why: 'innerHTML parses the comment as HTML, so any markup in it becomes live page content. This is the flaw.' },
            { t: '  el.className = "comment";', why: 'Setting a class is safe.' },
            { t: '  list.appendChild(el);', why: 'Appending the element is fine once it holds only text.' },
          ],
          hints: ['Look for where the comment text is inserted as HTML rather than as text.', 'It is the innerHTML line; use textContent instead.'],
        },
      ],
      learned: [
        'XSS happens when user content is written into a page without being escaped, so the browser runs it as markup.',
        'Stored XSS is saved and served to many victims; reflected XSS runs from a crafted link.',
        'Writing user content with textContent (or escaping it) keeps it as text, never code.',
        'A Content Security Policy adds a second line of defence by restricting what a page may run.',
      ],
      defend: 'Escape output by default, prefer textContent over innerHTML, and add a Content Security Policy.',
      codex: [{ term: 'XSS', def: 'Cross-site scripting: getting a victim\'s browser to treat attacker-supplied content as part of a trusted page.' },
        { term: 'Escaping', def: 'Converting characters like < and > so they display as text instead of being parsed as markup.' }],
    },

    /* ============================ EXPERT ============================ */
    {
      id: 16, tier: 4, title: 'Operation Nightjar', tagline: 'Recon to foothold, end to end', xp: 300,
      briefing: [
        'Time to combine skills. Nimbus has authorised a full test of one server: find the way in, step by step, using what you have learned.',
        'Each stage depends on the last, exactly like a real engagement. Everything is simulated in the app.',
      ],
      objective: 'Scan, fingerprint, and recover the login that gets you a foothold.',
      stages: [
        {
          kind: 'terminal', title: 'Recon',
          prompt: 'Map host 198.51.100.23 and submit the open port that runs its web login.',
          cmds: ['nmap', 'ping'],
          intro: ['Authorised target: 198.51.100.23 (simulated).'],
          chips: ['198.51.100.23', '-sV'],
          world: {
            hosts: {
              '198.51.100.23': { name: 'portal', ports: { 22: ['ssh', 'OpenSSH 9.6'], 8080: ['http', 'Nimbus Portal 1.2'], 3306: ['mysql', 'MySQL 8.0'] } },
            },
          },
          objectives: [{ t: 'Scan the host', ev: 'scan:198.51.100.23' }, { t: 'Find the web port', ev: 'scanv:198.51.100.23' }],
          goal: { accept: ['8080'] },
          hints: ['Scan with versions: nmap -sV 198.51.100.23', 'The portal speaks HTTP on a non-standard port.', 'It is 8080. Finish with: submit 8080'],
        },
        {
          kind: 'text', title: 'Crack the recovered hash',
          prompt: 'The portal\'s backup exposed an admin password hash. Hash each candidate in the Hash Lab and compare. Which one is the password?',
          display: 'admin:{{md5:falcon99}}\n\ncandidates: dragon99  falcon99  eagle2024  shadow1',
          tool: { id: 'hashlab' },
          accept: ['falcon99'], placeholder: 'the password',
          hints: ['Type each candidate into the Hash Lab and paste the leaked hash into the compare box.', 'The leaked hash starts with {{md5:falcon99}}'.slice(0, 0) + 'It is a bird of prey and two digits.', 'The password is falcon99.'],
        },
        {
          kind: 'choice', title: 'Rules of engagement',
          prompt: 'You now have a working admin login for the portal. What is the correct next move in an authorised test?',
          options: [
            { t: 'Log in only as far as the agreed scope allows, document it, and report', ok: true, why: 'Ethical testing stays inside the agreed scope and proves access without causing harm.' },
            { t: 'Download every customer record as proof', why: 'Exfiltrating real data causes harm and usually exceeds the scope.' },
            { t: 'Leave a note on their homepage', why: 'Defacement is damage, never part of a professional test.' },
            { t: 'Share the password in a public forum', why: 'Disclosing credentials is reckless and unethical.' },
          ],
          hints: ['The difference between a pentester and a criminal is permission and restraint.', 'Stay in scope, document, report.'],
        },
      ],
      learned: [
        'Real tests chain simple steps: recon, fingerprint, then use a weakness you found.',
        'Findings compound: an exposed hash plus a weak password equals account access.',
        'Scope and authorisation define where a test stops. Proof of access is the goal, not damage.',
      ],
      defend: 'Reduce exposed services, store password hashes safely, and keep backups off the public internet.',
      codex: [{ term: 'Foothold', def: 'The first access an attacker gains, used as a base for further steps.' },
        { term: 'Scope', def: 'The agreed boundaries of a security test: what you may touch and how far you may go.' }],
    },
    {
      id: 17, tier: 4, title: 'Defence in Depth', tagline: 'Harden the server you just broke', xp: 300,
      briefing: [
        'The best way to prove you understand an attack is to shut it down. Nimbus wants the portal from the last mission hardened.',
        'Prioritise: you cannot do everything at once, so pick the fixes that remove the most risk first.',
      ],
      objective: 'Choose the right fix for each weakness and order your response.',
      stages: [
        {
          kind: 'choice', title: 'The exposed database port',
          prompt: 'MySQL on 3306 was reachable from the internet. Best fix?',
          options: [
            { t: 'Firewall it off so only the app server can reach it', ok: true, why: 'A database should never face the internet. Restrict it to the hosts that need it.' },
            { t: 'Change the MySQL port to 3307', why: 'Scanners find it instantly; obscurity is not security.' },
            { t: 'Rename the database', why: 'The port is still open to the world.' },
            { t: 'Leave it; MySQL needs a password anyway', why: 'An exposed database is a huge target even with a password.' },
          ],
          hints: ['Should a database ever be reachable from the open internet?', 'Put a firewall in front of it.'],
        },
        {
          kind: 'choice', title: 'The weak admin password',
          prompt: 'The admin password "falcon99" cracked in seconds. Which change helps most?',
          options: [
            { t: 'A long unique passphrase plus multi-factor authentication', ok: true, why: 'Length defeats cracking, and MFA means a stolen password alone is not enough.' },
            { t: 'Add one more digit: falcon999', why: 'Still short and still guessable from the same wordlist pattern.' },
            { t: 'Force a password change every 30 days', why: 'Frequent forced changes tend to produce weaker, patterned passwords.' },
            { t: 'Write it on a sticky note so nobody forgets it', why: 'That just moves the secret somewhere easy to steal.' },
          ],
          hints: ['Combine strong length with a second factor.', 'Passphrase plus MFA.'],
        },
        {
          kind: 'sort', title: 'Order the response',
          prompt: 'A breach is suspected on the portal. Use the arrows to put these actions in the order you would carry them out.',
          lowLabel: 'do first', highLabel: 'do last',
          items: [
            { t: 'Contain: isolate the affected server from the network', note: 'Stop the bleeding first so the problem cannot spread.' },
            { t: 'Investigate: review logs to learn what happened', note: 'Once contained, work out the scope and the entry point.' },
            { t: 'Eradicate & patch: remove the foothold and fix the flaw', note: 'Close the hole you found so it cannot be reused.' },
            { t: 'Recover & review: restore service and update the playbook', note: 'Bring systems back safely and learn from the incident.' },
          ],
          hints: ['Emergency response is: contain, then investigate, then fix, then recover.', 'Containment always comes first.'],
        },
      ],
      learned: [
        'Defence in depth layers several controls so no single failure is fatal.',
        'Network segmentation keeps sensitive services like databases off the public internet.',
        'Incident response has an order: contain, investigate, eradicate, recover.',
        'The strongest fixes remove whole classes of attack, not single symptoms.',
      ],
      defend: 'Layer controls, segment networks, and rehearse an incident-response plan before you need it.',
      codex: [{ term: 'Defence in depth', def: 'Using multiple overlapping safeguards so one failure does not breach everything.' },
        { term: 'Incident response', def: 'The planned process for handling a security breach calmly and effectively.' }],
    },
    {
      id: 18, tier: 4, title: 'The Human Firewall', tagline: 'Stop a social-engineering chain', xp: 300,
      briefing: [
        'The strongest technical defences fall to a convincing phone call. This operation plays out a social-engineering attempt, one decision at a time.',
        'You are a Nimbus help-desk agent. Make the call that keeps the company safe.',
      ],
      objective: 'Make the right call at each step of a social-engineering attempt.',
      stages: [
        {
          kind: 'choice', title: 'The urgent caller',
          prompt: 'A caller says they are the new finance director, travelling, locked out, and needs their password reset "right now or payroll fails tonight". What do you do?',
          options: [
            { t: 'Verify their identity through the official process before doing anything', ok: true, why: 'Urgency is the attacker\'s tool. Identity verification is not optional, however senior the caller claims to be.' },
            { t: 'Reset it immediately; they sound senior and stressed', why: 'Authority and urgency are exactly how pretexting works.' },
            { t: 'Ask them to confirm the password they already have', why: 'If they had it they would not be calling; this also trains staff to share passwords.' },
            { t: 'Email the new password to the address they read out', why: 'An attacker will happily read out an address they control.' },
          ],
          hints: ['What feeling is the caller trying to create in you?', 'Verify identity through the official process first.'],
        },
        {
          kind: 'choice', title: 'The follow-up email',
          prompt: 'Minutes later an email from "IT Security" asks you to approve the reset by clicking a link. The sender is it-security@nimbuscorp-support.example. What is wrong?',
          options: [
            { t: 'The domain is nimbuscorp-support.example, not the real nimbuscorp.sim', ok: true, why: 'A lookalike domain timed to back up the phone call. The two attacks reinforce each other.' },
            { t: 'Nothing; IT often sends links', why: 'Look at the domain: it is not the company\'s.' },
            { t: 'The email arrived too quickly to be real', why: 'Timing is suspicious, but the hard evidence is the domain.' },
            { t: 'It is fine because it mentions security', why: 'Saying "security" proves nothing.' },
          ],
          hints: ['Read the sender domain carefully and compare it to the real one.', 'nimbuscorp-support.example is not nimbuscorp.sim.'],
        },
        {
          kind: 'choice', title: 'Close it out',
          prompt: 'How should you end this safely?',
          options: [
            { t: 'Refuse the request, report both the call and the email to security, and warn colleagues', ok: true, why: 'Reporting turns one person\'s good catch into protection for everyone.' },
            { t: 'Just delete the email and move on', why: 'Deleting it quietly leaves the next colleague exposed.' },
            { t: 'Reply asking the attacker to prove who they are', why: 'Engaging tips off the attacker and risks a more convincing follow-up.' },
            { t: 'Approve it to avoid conflict', why: 'Avoiding conflict is exactly the pressure the attack exploits.' },
          ],
          hints: ['Your refusal protects you; reporting protects everyone.', 'Refuse and report.'],
        },
      ],
      learned: [
        'Social engineering targets people, not machines, using authority, urgency and helpfulness.',
        'Identity verification procedures exist precisely so they can be followed under pressure.',
        'Attacks combine channels: a phone call backed by a lookalike email feels more convincing.',
        'Reporting an attempt protects the whole organisation, not just you.',
      ],
      defend: 'Build verification steps that cannot be skipped, make reporting easy and blame-free, and rehearse the awkward "no".',
      codex: [{ term: 'Social engineering', def: 'Manipulating people into breaking security, rather than attacking technology.' },
        { term: 'Pretexting', def: 'Inventing a believable scenario and false identity to extract information or access.' }],
    },
    {
      id: 19, tier: 4, title: 'Zero Day Drill', tagline: 'Triage under pressure', xp: 300,
      briefing: [
        'A critical flaw in software Nimbus runs has just been disclosed, with attacks already happening in the wild. There is no patch yet.',
        'You lead the response. Decisions now, with incomplete information, matter more than perfect ones later.',
      ],
      objective: 'Triage a live zero-day with the information you have.',
      stages: [
        {
          kind: 'choice', title: 'First move',
          prompt: 'The flaw is in your internet-facing web portal and is being actively exploited. A patch is hours or days away. What first?',
          options: [
            { t: 'Apply a mitigation now (such as a rule blocking the attack, or taking the service offline) while you wait for the patch', ok: true, why: 'When a flaw is actively exploited and unpatched, reducing exposure immediately beats waiting.' },
            { t: 'Wait for the official patch before doing anything', why: 'Waiting while you are actively attacked leaves the door open for days.' },
            { t: 'Email all staff to choose stronger passwords', why: 'Well-meant but unrelated to this flaw.' },
            { t: 'Assume your firewall already handles it', why: 'Hope is not a mitigation; verify and act.' },
          ],
          hints: ['The key facts: actively exploited, internet-facing, no patch yet.', 'Reduce exposure now with a mitigation.'],
        },
        {
          kind: 'sort', title: 'Patch order',
          prompt: 'You have four systems running the vulnerable software. Use the arrows to put them in patch order, most urgent at the top.',
          lowLabel: 'patch first', highLabel: 'patch last',
          items: [
            { t: 'Public web portal (internet-facing, exploited)', note: 'Reachable by anyone and already under attack: highest risk.' },
            { t: 'VPN gateway (internet-facing, holds credentials)', note: 'Also exposed and a gateway to everything inside.' },
            { t: 'Internal wiki (staff only, sensitive notes)', note: 'Only reachable from inside, so the attacker needs a foothold first.' },
            { t: 'Offline test box (no network)', note: 'Not reachable at all: lowest urgency.' },
          ],
          hints: ['Rank by exposure and impact: internet-facing and attacked comes first.', 'Public portal, VPN, internal wiki, then the offline box.'],
        },
        {
          kind: 'choice', title: 'After the fire',
          prompt: 'The patch is applied everywhere. What finishes the response properly?',
          options: [
            { t: 'Check logs for signs you were breached before patching, then write up lessons learned', ok: true, why: 'Patching stops future attacks; it does not undo a breach that already happened. Always check, then learn.' },
            { t: 'Close the incident immediately: the patch fixes everything', why: 'A patch does not remove an attacker who already got in.' },
            { t: 'Delete the logs to save space', why: 'Logs are your only record of what happened. Keep them.' },
            { t: 'Never mention it so the company is not embarrassed', why: 'Hiding incidents prevents learning and often breaks disclosure rules.' },
          ],
          hints: ['Does applying a patch tell you whether you were already breached?', 'Check for compromise, then capture lessons learned.'],
        },
      ],
      learned: [
        'A zero-day is a flaw with no patch available yet, so mitigation and exposure reduction come first.',
        'Prioritise by exposure and impact: internet-facing, actively attacked systems first.',
        'Patching does not erase a breach that already happened: always check logs afterwards.',
        'Every incident ends with a review so the next one is handled better.',
      ],
      defend: 'Keep an asset inventory, prepare mitigations in advance, and treat every incident as a lesson for the next.',
      codex: [{ term: 'Zero-day', def: 'A vulnerability being exploited before a fix exists. Defenders have had "zero days" to prepare.' },
        { term: 'Mitigation', def: 'A temporary measure that reduces risk while a full fix is prepared.' }],
    },
    {
      id: 20, tier: 4, title: 'Capture the Flag', tagline: 'Everything you have learned, in one run', xp: 400,
      briefing: [
        'Final operation, {{alias}}. One authorised target hides a flag behind a chain of challenges that touch every skill in your training.',
        'No new tricks. Just encoding, hashing, ciphers and a clear head. Capture the flag.',
      ],
      objective: 'Work through the chain and capture the final flag.',
      stages: [
        {
          kind: 'text', title: 'Stage 1: the dropped note',
          prompt: 'Recon turned up this encoded string. Decode it with the Encoder. Which cipher does the hidden note tell you to use next?',
          display: '{{b64:The next key is the ROT13 of: GUR INHYG VF BCRA}}',
          tool: { id: 'encoder', text: '{{b64:The next key is the ROT13 of: GUR INHYG VF BCRA}}', mode: 'base64' },
          contains: ['rot13', 'rot 13', 'rot-13'], placeholder: 'name of the cipher',
          hints: ['The trailing "=" and mixed letters and digits are the fingerprint of Base64.', 'Press nothing else: the Encoder shows the decoded text under "decode".', 'Decoded, it reads: The next key is the ROT13 of: GUR INHYG VF BCRA. The answer is ROT13.'],
        },
        {
          kind: 'text', title: 'Stage 2: undo the ROT13',
          prompt: 'Apply ROT13 (a Caesar shift of 13) to "GUR INHYG VF BCRA" using the Cipher Wheel. What phrase appears?',
          tool: { id: 'caesar', text: 'GUR INHYG VF BCRA' },
          contains: ['vault is'], placeholder: 'the phrase',
          hints: ['Set the Cipher Wheel shift to 13.', 'Three short words appear.', 'It reads THE VAULT IS OPEN.'],
        },
        {
          kind: 'terminal', title: 'Stage 3: open the vault',
          prompt: 'The vault service needs the admin password. Crack the hash below, then submit the flag the vault returns.',
          cmds: ['ls', 'cat', 'crack', 'open'],
          intro: ['Vault service online (simulated).', 'A password hash and the common-password list are in your sandbox.'],
          chips: ['vault.hash'],
          world: {
            fs: { 'vault.hash': 'admin:{{md5:blackice1}}', 'wordlist.txt': WORDLIST },
            vault: { password: 'blackice1', flag: 'FLAG{Y0U_4RE_TH3_0NE}' },
          },
          objectives: [
            { t: 'Read the hash', ev: 'cat:vault.hash' },
            { t: 'Crack the password', ev: 'crack:blackice1' },
            { t: 'Open the vault', ev: 'vaultopen' },
          ],
          goal: { accept: ['flag{y0u_4re_th3_0ne}'] },
          hints: [
            'cat vault.hash to read it, then crack with the hash to recover the password.',
            'The password is on the common list: it cracks to blackice1.',
            'Run: open blackice1   then submit the flag it prints.',
          ],
        },
      ],
      learned: [
        'Real challenges rarely announce which technique they need. Recognising the clues is the skill.',
        'Encoding, ciphers and hashing are tools you now reach for on sight.',
        'You started unable to rank two passwords. You just chained five techniques to capture a flag. That is the whole journey.',
      ],
      defend: 'Every weakness you exploited here has a simple fix you have already learned. Attacker and defender are two views of the same knowledge.',
      codex: [{ term: 'Flag', def: 'A secret token proving you solved a challenge. The heart of Capture the Flag competitions.' }],
    },
  ];
})();
