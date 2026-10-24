# Scam Detective

**Suspicious messages land on your desk. Inspect the clues with your hands, then stamp each one SCAM or SAFE. A new case arrives every day.**

Scam Detective is a mixed reality game for Meta Quest that teaches people to spot online scams by practising, not by reading rules. It runs in the Meta Quest Browser, with nothing to install.

▶ **Play it:** https://devanshi1602.github.io/scam-detective/

Built for the Meta VR Start Developer Competition 2026 (Gaming track).

> All brands, phone numbers and links in the game are made up. They teach the patterns real scams use without copying any real company.

---

## Why this game?

Almost everyone receives messages like *"Your bank account will be BLOCKED today, update KYC now"*. Scammers only need one person to tap at the wrong moment, and that person is often a parent or grandparent. Posters and lists of rules are easy to forget. Scam Detective lets you practise spotting the clues, so you recognise them when a real scam arrives.

## How to play

1. A message card appears on your desk: an SMS, email, chat, payment request or browser pop-up.
2. **Mark anything suspicious** by touching it with your fingertip, or by pointing and pinching. Marked parts get a red outline. Touch them again to unmark them.
3. **Press a stamp:** the red **SCAM** stamp or the green **SAFE** stamp.
4. **Learn:** the panel shows whether you were right, the red flags you found (✓) and missed (○), and one safety tip to remember.

### Daily cases

- Each day brings a case of **8 messages: 5 scams and 3 real ones**.
- Everyone gets the same case on the same day.
- The real messages teach you to stay alert without being afraid of every message.
- Your very first case starts with an easy tutorial message.

### Scoring and progress

- **+100** for the right verdict
- **+25** for each real red flag you marked
- **−10** for each part you marked that was actually fine
- **−10** for each hint you use

Keep a **daily streak** and climb the detective ranks: **Rookie → Junior Detective → Detective → Inspector → Cyber Chief**. Training mode gives you unlimited extra messages.

## Scams you'll learn to spot

These are some of the most common scams in India today:

- fake KYC and bank alerts
- UPI "collect requests" and QR code "refund" tricks
- "digital arrest" calls from fake officers
- task-job scams ("earn ₹5,000 a day liking videos")
- fake parcel and redelivery fees
- electricity disconnection threats
- fake prizes, tax refunds and instant loan apps
- SIM-swap OTP theft
- fake virus pop-ups
- "Hi Mom, this is my new number" messages
- look-alike website and email addresses

At the end of every case, the game reminds players where to report real scams in India: **cybercrime.gov.in** and the **1930** helpline.

## Accessibility

- **Read aloud** reads the message, then the explanation.
- **Big text** mode makes the message card larger.
- Playable with **one hand, seated**, with **no time pressure**.
- Verdicts use words and outline styles, not just colour.
- **Lower / Raise / Center** buttons move the desk to a comfortable height.

## Ways to play

| Where | How |
|---|---|
| **Meta Quest** (best) | Open the link in the Meta Quest Browser and tap **Play in mixed reality** (your real room) or **Play in VR**. Put the controllers down and use your hands. |
| **Computer** | Open the link and click **Play on this screen**. Click to mark clues and press stamps. Drag to look around. |
| **Computer + emulator** | Install Meta's **Immersive Web Emulator** for Chrome to try the headset version without a headset. |

## How it's built

- **WebXR**, plain **JavaScript** and **WebGL**, written from scratch with no game engine or libraries. The whole game is one ~95 KB web page.
- **Hand tracking:** fingertip touch for clues and stamps, plus the Quest's pinch-ray for pointing from a distance.
- **Message cards** are drawn live onto a canvas. A small text-layout engine records exactly where each clue sits, so taps land on the right words.
- **Sound** is generated in code (rain, paper, the stamp "thunk", chimes) and placed in 3D space. Read-aloud uses the browser's speech synthesis.
- **Progress** is saved in your browser, so you can pause and pick up where you left off.

### Project structure

```
src/cases.js    all 25 messages, clue explanations, daily case picker, scoring, ranks
src/game.js     desk scene, message cards, stamps, hand/controller/mouse input, WebXR
src/sound.js    generated sound effects and rain ambience
src/gl.js       small WebGL renderer
src/math.js     matrix and vector helpers
src/index.html  start screen
build.js        combines everything into dist/index.html
tests/          content checks, browser playthrough, simulated-headset test
```

### Build and test

```bash
node build.js                 # creates dist/index.html
node tests/cases.test.js      # checks every message and 400 days of daily cases
python3 tests/play.py         # plays a full case in a browser (needs Playwright)
python3 tests/xr.py           # tests hand touch and pinch with a simulated headset
```

## What's next

- More languages (Hindi, Tamil, Bengali and more)
- A family mode with slower pacing and voice guidance for older players
- Voice-call scam scenarios
- Sharing your daily score with friends and family
