# Scam Detective

**Search the crime scene, connect the evidence, interrogate the suspect, all with your hands.**

Scam Detective is a mixed reality detective game for Meta Quest. You solve cyber crimes and real-world cases, and along the way you learn to spot the scams people face every day. It runs in the Meta Quest Browser, with nothing to install, and you can play it in **English or Hindi (हिन्दी)**.

▶ **Play it:** https://devanshi1602.github.io/scam-detective/

Built for the Meta VR Start Developer Competition 2026 (Gaming track).

> All people, brands, phone numbers, links and places in the game are made up. They teach the patterns real scams use without copying any real company.

---

## Why this game?

Almost everyone receives messages like *"Your bank account will be BLOCKED today, update KYC now"*. Scammers only need one person to tap at the wrong moment, and that person is often a parent or grandparent. Posters and lists of rules are easy to forget. Scam Detective lets you practise spotting the clues, so you recognise them when a real scam arrives.

## Detective HQ

The game opens at **Detective HQ**, where you pick what to play:

| Mode | What you do |
|---|---|
| **Investigations** | Full cases in four stages: crime scene → evidence room → line-up → interrogation |
| **Cyber case files** | Five quick story cases about common scams |
| **Daily case** | Eight messages a day: spot the scams, keep your streak |
| **Training** | Unlimited extra messages |

Your rank, streak, points and badges are shown on the HQ card. The **☀ / ☾** button switches between the bright daytime look (the default) and a darker night look. The **A / अ** button switches the whole game between English and Hindi.

## Investigations

Each investigation has four stages, plus a final report:

1. **🔍 Crime scene.** Every case has its own crime scene: a living room, a bride's room decorated for the wedding, a paint shop, an abandoned job agency, a retired man's book-lined study and a home kitchen. The victim's things are on the table: a phone, a laptop, letters, receipts, a notebook and more. Touch an object to inspect it, or **pinch to pick it up** and bring it closer. Then **swipe your fingertip across the document like a highlighter** over anything that could be evidence. Some details are real evidence and others are dead ends. Tiny clues need the **magnifying glass**, and locked phones need a PIN you'll find written somewhere else in the room.
2. **🧩 Case puzzle.** Every case has its own puzzle on the big board: rebuild a timeline, fit a torn betting slip back together, match handwriting, or follow the money through mule accounts.
   **📌 Evidence room.** Your evidence is pinned to a corkboard. For each question ("Which lead takes the police to a real person?"), **grab the loose red string** hanging from the question and **pull it to the evidence** that answers it. It snaps tight with a twang.
3. **🧍 Line-up.** Three life-size suspects stand behind the glass holding numbered placards. Point at someone and they step forward while the others turn to look at them. Pick the one your evidence identifies. Pick the wrong person and they explain their alibi.
4. **🪑 Interrogation.** Your evidence cards lie on the table in front of you. The suspect speaks each statement aloud. If it's a lie, **pick up the card that proves it and slam it down** in front of them. If it's true, slam the green **"I believe you"** card. Catch every lie and they confess.

   Every interrogation starts by **reading the person in the chair**: go *calm* or *tough*. Some people open up when you're gentle; others only talk under pressure. Each case then uses a different style:
   - **Classic** (case 1): the suspect makes statements; prove or believe each one.
   - **You pick the questions** (cases 2, 4, 6): choose from three questions. Vague ones get dodged and cost points; sharp ones force a statement you can break. A pressure meter fills as lies are exposed.
   - **Two suspects, two rooms** (cases 3, 5): question an accomplice or witness first. Their true statements become blue **testimony cards** you can slam down to catch the main suspect contradicting them.
5. **📞 Report it.** Dial **1930** (cyber crime) or **112** (other crimes) on a phone keypad to close the case.

Tapping still works everywhere, so the game stays playable for anyone who finds the gestures hard.

Fewer mistakes earn more stars, and every solved case earns a badge.

| Investigation | Type | What happened |
|---|---|---|
| Operation Fake Uniform | Cyber crime | A "digital arrest" video call by a fake police inspector |
| The Missing Wedding Necklace | Theft | A gold necklace vanishes during a wedding sangeet |
| The Night the SIM Died | Cyber crime | A SIM-swap: the victim's number is stolen and his bank emptied |
| The Agency That Vanished | Fraud | A fake job agency collects fees from 42 students, then disappears |
| ★ The Courtroom on a Video Call | Cyber crime (based on a real case) | Fake "CBI officers" stage an online Supreme Court hearing |
| ★ The Call from "the Bank" | Cyber crime (based on a real case) | A fake bank caller gets an OTP and turns the money into gift vouchers |

