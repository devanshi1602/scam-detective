# Scam Detective

**Suspicious messages land on your desk. Inspect the clues with your hands, then stamp each one SCAM or SAFE. New case daily.**

Built for the Meta VR Start Developer Competition 2026. Planned entry: **Gaming track, New Experience division**. It is also aimed at these special awards: *Best First Five Minutes*, *Best Reason to Come Back*, and *Best Accessibility Forward Experience*.

- **Tech:** WebXR, plain JavaScript and WebGL. No libraries, no install.
- **The whole game is one file,** `dist/index.html` (about 95 KB).
- **All brands, phone numbers and links in the game are made up.**

---

## 1. Swap it into your Devpost entry (you can only have one entry)

1. **Put it online.** On GitHub, create a new **public** repository called `scam-detective`. Upload `dist/index.html` to the top level of the repository, keeping the name `index.html`. Then go to **Settings → Pages**, choose *Deploy from a branch*, select `main` and `/ (root)`, and click **Save**. Your link will be `https://devanshi1602.github.io/scam-detective/`.
2. **Test it:** on a computer, click "Play on this screen". Then open the link in the Meta Quest Browser, or in Chrome with the Immersive Web Emulator.
3. **Record a new video,** under 3 minutes. The plan is below.
4. **Edit your Devpost submission.** Open your project page and click **Edit**. Replace the name, tagline, description, links, video and "Built with" tags using section 4. Keep the track as **Gaming / New Experience**, then **save** it.
5. Finish before **Nov 18, 12:00pm PT (1:30am IST Nov 19)**. You can't change anything after the deadline.

You can leave the Lumen Garden repository online. It just won't be your entry any more.

## 2. How to play

1. A message card stands on your desk. It might be an SMS, an email, a chat, a payment request or a pop-up.
2. **Mark anything suspicious** by touching it with your fingertip, or by pointing and pinching. Marked parts get a red outline. Touch them again to unmark.
3. **Press a stamp:** the red **SCAM** stamp or the green **SAFE** one.
4. The panel then shows whether you were right, which red flags you found (✓) and which you missed (○), and a one-line safety tip.

**Scoring:** +100 for the right verdict, +25 for each real red flag you marked, −10 for each part you marked that was actually fine, and −10 for each hint.

**Each daily case** has 8 messages: 5 scams and 3 real ones. Everyone gets the same case on a given day. The real messages are there so players learn to stay alert without being afraid of every message. A new player's first case starts with an easy tutorial message.

**Reason to come back:** a daily case, a streak, and detective ranks (Rookie → Junior Detective → Detective → Inspector → Cyber Chief). Training mode gives unlimited extra messages.

**The scams covered** are the ones most common in India today:
- fake KYC and bank alerts
- UPI "collect request" and QR code tricks
- "digital arrest" calls
- task-job scams
- fake delivery fees
- electricity disconnection threats
- prize, tax-refund and loan-app scams
- SIM-swap OTP theft
- fake virus pop-ups
- "Hi Mom, new number" scams
- look-alike domains

**Accessibility:**
- **Read aloud** reads the message, and later the explanation.
- **Big text** mode makes the card larger.
- One hand is enough, there's no time pressure, and everything can be done seated.
- Every verdict uses words and outline styles as well as colour.
- The board height is adjustable.

At the end of each case, the game points players to India's official reporting channels: **cybercrime.gov.in** and the **1930** helpline.

## 3. What has been checked

| Check | Result |
|---|---|
| All 25 messages: every clue is wired up, scams have 2 or more red flags, real messages have none, notes fit on the panel. 400 days of daily cases: always 8 messages, 5 scams and 3 real (`node tests/cases.test.js`) | ✅ |
| Full daily case played with the mouse: marking clues, both stamps, a deliberately wrong verdict, the next message, case closed, streak saved, reload resumes correctly (`python3 tests/play.py`) | ✅ no errors |
| **Mocked** headset in both mixed reality and VR: fingertip poke on a clue and on the SCAM stamp, pinch-ray on the panel's Next button (`python3 tests/xr.py`) | ✅ no errors |
| Real Meta Quest hardware | ⚠️ not tested yet. Check text readability, stamp height and hand touch |

## 4. Devpost text (ready to paste)

**Name:** Scam Detective

**Tagline (123/140 characters):** Suspicious messages land on your desk. Inspect the clues with your hands, then stamp each one SCAM or SAFE. New case daily.

**Track / Division:** Gaming, New Experience

**Built with:** `webxr, javascript, webgl, html5, web-audio-api, web-speech-api, webxr-hand-tracking, mixed-reality, meta-quest-browser, github-pages, playwright`

**About the project:**

