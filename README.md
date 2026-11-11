# Ethical-HackSim
Ethical Hacking Lab: A hands-on environment designed to teach the fundamentals of how computer systems work through practical, ethical security challenges.

Created by **Sicelo Tshuma**.

## What it is

HackSim is an Android game that teaches security fundamentals through 20 missions, from
"what makes a password strong" up to multi-step operations that combine everything.

**Everything is simulated.** The app has no `INTERNET` permission, the WebView blocks network
loads, and every host, company and address in the missions is fictional. It teaches concepts;
it never performs them.

| Tier | Missions | Topics |
|------|----------|--------|
| Beginner | 1 to 5 | Password strength, PIN cracking, Caesar, encoding vs encryption, Vigenère |
| Intermediate | 6 to 10 | Hashing, dictionary attacks, brute-force maths, phishing |
| Advanced | 11 to 15 | Port scanning, service fingerprinting, SQL injection, XSS |
| Expert | 16 to 20 | Recon-to-foothold, hardening, social engineering, zero-day triage, capture the flag |

Each mission has a briefing, a three-step hint system, and a "what you just learned" debrief.
On top of that: XP and seven ranks, three-star ratings, 12 achievements (two hidden), an offline
toolkit, synthesised sound, haptics, and a skippable boot sequence.

## Build and run

Requirements: a current Android Studio, JDK 17 or newer, and Android SDK Platform 37.

1. Open the project folder in Android Studio and let Gradle sync.
2. Press **Run** on a device or emulator (Android 7.0 / API 24 or newer).

From a terminal:

```bash
./gradlew assembleDebug
```

The APK is written to `app/build/outputs/apk/debug/app-debug.apk`.

Toolchain: Gradle 9.9.1, Android Gradle Plugin 9.5.1 (Kotlin support is built in),
`compileSdk` 37, `targetSdk` 36, `minSdk` 24.

## How it is organised

The game is a web app hosted in a locked-down WebView.

```
app/src/main/
  java/com/rt/hacksim/
    MainActivity.kt      WebView host: serves bundled assets only, handles insets and back
    AndroidBridge.kt     The only native surface the game can call: save, load, vibrate
  assets/
    index.html
    css/app.css          Theme (dark background, green terminal text)
    js/core.js           Helpers: DOM, ciphers, MD5, storage, sound, effects
    js/levels.js         ALL mission content, as plain data
    js/tools.js          Toolkit: cipher wheel, encoder, Vigenère, strength meter, hash lab
    js/terminal.js       The simulated terminal (answers commands from mission data)
    js/app.js            Boot sequence, dashboard, mission player, other screens
tests/e2e/               Automated playthrough of all 20 missions
```

## Adding a mission

Missions are data. Add an object to `HS.LEVELS` in `app/src/main/assets/js/levels.js`; the
dashboard, unlocking, XP and debrief pick it up automatically. The comment at the top of that
file documents every field. A mission is a list of stages, and each stage has a `kind`:

| Kind | What the player does |
|------|----------------------|
| `choice` | Picks one answer, with an explanation for every option |
| `sort` | Puts items in order |
| `text` | Types an answer, usually worked out with an embedded tool |
| `crack` | Cracks a PIN from feedback |
| `policy` | Tunes password rules until brute force takes long enough |
| `inbox` | Sorts emails into phishing and legitimate |
| `spot` | Taps the suspicious lines in an email or a piece of code |
| `terminal` | Types commands into a simulated terminal |

To add a new kind of stage, add a renderer to the `STAGES` table in `js/app.js`.

## Tests

The end-to-end test plays every mission through the real UI in headless Chromium, then checks
that progress survives a restart and that no errors were logged.

```bash
npm install playwright
```

```bash
npx playwright install chromium
```

```bash
node tests/e2e/playthrough.js
```

```bash
node tests/e2e/bridge.js
```

## Credits

- Concept and original app: Sicelo Tshuma.
- Font: [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono), SIL Open Font License 1.1
  (licence text in `app/src/main/assets/fonts/OFL.txt`).

Use what you learn here only on systems you own or are authorised to test.