Cases marked ★ are **based on real Indian cases** reported in the news. Names and amounts are changed, and the case ends with a short note on what really happened and where it was reported.

**Hands-on moments:** some victims' phones are locked, so you have to find the PIN written somewhere else in the room and type it on the phone's keypad. After the confession, you **report the crime** by dialling **1930** (cyber crime) or **112** (other crimes) on a keypad, the same numbers players should use in real life.

Each room has its own atmosphere: a living room with a ticking clock and street noise, a detective office with a night window, a line-up room with a height chart, and an interrogation room with a humming light and a recording camera.

## Look and feel

The rooms, props and textures are drawn live in code. The people and the interrogation room are real 3D scans of real people and places, not AI-generated pictures:

- **Realistic surfaces:** wood-plank floors and tables, plaster walls, tiled and concrete floors, desk felt, brushed metal and fabric, all generated as seamless textures when the game loads. Soft contact shadows sit under every object.
- **Rooms that feel lived in:** sunlight with drifting dust, a city skyline outside every window (lit windows at night), a turning ceiling fan, swaying curtains, a flickering TV, a ticking wall clock and steaming chai.
- **Real people:** every suspect, witness and victim is a photo-scanned 3D model of a real person (see Credits), shrunk to fit a Quest while keeping their faces sharp. They sway, breathe, turn to look at you and react when caught.
- **A real interrogation room:** a scanned room with a two-way mirror, pipes, a steel door and ceiling cameras surrounds the interrogation desk.
- **Fallback characters:** if a model can't load, a code-built character takes its place: sculpted faces (jaw, cheekbones, eye sockets, nose and lips) with painted skin, stubble and beards; real-looking eyes with irises, catch-lights and eyelids that blink; eyebrows that move with their mood; strand-textured hair; shaped bodies in kurtas, sarees, jackets and caps; hands with fingers that gesture while they talk; and eyes that follow you around the room (nervous suspects keep glancing away).
- **Big moments:** red and blue police lights and a siren when the suspect confesses, a gold medal that spins up out of the desk with confetti when you close a case, a red string that snaps tight with a twang on the evidence board, and ink splats when you stamp a message.
- **Your hands:** a glowing ring shows exactly where your fingertip will touch, every touch sends out a ripple, real evidence sparkles, and in VR your hands appear as soft outlines.
- **Detective HQ:** a wall map of India with a pin for every case you solve, a trophy shelf that fills with medals, and a camera that glides in over the office when you start.

## Quick cases: how to play

1. A message card appears on your desk: an SMS, email, chat, payment request or browser pop-up.
2. **Mark anything suspicious** by touching it with your fingertip, or by pointing and pinching. Marked parts get a red outline. Touch them again to unmark them.
3. **Press a stamp:** the red **SCAM** stamp or the green **SAFE** stamp.
4. **Learn:** the panel shows whether you were right, the red flags you found (✓) and missed (○), and one safety tip to remember.

### Daily cases

- Each day brings a case of **8 messages: 5 scams and 3 real ones**.
- Everyone gets the same case on the same day.
- The real messages teach you to stay alert without being afraid of every message.
- Your very first case starts with an easy tutorial message.

### Cyber case files

Five quick story cases, each solved like a real investigation:

1. **A client brings you a case.** For example, a grandson whose grandmother lost ₹24,999 to a "Diwali lucky draw".
2. **Examine the evidence** from the victim's phone, usually 3 messages, and stamp each one SCAM or SAFE. Some evidence is genuine, like the bank alert that shows the money leaving.
3. **Solve the case** on the case board: answer how the scam worked and what the victim should do next.
4. **Case closed:** read how the story ends and earn a badge.

| Case | Scam |
|---|---|
| The Grandmother's Prize | Fake lottery + UPI collect request |
| The Dream Job | Task-job scam with growing "deposits" |
| The Video-Call Arrest | "Digital arrest" by a fake officer |
| The Stolen Account | Fake login page + shared login code |
| The Flat That Never Was | Rental scam with a fake owner |

### Scoring and progress

- **+100** for the right verdict
- **+25** for each real red flag you marked
- **−10** for each part you marked that was actually fine
- **−10** for each hint you use

Keep a **daily streak**, collect **case badges**, and climb the detective ranks: **Rookie → Junior Detective → Detective → Inspector → Cyber Chief**. Training mode gives you unlimited extra messages.

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