```markdown
## Inspiration
Online fraud is exploding. Every day, people lose their savings to fake KYC messages, UPI tricks and "digital arrest" calls, and the victims are often our own parents and grandparents. Most awareness campaigns are posters and long lists of rules that nobody remembers. I wanted something you *practise*, the way a detective practises spotting clues, so that the next time a real scam arrives, your hands and eyes already know what to look for.

## What it does
Scam Detective turns your real desk into a detective's desk in mixed reality. Each day a new case file arrives with 8 messages: SMS, emails, chats, payment requests and pop-ups. Five are scams and three are real, because the goal is to stay alert, not afraid of every message.

- **Inspect:** touch any part of the message that looks suspicious, or point and pinch at it, to mark it.
- **Decide:** press the big rubber **SCAM** or **SAFE** stamp on your desk.
- **Learn:** see which red flags you caught, which you missed, and one tip to remember.

There's a tutorial message for new players, a daily streak, detective ranks, unlimited training mode, read-aloud, a big-text mode, and a link to India's official reporting channels (cybercrime.gov.in, helpline 1930) at the end of every case.

## How I built it
Scam Detective is a WebXR app written from scratch in JavaScript and WebGL, with no game engine. It's a single ~95 KB page that opens instantly in the Meta Quest Browser.

- **Hands-first input:** fingertip tracking marks clues and presses the stamps, and the Quest's pinch-ray lets you play from a relaxed position.
- **Message cards** are drawn live onto a canvas texture. A small layout engine wraps the text and records exactly where each clue sits, so a tap lands on the right words.
- **Daily cases** are picked from the date, so everyone gets the same case each day.
- **Sound** is generated in code: rain ambience, paper slides, a satisfying stamp *thunk* placed in space where you press it, and chimes for correct answers. Read-aloud uses the browser's speech synthesis.
- **Testing:** automated tests check every message's clues and play a full case, including with a simulated headset.

## Challenges I faced
- **Making clues tappable without giving them away.** Each message has 3–5 tappable parts, and some are innocent ("Dear Customer" appears in real messages too). Marking something doesn't reveal whether it's a red flag. You only find out after you stamp.
- **Being fair to real messages.** An awareness game that treats everything as a scam teaches paranoia. Writing real bank OTPs, delivery updates and payment receipts with "good signs" was as important as writing the scams.
- **Reading in a headset.** Small text is hard to read in VR, so the cards use large type, high-contrast colours, a big-text mode and read-aloud.
- **Responsible content.** Every brand, number and link is made up, so the game teaches the patterns without copying real companies or creating anything that could be misused.

## What I learned
- Scams follow a few patterns that repeat across all their variations: urgency, secrecy, asking you to pay to receive money, and look-alike links.
- People learn these patterns far faster by doing than by reading.
- Designing for hands means designing for feedback. Hands have no vibration, so sound and visual changes have to confirm every touch.

## What's next
- More languages (Hindi, Tamil, Bengali and more), since scams arrive in every language.
- A family mode with slower pacing and voice guidance for older players.
- Voice-call scam scenarios.
- Sharing your daily score with friends.
```

**How hand interactions are implemented:**

> Scam Detective is fully playable with hands, start to finish. **Direct touch:** the game tracks your index fingertip. Touching a word, link or button on the message card marks or unmarks it as suspicious. A mark only registers when your finger pushes through the card from the front, so resting your hand nearby does nothing. Pressing down on a rubber stamp's handle stamps the message, with a short cooldown so a stamp can't fire twice by accident. **Point and pinch:** you can also point at any clue, stamp or panel button and pinch, using the Quest's built-in pinch-to-select ray. The ray hides automatically when your hand is close to the desk or a panel, so the two methods never clash. **Feedback without haptics:** hovered targets glow, marked clues get a red outline, the stamp visibly presses down, and every action has a sound placed where it happens.

**Meta VR capabilities used:** hand tracking (fingertip touch and pinch-ray), passthrough mixed reality, spatial audio, a seated design that fits a narrow field of view, and the Meta Quest Browser (WebXR). It also has a VR mode with a virtual room.

## 5. Demo video plan (under 3 minutes, recorded in the emulator or a headset)

| Time | Shot |
|---|---|
| 0:00–0:10 | **Hook:** a "digital arrest" message arrives. Mark "DIGITAL ARREST", then *thunk*, SCAM. Show the title. |
| 0:10–0:40 | The tutorial message: tap the dotted clues, then press the stamp. |
| 0:40–1:20 | Two scams (UPI request, look-alike bank email), showing the found and missed red flags. |
| 1:20–1:45 | A **real** message stamped SAFE, to show it's about staying alert, not afraid. |
| 1:45–2:15 | A deliberate mistake, the "Not quite" explanation, and read-aloud. |
| 2:15–2:40 | Case closed: the certificate, rank, streak, training mode and the 1930 / cybercrime.gov.in reminder. |
| 2:40–2:55 | End card: "Play now in the Meta Quest Browser" and your link. |

## 6. Project structure

```
src/cases.js   all 25 messages, clue notes, daily case picker, scoring, ranks
src/game.js    desk scene, card and panel drawing, stamps, hands/controller/mouse input, WebXR
src/sound.js   generated sound effects and rain ambience
src/gl.js      small WebGL renderer        src/math.js  matrix helpers
src/index.html landing page                build.js     inlines everything into dist/index.html
tests/         content tests, browser playthrough, mocked-XR test
```