- **Two languages:** everything (menus, messages, cases, suspects and the read-aloud voice) is available in English and Hindi.
- **Read aloud** reads the message, then the explanation. Suspects speak their lines in their own voice.
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

- **WebXR**, plain **JavaScript** and **WebGL**, written from scratch with no game engine or libraries. The whole game is one web page (about 9 MB, almost all of it the scanned people).
- **Hand tracking:** fingertip touch for clues and stamps, pinch to grab and carry objects, plus the Quest's pinch-ray for pointing from a distance.
- **Characters** are photo-scanned models, cut down from up to 500,000 triangles to about 25,000 with a custom converter (`tools/convert_model.py`) that keeps the texture seams stitched. They load onto the GPU only when a scene needs them.
- **Languages:** every piece of text goes through a small translation layer. Switching language swaps the menus, all case content and the speech voice at once.
- **Message cards** are drawn live onto a canvas. A small text-layout engine records exactly where each clue sits, so taps land on the right words.
- **Sound** is generated in code (rain, a ticking clock, fluorescent hum, paper, the stamp "thunk", chimes) and placed in 3D space. Read-aloud uses the browser's speech synthesis.
- **Progress** is saved in your browser, so you can pause and pick up where you left off.

### Project structure

```
src/cases.js    25 daily messages, clue explanations, daily case picker, scoring, ranks
src/stories.js  5 cyber case files: clients, evidence, questions, endings, badges
src/investigations.js  6 full investigations: crime-scene objects, evidence, board questions, suspects
src/scenes.js   six different crime scenes, one per investigation
src/puzzles.js  case puzzles: timeline, torn paper, follow the money, handwriting match
src/investigate.js     Detective HQ menu, rooms, crime scene, evidence board, line-up, interrogation
src/people.js   life-size characters: bodies, outfits, moods, talking, reactions
src/models.js   loads the scanned people and room onto the GPU when needed
src/characters.js  the scanned models, packed by tools/convert_model.py
src/faces.js    sculpted head, hair and torso meshes plus painted skin textures, all generated in code
src/interact.js hands-on gestures: highlighter swipe, pulling the red string, slamming evidence cards
src/i18n.js     translation layer (switches menus, content and voice together)
src/lang/       Hindi language pack: interface, messages, case files, investigations
src/game.js     desk scene, message cards, stamps, hand/controller/mouse input, WebXR
src/sound.js    generated sound effects and room ambience (rain, clock, hum, siren, twang)
src/textures.js realistic surface materials and soft shadows, generated in code
src/gl.js       small WebGL renderer
src/math.js     matrix and vector helpers
src/index.html  start screen
build.js        combines everything into dist/index.html
tools/          GLB inspector and model converter
tests/          content checks, browser playthrough, simulated-headset test
```

### Build and test

```bash
node build.js                 # creates dist/index.html
node tests/cases.test.js      # checks every message and 400 days of daily cases
node tests/stories.test.js    # checks all cyber case files
node tests/investigations.test.js  # checks every investigation can be solved
node tests/lang.test.js       # checks the Hindi pack matches the English content exactly
python3 tests/inv_play.py     # plays all six investigations in a browser (LANG_HI=1 for Hindi)
python3 tests/lang_play.py    # walks through every screen in Hindi and reports leftover English
python3 tests/theme_shots.py  # screenshots every room in the bright and night looks
python3 tests/story_play.py   # plays a full detective case in a browser
python3 tests/play.py         # plays a full case in a browser (needs Playwright)
python3 tests/xr.py           # tests hand touch and pinch with a simulated headset
```

## Credits

3D models, used under Creative Commons Attribution (CC BY 4.0):

- “Casual Denim Look” and “Casual Confidence” by restore50, Sketchfab
- “Interrogation room” by local.yany, Sketchfab
- “Casual Beige Knit Look”, “Man Wearing Black T-Shirt with Bird Graphic”, “Casual Confidence”, “Casual Chic in Pink”, “Mustard Floral Sundress”, “Casual Studio Portrait with Keys”, “Casual White Tee Portrait”, “M-04” and “M-06”, Sketchfab scans

The full list, with links, is under **3D model credits** on the start screen.

## What's next

- More languages (Tamil, Bengali, Marathi and more)
- A family mode with slower pacing and voice guidance for older players
- Voice-call scam scenarios
- Sharing your daily score with friends and family
