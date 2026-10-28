/* Scam Detective — full investigations: crime scene → evidence room → interrogation.
 * Items on the crime-scene table use [[text|key]] clue markup; a clue with `ev` is real evidence,
 * any other clue is a dead end. All people, brands, numbers and places are fictional. */
(function (root) {
  'use strict';
  var INVESTIGATIONS = [
    {
      id: 'inv1', scene: 'drawing', title: 'Operation Fake Uniform', type: 'Cyber crime', place: 'Lata Deshpande’s living room',
      client: 'Meera Deshpande', role: 'Daughter of Lata Deshpande, 66', initial: 'M', lost: '₹3,80,000',
      brief: 'My mother spent three hours on a video call with a "police inspector". He said she was under arrest and made her send her savings. Please find out who did this.',
      evidence: {
        E1: { title: '"Digital arrest" chat', text: 'Orders to stay on camera, tell no one and obey.' },
        E2: { title: 'Fake arrest warrant', text: 'Spelling mistakes and impossible signatures.' },
        E3: { title: 'Caller’s number', text: 'The video call came from +91 99012 33871.' },
        E4: { title: 'Bank transfer slip', text: '₹3,80,000 sent to A/c 50200077345 (R. Verma).' },
        E5: { title: 'Screen-sharing app', text: 'She was told to install "QuickAssist".' },
        E6: { title: 'Costume in the background', text: 'A police costume on a hanger behind the caller.' }
      },
      items: [
        { id: 'laptop', name: 'Laptop', kind: 'laptop', slot: 0, app: 'Video call ended', time: '1:16 pm',
          body: '[[Call with +91 99012 33871|caller]] · [[Duration 3:12:40|duration]] · [[Background: a "Mumbai Police" poster|bg]] · [[Wi-Fi: Deshpande_Home|wifi]] · [[In the screen’s reflection: a police costume on a hanger|h_costume]]',
          clues: { caller: { ev: 'E3', note: 'The caller’s number. Police can trace who uses it.' },
            duration: { note: 'A long call keeps victims scared, but it doesn’t show who did it.' },
            bg: { note: 'A poster is easy to fake. It doesn’t identify anyone.' },
            wifi: { note: 'Just her home Wi-Fi name.' },
            h_costume: { ev: 'E6', note: 'A costume hangs behind the "inspector". Real officers don’t rent uniforms.' } } },
        { id: 'phone', name: 'Lata’s phone', kind: 'phone', slot: 1, lock: '1608', app: 'Chat', from: 'Inspector R. Khanna (Cyber Cell)', time: '10:04 am',
          body: '[[Good morning, madam.|greet]] You are under [[DIGITAL ARREST|arrest]]. [[Stay on the video call and tell nobody, not even your daughter|secret]]. [[I am calling from the Mumbai office|office]].',
          clues: { greet: { note: 'A polite greeting proves nothing.' },
            arrest: { ev: 'E1', note: '"Digital arrest" doesn’t exist. Police never arrest anyone over a video call.' },
            secret: { ev: 'E1', note: 'Cutting her off from family is a classic scam move.' },
            office: { note: 'Anyone can claim to be calling from anywhere.' } } },
        { id: 'warrant', name: 'Printed "arrest warrant"', kind: 'letter', slot: 2, app: 'Document', subject: 'SUPREME COURT OF INDIA',
          body: '[[ARREST WARANT|typo]] for money laundering. [[Signed jointly by CBI, RBI and the Supreme Court|sign]]. [[Printed on plain A4 paper|paper]]. [[Case no. ML/4471/2026|caseno]].',
          clues: { typo: { ev: 'E2', note: '"WARANT": a spelling mistake no court document would have.' },
            sign: { ev: 'E2', note: 'Unrelated agencies never sign one warrant together.' },
            paper: { note: 'Ordinary paper. That alone proves nothing.' },
            caseno: { note: 'Anyone can invent a case number.' } } },
        { id: 'slip', name: 'Bank transfer slip', kind: 'receipt', slot: 3, app: 'Kestrel Bank',
          body: 'RTGS transfer of [[₹3,80,000|amount]] to [[A/c 50200077345, holder R. Verma|benef]] on [[21 Oct, 1:47 pm|time]]. [[Branch: Shivaji Nagar|branch]].',
          clues: { amount: { note: 'How much she lost, but not who took it.' },
            benef: { ev: 'E4', note: 'The account that received the money leads to a real person.' },
            time: { note: 'Useful timing, but not a lead by itself.' },
            branch: { note: 'Just her own bank branch.' } } },
        { id: 'notebook', name: 'Lata’s notebook', kind: 'notebook', slot: 4, app: 'Handwritten notes',
          body: '[[Buy milk and bread|milk]]. [[Install "QuickAssist" app (Inspector said so)|app]]. [[Doctor on Friday, 5 pm|doctor]]. [[Phone PIN: 1608 (Meera’s birthday)|pin]]',
          clues: { milk: { note: 'Just a shopping list.' },
            pin: { note: 'Her phone PIN. Not evidence, but now you can unlock her phone!' },
            app: { ev: 'E5', note: 'A screen-sharing app lets scammers watch her phone and read OTPs.' },
            doctor: { note: 'Nothing to do with the case.' } } },
        { id: 'cup', name: 'Cup of tea', kind: 'cup', slot: 5, app: 'Close look',
          body: '[[Cold tea, half finished|tea]].',
          clues: { tea: { note: 'She forgot her tea during the long call. Sad, but not evidence.' } } }
      ],
      puzzle: { type: 'timeline', title: 'Rebuild the 3-hour call', intro: 'Lata ji’s call log and chats are jumbled. Put the events in order to see how the "inspector" took control.',
        pieces: ['10:02 am · A "cyber cell inspector" video-calls her', '10:15 am · He says she is under "digital arrest"', '10:40 am · A fake arrest warrant appears on screen', '11:30 am · She installs a screen-sharing app', '12:55 pm · ₹3,80,000 leaves her account'],
        lesson: 'Fear first, then control, then the money. Real police never arrest anyone over a video call.' },
      board: [
        { q: 'How did the scammers control Lata ji for three hours?', answer: 'E1', why: 'A fake "digital arrest" and orders to tell no one left her too scared to ask for help.' },
        { q: 'Which evidence proves the documents were fake?', answer: 'E2', why: 'Spelling mistakes and impossible joint signatures show the warrant was forged.' },
        { q: 'Which lead takes the police to a real person?', answer: 'E4', why: 'Bank accounts are linked to real identities, so the receiving account leads to its holder.' }
      ],
      people: {
        rahul: { name: 'Rahul Verma', role: 'Student, holder of A/c 50200077345', look: { model: 'whitetee', height: 1.72, shirt: [0.86, 0.55, 0.2], pants: [0.2, 0.25, 0.4], skin: [0.7, 0.52, 0.4], hair: [0.07, 0.06, 0.05], style: 'short', glasses: true, voice: 1.1 } },
        vikas: { name: 'Vikas Rao', role: 'Phone +91 99012 33871 seized', look: { model: 'blacktee', height: 1.76, shirt: [0.22, 0.3, 0.52], pants: [0.15, 0.15, 0.17], skin: [0.62, 0.44, 0.32], hair: [0.08, 0.07, 0.07], style: 'short', moustache: true, outfit: 'jacket', jacket: [0.16, 0.17, 0.2], voice: 0.8 } },
        sunil: { name: 'Sunil Joshi', role: 'Neighbour who fixed her Wi-Fi', look: { model: 'elder_cap', height: 1.68, shirt: [0.42, 0.56, 0.42], pants: [0.3, 0.27, 0.22], skin: [0.68, 0.5, 0.38], hair: [0.72, 0.72, 0.74], style: 'short', glasses: true, moustache: true, cap: [0.25, 0.3, 0.22], voice: 0.72 } }
      },
      lineup: {
        q: 'Who made the fake "police" video call?', ids: ['rahul', 'vikas', 'sunil'], culprit: 'vikas',
        alibis: {
          rahul: { say: 'I only rented my bank account to a man for ₹5,000. I never called anyone!', why: 'Renting out your account is a crime too, but the video call came from a different number.' },
          sunil: { say: 'I fixed her Wi-Fi last month. On the 21st I was at my office all day.', why: 'Nothing links Sunil to the call or the money.' }
        },
        caught: 'Why me? I’ve never even seen this lady!',
        why: 'The video call came from +91 99012 33871: the phone seized from Vikas.'
      },
      suspect: {
        id: 'vikas', style: 'classic',
        intro: 'Police traced the caller’s number to Vikas Rao. A police uniform costume was found in his bag.',
        tone: { prefers: 'tough', mood: 'Vikas leans back with his arms crossed, smirking. He thinks he can out-talk you.',
          calm: 'Ha! Sweet talk won’t work on me. I do this for a living, you know.',
          tough: 'Okay, okay! No need to bang the table. Ask your questions.' },
        statements: [
          { say: 'I am a real cyber cell inspector. I was only doing my job.', truth: false, contradict: ['E1', 'E2', 'E6'], why: 'Real police don’t do "digital arrests" or forge warrants with spelling mistakes.' },
          { say: 'That phone number has never been mine.', truth: false, contradict: ['E3'], why: 'The video call came from the exact number found on his phone.' },
          { say: 'I have never met Lata ji in person.', truth: true, why: 'True. Scammers almost never meet their victims face to face.' },
          { say: 'I never touched her phone or her bank app.', truth: false, contradict: ['E5'], why: 'He made her install a screen-sharing app so he could watch her phone and OTPs.' }
        ],
        confession: 'Okay, okay! I wore a costume on video calls and read from a script. My partners rented bank accounts from people like R. Verma. I’m sorry.'
      },
      ending: 'Police froze account 50200077345 and arrested the gang. Because Meera reported it quickly on 1930, part of the money was recovered.',
      badge: 'Uniform Unmasker', report: '1930'
    },
    {
      id: 'inv2', scene: 'bridal', title: 'The Missing Wedding Necklace', type: 'Theft', place: 'the bride’s room, Kapoor house',
      client: 'Simran Kapoor', role: 'Bride, getting married tomorrow', initial: 'S', lost: 'Grandmother’s gold necklace',
      brief: 'During my sangeet last night, my grandmother’s gold necklace vanished from my room. The door wasn’t broken. Guests upstairs: my cousin Rohit (in a grey T-shirt), photographer Aman and decorator Farah.',
      evidence: {
        E1: { title: 'Unforced lock', text: 'The box was opened with a key, not broken.' },
        E2: { title: 'Spare key log', text: 'Rohit had the spare key, 9:40 to 10:05 pm.' },
        E3: { title: 'CCTV still', text: 'A man in a grey T-shirt entered at 9:52 pm.' },
        E4: { title: 'Gold buyer’s receipt', text: '"1 gold necklace from R. Kapoor", next morning.' },
        E5: { title: 'Debt message', text: 'Rohit owes ₹1,50,000 in cricket bets.' },
        E6: { title: 'Seller’s phone number', text: 'The seller’s phone ends in 4417, like Rohit’s.' }
      },
      items: [
        { id: 'jewelbox', name: 'Jewellery box', kind: 'jewelbox', slot: 0, app: 'Close look',
          body: '[[Lock undamaged: opened with a key|lock]]. [[Red velvet lining|velvet]]. [[Empty space where the necklace was|empty]]. [[Earrings still inside|earrings]].',
          clues: { lock: { ev: 'E1', note: 'No break-in. Whoever did it had a key.' },
            velvet: { note: 'Just the box lining.' },
            empty: { note: 'We already know the necklace is missing.' },
            earrings: { note: 'Odd that they were left, but they don’t point to anyone.' } } },
        { id: 'register', name: 'Spare key register', kind: 'clipboard', slot: 1, app: 'Key register',
          body: '[[Bride’s room spare key|keyname]]: taken by [[Rohit at 9:40 pm, returned 10:05 pm|rohit]]. [[Store room key: Farah, 6:00 pm|farah]].',
          clues: { keyname: { note: 'Tells us which key, not who used it.' },
            rohit: { ev: 'E2', note: 'Rohit had the spare key exactly while the room was empty.' },
            farah: { note: 'Farah took a different key, hours earlier.' } } },
        { id: 'cctv', name: 'CCTV printout', kind: 'printout', slot: 2, app: 'Hallway camera',
          body: '[[9:52 pm: a man in a grey T-shirt enters the bride’s room|blue]]. [[10:30 pm: photographer Aman in the garden|aman]]. [[11:00 pm: lights off|lights]].',
          clues: { blue: { ev: 'E3', note: 'Rohit wore a grey T-shirt that night.' },
            aman: { note: 'This clears Aman: he was outside.' },
            lights: { note: 'The normal end of the party.' } } },
        { id: 'receipt', name: 'Torn receipt (dustbin)', kind: 'receipt', slot: 3, app: 'Shree Gold Buyers',
          body: '[[Received 1 gold necklace from R. Kapoor|necklace]]. [[Cash paid: ₹1,60,000|cash]]. [[22 Oct, 11:15 am|date]]. [[Thank you, visit again!|thanks]] [[Seller’s mobile, in tiny print: ******4417|h_phone]]',
          clues: { necklace: { ev: 'E4', note: 'Someone named R. Kapoor sold a gold necklace the next morning.' },
            cash: { note: 'The price, but not who sold it.' },
            date: { note: 'The morning after the sangeet: useful timing, not proof alone.' },
            thanks: { note: 'Printed on every receipt.' },
            h_phone: { ev: 'E6', note: 'The seller’s mobile number ends in 4417.' } } },
        { id: 'phone', name: 'Phone left charging (Rohit’s)', kind: 'phone', slot: 4, app: 'Chat', from: 'Bunty (cricket group)', time: '8:12 pm',
          body: '[[Bhai, pay the ₹1,50,000 you lost on bets by Friday|debt]]. [[Match tomorrow at 7:30?|match]] [[Ha ha|haha]] [[Phone owner: Rohit, number ending 4417|owner]]',
          clues: { debt: { ev: 'E5', note: 'A big debt: a motive to steal.' },
            match: { note: 'Just cricket plans.' },
            haha: { note: 'Nothing here.' },
            owner: { note: 'Useful to know: this is Rohit’s phone, number ending 4417.' } } },
        { id: 'cone', name: 'Mehndi cone', kind: 'cone', slot: 5, app: 'Close look',
          body: '[[Still a little wet|wet]].',
          clues: { wet: { note: 'Left over from the mehndi. Not evidence.' } } }
      ],
      puzzle: { type: 'torn', title: 'Piece together the torn slip', intro: 'Someone tore up a slip and threw it in the bin outside the bride’s room. Fit the strips back together, top to bottom. Two strips are from other papers.',
        pieces: ['CRICKET BETTING SLIP', 'Name: Rohit K.', 'Owed: ₹1,50,000', 'Pay by Sunday. No excuses.'],
        decoys: ['Sangeet menu: paneer tikka, jalebi', 'Simran weds Kabir · 14 Nov'],
        lesson: 'A big debt and a deadline: a strong motive. Motive alone isn’t proof, but it tells you where to look.' },
      board: [
        { q: 'Which clue shows the thief didn’t break in?', answer: 'E1', why: 'The lock was opened with a key, so it was someone in the house with access.' },
        { q: 'Which clue shows a motive?', answer: 'E5', why: 'Rohit owed ₹1,50,000 in bets: a strong reason to need money fast.' },
        { q: 'Which clue shows what happened to the necklace?', answer: 'E4', why: 'A gold buyer received a necklace from "R. Kapoor" the very next morning.' }
      ],
      people: {
        aman: { name: 'Aman Bedi', role: 'Wedding photographer', look: { model: 'beige', height: 1.75, shirt: [0.14, 0.14, 0.16], pants: [0.12, 0.12, 0.14], skin: [0.72, 0.53, 0.4], hair: [0.06, 0.05, 0.05], style: 'short', glasses: true, beard: true, voice: 0.78 } },
        farah: { name: 'Farah Khan', role: 'Wedding decorator', look: { model: 'pink', height: 1.62, shirt: [0.75, 0.24, 0.44], pants: [0.75, 0.24, 0.44], skin: [0.76, 0.58, 0.46], hair: [0.1, 0.07, 0.06], style: 'long', scarf: [0.96, 0.8, 0.3], female: true, bindi: true, outfit: 'kurta', voice: 1.3 } },
        rohit: { name: 'Rohit Kapoor', role: 'Bride’s cousin, 27', look: { model: 'greytee', height: 1.78, shirt: [0.2, 0.36, 0.78], pants: [0.92, 0.9, 0.84], skin: [0.74, 0.55, 0.42], hair: [0.12, 0.09, 0.07], style: 'short', beard: true, outfit: 'kurta', voice: 0.86 } }
      },
      lineup: {
        q: 'Who stole the necklace?', ids: ['aman', 'farah', 'rohit'], culprit: 'rohit',
        alibis: {
          aman: { say: 'I was in the garden taking photos all night. Check my camera!', why: 'CCTV shows Aman in the garden, and he never had a key to the room.' },
          farah: { say: 'I only took the store-room key at 6 pm, for the flowers.', why: 'Farah’s key was for a different room, hours earlier.' }
        },
        caught: 'Me? I was dancing all night, ask anyone!',
        why: 'Rohit had the spare key, matches the CCTV, owes money, and the necklace was sold by "R. Kapoor".'
      },
      suspect: {
        id: 'rohit', style: 'questions',
        intro: 'The clues point to Simran’s cousin Rohit. You choose the questions: sharp ones make him commit to a story you can break.',
        tone: { prefers: 'calm', mood: 'Rohit stares at his hands. His eyes are red, and he flinches every time the door opens.',
          calm: 'Thank you… I haven’t slept since the sangeet. Okay. Ask me.',
          tough: 'You can’t shout at me! I want my uncle here. I’m not saying anything.' },
        statements: [
          { ask: 'Where were you between 9:40 and 10:05 pm?', say: 'I was dancing downstairs the whole evening.', truth: false, contradict: ['E2', 'E3'], why: 'He had the spare key from 9:40 to 10:05, and CCTV shows his grey T-shirt entering the room.',
            alts: [{ q: 'Did you enjoy the sangeet?', a: 'It was beautiful. Everyone danced. Why does that matter?' }, { q: 'What colour was the bride’s lehenga?', a: 'Red and gold, I think. What does that have to do with anything?' }] },
          { ask: 'How close are you to Simran?', say: 'I love my cousin. Her wedding means everything to me.', truth: true, why: 'Probably true, and feelings aren’t evidence either way. Stick to the facts.',
            alts: [{ q: 'Do you like weddings?', a: 'Who doesn’t? Good food, good music.' }, { q: 'Are you married?', a: 'No. My mother asks me that every day.' }] },
          { ask: 'How are your finances these days?', say: 'I don’t owe anybody any money.', truth: false, contradict: ['E5'], why: 'His own phone shows a ₹1,50,000 betting debt.',
            alts: [{ q: 'What do you do for work?', a: 'I’m between jobs. Lots of people are.' }, { q: 'Do you have a car?', a: 'A scooter. Why?' }] },
          { ask: 'Where did you go the morning after the sangeet?', say: 'I have never been to Shree Gold Buyers.', truth: false, contradict: ['E4', 'E6'], why: 'The receipt says the necklace was sold by "R. Kapoor" the next morning.',
            alts: [{ q: 'Do you wear gold jewellery?', a: 'Just this chain. It was a gift.' }, { q: 'Who else had a key to the room?', a: 'How would I know? Ask the hotel.' }] }
        ],
        confession: 'I’m so sorry, Simran. I lost money betting on cricket and panicked. I sold the necklace, but I was going to buy it back before the wedding.'
      },
      ending: 'Police recovered the necklace from the gold buyer, and Simran wore it at her wedding. Rohit returned the money and is getting help for his betting problem.',
      badge: 'Golden Eye', report: '112'
    },
    {
      id: 'inv3', scene: 'shop', title: 'The Night the SIM Died', type: 'Cyber crime', place: 'Arjun Nair’s shop counter',
      client: 'Arjun Nair', role: 'Owner, Nair Hardware', initial: 'A', lost: '₹2,40,000',
      brief: 'Last night my phone suddenly showed "No service". By morning ₹2,40,000 was gone from my bank account. I never shared a single OTP! How did they do it?',
      evidence: {
        E1: { title: 'Fake "5G upgrade" SMS', text: 'He replied "1" to a SIM upgrade message.' },
        E2: { title: 'Leaked ID copies', text: 'He sent Aadhaar and PAN photos to a "KYC" caller.' },
        E3: { title: 'Signal lost at 9:58 pm', text: 'His SIM died: the number moved to a new SIM.' },
        E4: { title: 'Wallet that got the money', text: '₹2,40,000 sent to pr.cash@kpay.' },
        E5: { title: 'Duplicate SIM form', text: 'Arjun’s ID, but the photo is of a woman.' },
        E6: { title: 'Signature on the form', text: 'Signed in tiny letters: "P. Rane".' }
      },
      items: [
        { id: 'laptop', name: 'Shop laptop', kind: 'laptop', slot: 0, app: 'Bank email alerts', time: '10:21 pm',
          body: '[[New device registered for mobile banking|device]] · [[OTP sent to your registered mobile|otp]] · [[₹2,40,000 sent to pr.cash@kpay|upi]] · [[Kestrel Bank logo|logo]]',
          clues: { device: { note: 'The thief used a new phone, but that alone doesn’t name anyone.' },
            otp: { note: 'The OTP went to his number, which the thief now controlled. A how, not a who.' },
            upi: { ev: 'E4', note: 'Wallets are linked to real people. Follow the money!' },
            logo: { note: 'Just the bank’s logo.' } } },
        { id: 'phone', name: 'Arjun’s phone', kind: 'phone', slot: 1, app: 'Messages', from: 'TELCO-INFO', time: '9:41 pm',
          body: '[[Your SIM will be upgraded to 5G FREE. Reply 1 to confirm|upgrade]]. [[No service since 9:58 pm|nosvc]]. [[Battery 64%|battery]].',
          clues: { upgrade: { ev: 'E1', note: 'Replying "1" helped the thief confirm the SIM swap. Real upgrades never work this way.' },
            nosvc: { ev: 'E3', note: '"No service" out of nowhere: his number had moved to someone else’s SIM.' },
            battery: { note: 'The battery was fine. Not a clue.' } } },
        { id: 'form', name: 'Photocopy of a SIM form', kind: 'letter', slot: 2, app: 'Photocopy', subject: 'DUPLICATE SIM REQUEST',
          body: '[[Reason: "phone lost"|reason]]. [[ID attached: Arjun Nair’s Aadhaar, but the photo shows a woman|photo]]. [[Store: Sai Mobile Point|store]]. [[Signed in tiny letters: P. Rane|h_sign]]',
          clues: { reason: { note: 'The usual excuse for getting a new SIM.' },
            photo: { ev: 'E5', note: 'Someone used Arjun’s ID with their own photo to get his number.' },
            store: { note: 'Just the shop where the SIM was issued.' },
            h_sign: { ev: 'E6', note: 'The person who filled in the form signed it "P. Rane".' } } },
        { id: 'receipt', name: 'SIM store receipt', kind: 'receipt', slot: 3, app: 'Sai Mobile Point',
          body: '[[Duplicate SIM fee: ₹50|fee]]. [[Issued 9:50 pm, 21 Oct|time]]. [[Paid in cash|cash]].',
          clues: { fee: { note: 'A tiny fee for a very costly crime. Not a lead.' },
            time: { note: 'Eight minutes before his phone died. It fits, but names no one.' },
            cash: { note: 'Cash leaves no trail. Look elsewhere.' } } },
        { id: 'notebook', name: 'Arjun’s notebook', kind: 'notebook', slot: 4, app: 'Handwritten notes',
          body: '[[Pay electricity bill|bill]]. [[18 Oct: "KYC officer Priya" called. Sent her Aadhaar + PAN photos on WhatsApp|kyc]]. [[Order more paint|paint]].',
          clues: { bill: { note: 'Just a reminder.' },
            kyc: { ev: 'E2', note: 'Real KYC never happens over WhatsApp. This is how his ID leaked.' },
            paint: { note: 'Shop stock. Nothing here.' } } },
        { id: 'cup', name: 'Coffee mug', kind: 'cup', slot: 5, app: 'Close look',
          body: '[["World’s Best Papa" mug, empty|mug]].',
          clues: { mug: { note: 'A gift from his kids. Not evidence.' } } }
      ],
      puzzle: { type: 'timeline', title: 'How the SIM swap happened', intro: 'Put Arjun’s week in order to see how his phone number was stolen.',
        pieces: ['18 Oct · "KYC officer Priya" collects his ID on WhatsApp', '21 Oct, 9:41 pm · SMS: "Reply 1 for free 5G"', '9:50 pm · A duplicate SIM is issued at Sai Mobile Point', '9:58 pm · Arjun’s phone shows "No service"', '10:21 pm · ₹2,40,000 goes to pr.cash@kpay'],
        lesson: 'If your phone suddenly loses signal for no reason, call your bank at once. Your SIM may have been swapped.' },
      board: [
        { q: 'How did the thief take over Arjun’s phone number?', answer: 'E5', why: 'A duplicate SIM was issued using his ID with someone else’s photo.' },
        { q: 'Where did the thief get Arjun’s ID?', answer: 'E2', why: 'He sent his Aadhaar and PAN to a fake "KYC officer" on WhatsApp.' },
        { q: 'Which lead follows the money?', answer: 'E4', why: 'The money went to the wallet pr.cash@kpay, which is registered to a real person.' }
      ],
      people: {
        manoj: { name: 'Manoj Kulkarni', role: 'Owner, Sai Mobile Point', look: { model: 'elder_suit', height: 1.72, shirt: [0.85, 0.82, 0.7], pants: [0.25, 0.22, 0.2], skin: [0.66, 0.48, 0.36], hair: [0.3, 0.3, 0.3], style: 'bald', moustache: true, outfit: 'kurta', voice: 0.75 } },
        pooja: { name: 'Pooja Rane', role: 'Owner of wallet pr.cash@kpay', look: { model: 'sundress', height: 1.62, shirt: [0.5, 0.28, 0.55], pants: [0.18, 0.18, 0.22], skin: [0.72, 0.54, 0.42], hair: [0.08, 0.06, 0.05], style: 'bun', female: true, bindi: true, outfit: 'saree', saree: [0.55, 0.15, 0.4], border: [0.95, 0.75, 0.3], voice: 1.25 } },
        ankit: { name: 'Ankit Nair', role: 'Arjun’s nephew, uses the shop laptop', look: { model: 'blacktee', height: 1.73, shirt: [0.9, 0.45, 0.3], pants: [0.25, 0.3, 0.45], skin: [0.66, 0.48, 0.36], hair: [0.06, 0.05, 0.05], style: 'short', voice: 1.12 } }
      },
      lineup: {
        q: 'Who stole Arjun’s phone number?', ids: ['manoj', 'pooja', 'ankit'], culprit: 'pooja',
        alibis: {
          manoj: { say: 'I just sell SIM cards! The form had an Aadhaar card, so I issued the SIM.', why: 'Careless, but the photo on the form is a woman, and none of the money reached him.' },
          ankit: { say: 'I was in my hostel in Pune all week. I only play games on that laptop.', why: 'Nothing links Ankit to the SIM form or the wallet.' }
        },
        caught: 'Me? I don’t even know anyone called Arjun!',
        why: 'Her photo is on the SIM form, it’s signed "P. Rane", and the money went to her wallet.'
      },
      suspect: {
        id: 'pooja', style: 'pair',
        intro: 'Now bring in Pooja Rane, whose wallet received the money. Manoj’s statements are on the table as cards: use them.',
        tone: { prefers: 'tough', mood: 'Pooja sits very straight and looks bored. "Is this going to take long? I have clients."',
          calm: 'Then we’re done here. I have clients waiting.',
          tough: 'Okay! Okay. You don’t have to shout. Ask.' },
        partner: {
          id: 'manoj', intro: 'Two people, two rooms. First question Manoj, who issued the duplicate SIM. He was cleared, but he saw who came in.',
          tone: { prefers: 'calm', mood: 'Manoj keeps wiping his forehead. He’s scared he’ll lose his shop licence.',
            calm: 'Thank you, sir. I want to help. I didn’t know she was a cheat.',
            tough: 'I… I want a lawyer. I only sell SIM cards!' },
          statements: [
            { say: 'Pooja Rane came to my shop at 9:50 pm on 21 October. My camera recorded her.', truth: true, tag: 'P1', short: 'Pooja was in my shop at 9:50 pm on 21 October.', why: 'True. His shop camera shows her, at the same time as the SIM receipt.' },
            { say: 'I always check the photo on the ID card.', truth: false, contradict: ['E5'], why: 'The form has Arjun’s Aadhaar with a woman’s photo on it, and he still issued the SIM.' },
            { say: 'She didn’t bring the Aadhaar card. She showed me photos of it on WhatsApp.', truth: true, tag: 'P2', short: 'She showed Arjun’s Aadhaar as photos on WhatsApp.', why: 'True. Those ID photos came from the fake "KYC" chat.' }
          ]
        },
        statements: [
          { say: 'I have never been inside Sai Mobile Point.', truth: false, contradict: ['E5', 'E6', 'P1'], why: 'Manoj’s camera saw her there, and the SIM form has her photo and signature.' },
          { say: 'I work from home as a beautician.', truth: true, why: 'True, she does. Her job isn’t evidence either way.' },
          { say: 'That kPay wallet isn’t mine.', truth: false, contradict: ['E4'], why: 'pr.cash@kpay is registered to her, and it received ₹2,40,000.' },
          { say: 'I have never asked anyone for their ID documents.', truth: false, contradict: ['E2', 'P2'], why: 'As "KYC officer Priya" she collected Arjun’s Aadhaar and PAN on WhatsApp, then showed those photos at the shop.' }
        ],
        confession: 'Fine! I called him pretending to do KYC. Then I used his Aadhaar with my photo to get a new SIM. With his number, every OTP came to me. I’m sorry.'
      },
      ending: 'Arjun reported it on 1930 and the wallet was frozen. Most of his money came back. Tip: if your phone suddenly shows "No service", call your bank at once.',
      badge: 'SIM Sentinel', report: '1930',
      real: { text: 'Ahmedabad’s cyber crime branch arrested a data analyst over a SIM-swap fraud of about ₹80 lakh. A swapped SIM lets criminals receive the victim’s OTPs.', source: 'Study Cafe' }
    },
    {
      id: 'inv4', scene: 'agency', title: 'The Agency That Vanished', type: 'Fraud', place: 'the empty office of "SkyHigh Careers"',
      client: 'Anjali Das', role: 'Graduate, 22', initial: 'A', lost: '₹45,000',
      brief: 'I paid ₹45,000 to SkyHigh Careers for a cabin crew job. Today their office is locked and empty, and 41 other students paid too. The police let us look inside.',
      evidence: {
        E1: { title: 'Pay-to-join demand', text: 'Pay ₹45,000 within 24 hours to "confirm".' },
        E2: { title: 'Fake offer letter', text: 'Misspelt airline name and a free Gmail ID.' },
        E3: { title: 'Planned to vanish', text: 'Office rented for 2 months, "vacate 20 Oct".' },
        E4: { title: 'Tenant: Nikhil Sethi', text: 'The rent agreement is in Nikhil Sethi’s name.' },
        E5: { title: 'Where the fees went', text: 'Fees paid into Sunrise Traders, A/c …8812.' },
        E6: { title: 'Sticky note', text: '"Sunrise A/c: N.S." in Nikhil’s handwriting.' }
      },
      items: [
        { id: 'laptop', name: 'Laptop left behind', kind: 'laptop', slot: 0, app: 'Spreadsheet: Candidates', time: '19 Oct',
          body: '[[42 names, ₹45,000 each|list]] · [[Calendar: "Vacate office, 20 Oct"|vacate]] · [[Wallpaper: an aeroplane|wall]] · [[Tiny sticky note on the screen edge: "Sunrise A/c: N.S."|h_note]]',
          clues: { list: { note: 'Shows how many were cheated, not who did it.' },
            vacate: { ev: 'E3', note: 'They planned to disappear right after collecting the fees.' },
            wall: { note: 'Just a picture.' },
            h_note: { ev: 'E6', note: 'Someone with the initials N.S. controlled the Sunrise account.' } } },
        { id: 'phone', name: 'Anjali’s phone', kind: 'phone', slot: 1, app: 'Chat', from: 'SkyHigh HR', time: '11:20 am',
          body: '[[Congratulations! You are selected without an interview|nointerview]]. [[Pay ₹45,000 today to confirm your seat|pay]]. [[Offer valid for 24 hours only|urgent]]. [[Office: 4th floor, Galaxy Plaza|addr]].',
          clues: { nointerview: { ev: 'E1', note: 'No real airline hires cabin crew without an interview.' },
            pay: { ev: 'E1', note: 'Real employers pay you. They never ask you to pay for a job.' },
            urgent: { ev: 'E1', note: 'A 24-hour deadline is pressure, so you pay before you think.' },
            addr: { note: 'We are already standing in this office.' } } },
        { id: 'offer', name: 'Offer letter', kind: 'letter', slot: 2, app: 'Document', subject: 'OFFER LETTER: CABIN CREW',
          body: '[[Airline name spelt "Indigo Air Lines"|name]]. [[HR email: skyhigh.hr.jobs@gmail.com|gmail]]. [[Joining date: 1 Nov|date]]. [[Signed: Director|signed]].',
          clues: { name: { ev: 'E2', note: 'A real airline never misspells its own name.' },
            gmail: { ev: 'E2', note: 'Real companies use their own email domain, not free Gmail.' },
            date: { note: 'A date that never came. Not a lead.' },
            signed: { note: 'No name, just "Director". It doesn’t identify anyone.' } } },
        { id: 'receipt', name: 'Fee receipt', kind: 'receipt', slot: 3, app: 'SkyHigh Careers',
          body: '[[Received ₹45,000 from Anjali Das|amt]]. [[Deposited to Sunrise Traders, A/c 30110088812|acct]]. [[Stamp: SkyHigh Careers|stamp]].',
          clues: { amt: { note: 'What Anjali lost, but not who took it.' },
            acct: { ev: 'E5', note: 'The fees went to a different company’s account. Follow it!' },
            stamp: { note: 'Anyone can order a rubber stamp.' } } },
        { id: 'rent', name: 'Rent agreement', kind: 'clipboard', slot: 4, app: 'Rent agreement',
          body: '[[Tenant: Nikhil Sethi, ID copy attached|tenant]]. [[Period: 2 months only|short]]. [[Rent: ₹30,000 a month|cost]].',
          clues: { tenant: { ev: 'E4', note: 'A real name with an ID copy: a solid lead.' },
            short: { ev: 'E3', note: 'Scam offices are rented for a short time so they can vanish.' },
            cost: { note: 'Normal rent for the area.' } } },
        { id: 'cup', name: 'Paper cups', kind: 'cup', slot: 5, app: 'Close look',
          body: '[[Stack of paper cups and a dusty kettle|cups]].',
          clues: { cups: { note: 'Tea for the visitors. Not evidence.' } } }
      ],
      puzzle: { type: 'match', title: 'Whose handwriting is it?', intro: 'The sticky note says "Sunrise A/c: N.S." Compare it with three samples found in the office. Look at the slant and the double underline.',
        sample: 'Sunrise A/c: N.S.', answer: 'nikhil',
        options: [{ id: 'ritu', name: 'Ritu Malhotra', from: 'Visitor register', text: 'Sunita, 2 pm, interview', hand: 0 },
          { id: 'nikhil', name: 'Nikhil Sethi', from: 'Note on the rent agreement', text: 'Sign here: Sethi', hand: 1 },
          { id: 'bhatia', name: 'Harish Bhatia', from: 'Rent receipt', text: 'Received: 2 months', hand: 2 }],
        lesson: 'Same slant, same double underline: Nikhil wrote the note that names the Sunrise account.' },
      board: [
        { q: 'Which clue shows the job was a trap?', answer: 'E1', why: 'Selected without an interview, then rushed to pay: real jobs never charge you to join.' },
        { q: 'Which clue shows SkyHigh never meant to stay?', answer: 'E3', why: 'The office was rented for two months, with a plan to vacate right after the fees came in.' },
        { q: 'Which lead follows the students’ money?', answer: 'E5', why: 'All fees went to Sunrise Traders’ bank account, which belongs to a real person.' }
      ],
      people: {
        ritu: { name: 'Ritu Malhotra', role: 'Receptionist at SkyHigh', look: { model: 'denim', height: 1.62, shirt: [0.3, 0.6, 0.62], pants: [0.2, 0.2, 0.25], skin: [0.78, 0.6, 0.48], hair: [0.12, 0.08, 0.06], style: 'long', glasses: true, female: true, outfit: 'jacket', jacket: [0.22, 0.24, 0.32], voice: 1.3 } },
        nikhil: { name: 'Nikhil Sethi', role: 'Tenant of the SkyHigh office', look: { model: 'beige', height: 1.77, shirt: [0.1, 0.1, 0.12], pants: [0.35, 0.3, 0.25], skin: [0.74, 0.56, 0.44], hair: [0.05, 0.04, 0.04], style: 'short', beard: true, outfit: 'jacket', jacket: [0.3, 0.22, 0.16], voice: 0.82 } },
        bhatia: { name: 'Harish Bhatia', role: 'Owner of Galaxy Plaza', look: { model: 'elder_cap', height: 1.7, shirt: [0.92, 0.92, 0.95], pants: [0.3, 0.3, 0.32], skin: [0.7, 0.52, 0.4], hair: [0.75, 0.75, 0.75], style: 'bald', glasses: true, moustache: true, outfit: 'kurta', voice: 0.7 } }
      },
      lineup: {
        q: 'Who ran the fake job agency?', ids: ['ritu', 'nikhil', 'bhatia'], culprit: 'nikhil',
        alibis: {
          ritu: { say: 'I answered an ad too! They paid me ₹12,000 a month to answer phones.', why: 'She was paid a salary, and the students’ fees never reached her.' },
          bhatia: { say: 'I only rented out the room. He paid two months in advance.', why: 'The landlord rented an office. Nothing links him to the fees.' }
        },
        caught: 'I’m just a businessman! Those students failed the airline’s test.',
        why: 'The office was rented in his name, and his own note ties him to the Sunrise Traders account.'
      },
      suspect: {
        id: 'nikhil', style: 'questions',
        intro: 'The rent agreement and the sticky note both point to Nikhil Sethi. You choose the questions: pin him down.',
        tone: { prefers: 'tough', mood: 'Nikhil checks his watch and straightens his collar. "I have a meeting at four."',
          calm: 'Look, I’m a busy man. If you’ve got nothing, I’m leaving.',
          tough: 'Alright, alright! No need to raise your voice. What do you want to know?' },
        statements: [
          { ask: 'Which airline sent these offer letters?', say: 'SkyHigh is a real placement agency with airline partners.', truth: false, contradict: ['E2'], why: 'Its offer letters misspell the airline and use a free Gmail ID.',
            alts: [{ q: 'How long have you been in business?', a: 'Long enough. We’re very successful.' }, { q: 'Why an office in Galaxy Plaza?', a: 'Good location. Near the metro.' }] },
          { ask: 'What did students have to pay to join?', say: 'I never asked anyone for money.', truth: false, contradict: ['E1', 'E5'], why: 'Students were told to pay ₹45,000 in 24 hours, into Sunrise Traders.',
            alts: [{ q: 'How many students did you place?', a: 'Dozens. I don’t keep count.' }, { q: 'Do you enjoy your work?', a: 'I love helping young people fly.' }] },
          { ask: 'What did your receptionist know?', say: 'Ritu didn’t know what was really going on.', truth: true, why: 'True. She was hired from an ad and paid a salary. She believed the jobs were real.',
            alts: [{ q: 'How did you hire your staff?', a: 'Through ads, like everyone else.' }, { q: 'Who cleaned the office?', a: 'A cleaner came on Mondays. So?' }] },
          { ask: 'Who controls the Sunrise Traders account?', say: 'I have nothing to do with Sunrise Traders.', truth: false, contradict: ['E6'], why: 'His own note says "Sunrise A/c: N.S."',
            alts: [{ q: 'Do you have a bank account?', a: 'Of course. Everyone does.' }, { q: 'Where were you on 20 October?', a: 'Out of town. On business.' }] }
        ],
        confession: 'Alright. There were no airline jobs. I printed fake letters, collected fees into my cousin’s Sunrise account and was going to vanish on the 20th.'
      },
      ending: 'Police froze the Sunrise Traders account and returned the fees to all 42 students. Remember: a real employer never asks you to pay for a job.',
      badge: 'Job Shield', report: '1930'
    },
    {
      id: 'inv5', scene: 'study', title: 'The Courtroom on a Video Call', type: 'Cyber crime', place: 'Gurdeep Malhotra’s study',
      client: 'Navneet Malhotra', role: 'Daughter-in-law of Gurdeep Malhotra, 76', initial: 'N', lost: '₹2,50,00,000',
      brief: 'For two days my father-in-law was kept on video calls by "CBI officers". They even held a Supreme Court "hearing" online. He sent ₹2.5 crore to stay out of jail.',
      evidence: {
        E1: { title: 'Fake online hearing', text: 'A "judge" on a video call ordered him to pay.' },
        E2: { title: 'Fake court order', text: 'Misspelt stamp and a "secret supervision account".' },
        E3: { title: '"Surveillance" rules', text: 'Report every hour, tell no one, not even family.' },
        E4: { title: 'Money transfer slip', text: '₹2.5 crore sent to Shree Ganpati Traders.' },
        E5: { title: 'Mule account', text: 'Opened 3 weeks earlier by a man paid to lend it.' },
        E6: { title: 'Recording watermark', text: '"ScreenCap trial, user deep.a77" on the call.' }
      },
      items: [
        { id: 'laptop', name: 'Laptop', kind: 'laptop', slot: 0, app: 'VidMeet: call ended', time: '6:40 pm',
          body: '[[Online hearing: "Supreme Court of India", judge on screen|court]] · [[Courtroom background looks like a photo|bg]] · [[Meeting link sent from a Gmail ID|gmail]] · [[In the corner, tiny: "ScreenCap free trial, user deep.a77"|h_trial]]',
          clues: { court: { ev: 'E1', note: 'Courts never hold secret hearings on a video app to collect money.' },
            bg: { note: 'Any background can be faked. It doesn’t name anyone.' },
            gmail: { note: 'Suspicious, but lots of people use Gmail. Not a lead by itself.' },
            h_trial: { ev: 'E6', note: 'The "court" was a free screen-recording trial with a username!' } } },
        { id: 'phone', name: 'Gurdeep ji’s phone', kind: 'phone', slot: 1, lock: '1947', app: 'Chat', from: 'CBI Officer Rahul Gupta', time: '9:00 am',
          body: '[[Good morning, sir.|greet]] [[You are under digital surveillance|surv]]. [[Send a "present" message every hour|hourly]]. [[Do not tell your family or your lawyer|secret]].',
          clues: { greet: { note: 'Politeness is part of the act. Not evidence.' },
            surv: { ev: 'E3', note: '"Digital surveillance" is not a real legal process.' },
            hourly: { ev: 'E3', note: 'Hourly check-ins kept him scared and under control.' },
            secret: { ev: 'E3', note: 'Cutting him off from family and lawyers is the scammer’s key move.' } } },
        { id: 'order', name: '"Supreme Court order"', kind: 'letter', slot: 2, app: 'Document', subject: 'SUPREME COURT OF INDAI',
          body: '[[Transfer all funds to the "Secret Supervision Account"|account]]. [[Money will be returned after verification|returned]]. [[Signed by the Chief Justice|sign]]. [[Printed on glossy paper|paper]].',
          clues: { account: { ev: 'E2', note: 'There is no such thing as a "secret supervision account".' },
            returned: { ev: 'E2', note: 'Courts don’t hold your savings and promise to return them.' },
            sign: { note: 'Signatures are easy to copy. Look at what the order asks for.' },
            paper: { note: 'Nice paper proves nothing.' } } },
        { id: 'slip', name: 'RTGS transfer slip', kind: 'receipt', slot: 3, app: 'Kestrel Bank',
          body: '[[₹2,50,00,000 to Shree Ganpati Traders|amt]]. [[Account opened just 3 weeks ago|new]]. [[Branch: in another state|branch]].',
          clues: { amt: { ev: 'E4', note: 'The money went to a private trading firm, not the government.' },
            new: { ev: 'E5', note: 'A brand-new account that suddenly gets crores: a "mule" account.' },
            branch: { note: 'Scammers often use far-away branches, but it doesn’t name anyone.' } } },
        { id: 'notebook', name: 'Gurdeep ji’s diary', kind: 'notebook', slot: 4, app: 'Handwritten notes',
          body: '[[Hearing at 11 am. Wear a formal shirt.|hearing]] [[Officer said: do NOT call my son|nocall]]. [[BP tablet twice a day|bp]]. [[Phone PIN 1947|pin]]',
          clues: { hearing: { ev: 'E1', note: 'He dressed up for a court hearing that only existed on a video call.' },
            nocall: { ev: 'E3', note: 'Stopping him from calling his son kept the scam going.' },
            bp: { note: 'His medicine. Not evidence.' },
            pin: { note: 'His phone PIN. Not evidence, but now you can unlock his phone!' } } },
        { id: 'cup', name: 'Glass of water', kind: 'cup', slot: 5, app: 'Close look',
          body: '[[Untouched glass of water|water]].',
          clues: { water: { note: 'He was too scared to even drink. Not evidence.' } } }
      ],
      puzzle: { type: 'money', title: 'Follow the ₹2.5 crore', intro: 'Trace where Gurdeep ji’s money went, step by step. Pick what happened next.', start: 'Gurdeep ji’s savings: ₹2.5 crore',
        pieces: ['Sent by RTGS to "Shree Ganpati Traders"', 'Split into 12 smaller mule accounts', 'Frozen by police after a 1930 complaint'],
        decoys: ['Kept safe by the Supreme Court', 'Sent to the Reserve Bank of India', 'Returned after "verification"'],
        lesson: 'Scammers move money through mule accounts within minutes. Calling 1930 fast lets banks freeze it.' },
      board: [
        { q: 'How did the scammers stop him from asking for help?', answer: 'E3', why: '"Surveillance" rules and hourly check-ins kept him isolated and afraid for two days.' },
        { q: 'Which evidence proves the court order was fake?', answer: 'E2', why: 'A misspelt stamp and a "secret supervision account": no real court works like this.' },
        { q: 'Where did the money go first?', answer: 'E5', why: 'Into a 3-week-old mule account, rented from someone paid to lend it.' }
      ],
      people: {
        manish: { name: 'Manish Tiwari', role: 'Holder of the Shree Ganpati Traders account', look: { model: 'whitetee', height: 1.72, shirt: [0.92, 0.75, 0.3], pants: [0.25, 0.25, 0.3], skin: [0.68, 0.5, 0.38], hair: [0.07, 0.06, 0.05], style: 'short', voice: 1.12 } },
        deepak: { name: 'Deepak Arora', role: 'Username "deep.a77" traced to him', look: { model: 'tanktop', height: 1.76, shirt: [0.18, 0.2, 0.28], pants: [0.14, 0.14, 0.16], skin: [0.74, 0.56, 0.44], hair: [0.05, 0.04, 0.04], style: 'short', glasses: true, moustache: true, outfit: 'jacket', jacket: [0.12, 0.13, 0.16], voice: 0.84 } },
        sanjay: { name: 'Sanjay Bhalla', role: 'Gurdeep ji’s accountant', look: { model: 'elder_suit', height: 1.7, shirt: [0.85, 0.88, 0.92], pants: [0.3, 0.28, 0.25], skin: [0.7, 0.52, 0.4], hair: [0.6, 0.6, 0.62], style: 'bald', glasses: true, voice: 0.74 } }
      },
      lineup: {
        q: 'Who ran the fake courtroom?', ids: ['manish', 'deepak', 'sanjay'], culprit: 'deepak',
        alibis: {
          manish: { say: 'I only sold my bank account for ₹10,000 to a man called Deepak!', why: 'Selling your account is a crime too, but Manish never spoke to Gurdeep ji.' },
          sanjay: { say: 'I’m his accountant! I only found out when the bank called me.', why: 'Sanjay raised the alarm, and the money never touched his accounts.' }
        },
        caught: 'Me? I run a computer repair shop. I don’t know any judge!',
        why: 'The fake hearing was recorded on his "deep.a77" account, and Manish says Deepak bought his bank account.'
      },
      suspect: {
        id: 'deepak', style: 'pair',
        intro: 'Now Deepak Arora, the username on the recording. Manish’s statements are on the table as cards: use them.',
        tone: { prefers: 'tough', mood: 'Deepak taps the table and grins. "Ask whatever you like. I know the law better than you."',
          calm: 'Polite police! How nice. I still have nothing to say.',
          tough: 'Fine, fine. No need for threats. Let’s get this over with.' },
        partner: {
          id: 'manish', intro: 'Two people, two rooms. First question Manish, who sold his bank account. He’s scared and might talk.',
          tone: { prefers: 'calm', mood: 'Manish is barely twenty. He keeps whispering "I didn’t know, I didn’t know".',
            calm: 'I’ll tell you everything. I only needed the money for my college fees.',
            tough: 'Please don’t shout! I… I can’t remember anything.' },
          statements: [
            { say: 'Deepak paid me ₹10,000 to use my bank account.', truth: true, tag: 'P1', short: 'Deepak paid me ₹10,000 to use my bank account.', why: 'True. Selling your account is a crime, and it leads straight to Deepak.' },
            { say: 'I opened that account years ago.', truth: false, contradict: ['E5'], why: 'It was opened just three weeks before the crime, to receive the money.' },
            { say: 'Deepak said crores would come in from "court cases".', truth: true, tag: 'P2', short: 'Deepak said crores would come in from "court cases".', why: 'True. Deepak knew exactly where the money would come from.' }
          ]
        },
        statements: [
          { say: 'I am a CBI officer. The hearing was real.', truth: false, contradict: ['E1', 'E3'], why: 'Real officers don’t hold hearings on video apps or keep people under "digital surveillance".' },
          { say: 'I never met Gurdeep ji in person.', truth: true, why: 'True. The whole crime happened over video calls.' },
          { say: 'I don’t know anyone called Manish Tiwari.', truth: false, contradict: ['P1'], why: 'Manish says Deepak paid him ₹10,000 for his bank account.' },
          { say: 'The money went into a government account.', truth: false, contradict: ['E4', 'E5', 'P2'], why: 'It went to a 3-week-old private mule account, just as Deepak told Manish it would.' },
          { say: 'I have never recorded any video call.', truth: false, contradict: ['E6'], why: 'The recording carries his own username, "deep.a77".' }
        ],
        confession: 'Fine. We set up a fake courtroom on a video call. I played the CBI officer, a friend played the judge, and we bought bank accounts like Manish’s to move the money.'
      },
      ending: 'Police froze the mule accounts within hours and most of the money was returned. Remember: no court ever holds a hearing on a video call to collect money.',
      badge: 'Court Breaker', report: '1930',
      real: { text: 'In 2024, scammers posing as CBI officers kept a Ludhiana industrialist on video calls, staged a fake Supreme Court hearing and took ₹7 crore. Police froze accounts, recovered about ₹5 crore and arrested two men in Guwahati.', source: 'Bar & Bench, Outlook Business, Moneylife' }
    },
    {
      id: 'inv6', scene: 'kitchen', title: 'The Call from "the Bank"', type: 'Cyber crime', place: 'Kavita Menon’s kitchen',
      client: 'Kavita Menon', role: 'School teacher, 45', initial: 'K', lost: '₹1,85,000',
      brief: 'A polite man from my "bank’s head office" said my card would be blocked unless I updated my KYC. I read him a code from an SMS. Within minutes, ₹1,85,000 was gone.',
      evidence: {
        E1: { title: 'Fake bank call', text: 'He said he was from the bank’s head office.' },
        E2: { title: 'OTP read out', text: 'She read the OTP aloud during the call.' },
        E3: { title: 'Gift voucher spending', text: '₹1,85,000 spent on GiftKart e-vouchers.' },
        E4: { title: 'Voucher email', text: 'Vouchers sent to ajk.deals77@mail.in.' },
        E5: { title: 'SIM on a fake ID', text: 'Caller’s SIM sold by Shah Mobiles on a fake ID.' },
        E6: { title: '"300 SIMs: A.K."', text: 'Note in the shop register: picked up by A.K.' }
      },
      items: [
        { id: 'laptop', name: 'Kavita’s laptop', kind: 'laptop', slot: 0, app: 'Email: GiftKart orders', time: '4:12 pm',
          body: '[[12 e-vouchers bought with your card|vouchers]] · [[Delivered to ajk.deals77@mail.in|email]] · [[Order time: 4:12 pm|time]] · [[GiftKart logo|logo]]',
          clues: { vouchers: { ev: 'E3', note: 'Gift vouchers are easy to resell. Thieves turn stolen money into them.' },
            email: { ev: 'E4', note: 'The vouchers went to someone else’s email. A strong lead!' },
            time: { note: 'Right after the call. It fits, but names no one.' },
            logo: { note: 'Just the shop’s logo.' } } },
        { id: 'phone', name: 'Kavita’s phone', kind: 'phone', slot: 1, lock: '2468', app: 'Calls & messages', time: '4:09 pm',
          body: '[[Call: "Kestrel Bank Head Office" +91 62870 11904, 14 min|call]]. [[SMS: OTP 739204. Never share it with anyone, including bank staff|otp]]. [[Missed call: Amma|amma]].',
          clues: { call: { ev: 'E1', note: 'Banks never call to ask for OTPs or KYC updates.' },
            otp: { ev: 'E2', note: 'The SMS itself said never to share it. Reading it out handed over her money.' },
            amma: { note: 'Her mother called. Not evidence.' } } },
        { id: 'reply', name: 'Telecom reply to police', kind: 'printout', slot: 2, app: 'Nimbus Mobile: legal desk',
          body: '[[Caller’s SIM sold by Shah Mobiles|shop]]. [[ID photo doesn’t match the name|fakeid]]. [[Activated 5 days before the call|days]]. [[Pencil note in tiny letters: "300 SIMs picked up by A.K."|h_ak]]',
          clues: { shop: { ev: 'E5', note: 'The shop that sold the caller’s SIM. Follow it!' },
            fakeid: { ev: 'E5', note: 'The SIM was bought on a fake ID so the caller couldn’t be traced.' },
            days: { note: 'New SIMs are common in these scams, but this names no one.' },
            h_ak: { ev: 'E6', note: 'Someone with the initials A.K. collected 300 SIMs.' } } },
        { id: 'stmt', name: 'Bank statement', kind: 'receipt', slot: 3, app: 'Kestrel Bank',
          body: '[[₹1,85,000 paid to GiftKart|paid]]. [[Card ending 4410|card]]. [[Balance left: ₹2,310|bal]].',
          clues: { paid: { ev: 'E3', note: 'Her money was spent on gift vouchers in minutes.' },
            card: { note: 'Her own card. Not a lead.' },
            bal: { note: 'Sad, but not evidence.' } } },
        { id: 'notebook', name: 'Kitchen notebook', kind: 'notebook', slot: 4, app: 'Handwritten notes',
          body: '[[Bank man: "Mr. Sharma, Head Office"|sharma]]. [[Read him the code from the SMS|readcode]]. [[Buy tomatoes|tom]]. [[Phone PIN 2468|pin]]',
          clues: { sharma: { ev: 'E1', note: 'A fake name and a fake office to sound official.' },
            readcode: { ev: 'E2', note: 'This is the moment the money was lost.' },
            tom: { note: 'Just shopping.' },
            pin: { note: 'Her phone PIN. Not evidence, but now you can unlock her phone!' } } },
        { id: 'cup', name: 'Cup of chai', kind: 'cup', slot: 5, app: 'Close look',
          body: '[[Chai gone cold|chai]].',
          clues: { chai: { note: 'Forgotten during the call. Not evidence.' } } }
      ],
      puzzle: { type: 'money', title: 'Follow the stolen money', intro: 'Trace how Kavita’s card turned into cash for the scammer. Pick what happened next.', start: 'Kavita’s bank card',
        pieces: ['She reads the OTP to "Mr. Sharma"', '₹1,85,000 of GiftKart e-vouchers bought', 'Vouchers emailed to ajk.deals77@mail.in', 'Resold online at a discount'],
        decoys: ['Money sent to a "safe account"', 'The bank reverses the payment'],
        lesson: 'Never share an OTP. Banks never ask for it, and gift vouchers are a favourite way to cash out stolen money.' },
      board: [
        { q: 'How did the caller get past the bank’s security?', answer: 'E2', why: 'She read out the OTP, the one code that approves payments.' },
        { q: 'What did the thief turn her money into?', answer: 'E3', why: 'Gift vouchers, which are quick to resell and hard to trace.' },
        { q: 'Which lead shows where the caller’s SIM came from?', answer: 'E5', why: 'The SIM was sold by Shah Mobiles on a fake ID.' }
      ],
      people: {
        pankaj: { name: 'Pankaj Shah', role: 'Owner, Shah Mobiles', look: { model: 'elder_suit', height: 1.71, shirt: [0.82, 0.8, 0.72], pants: [0.25, 0.22, 0.2], skin: [0.72, 0.54, 0.42], hair: [0.35, 0.33, 0.32], style: 'short', moustache: true, glasses: true, outfit: 'kurta', voice: 0.78 } },
        ajay: { name: 'Ajay Kumar', role: 'Sells gift vouchers online', look: { model: 'confidence2', height: 1.75, shirt: [0.75, 0.2, 0.22], pants: [0.2, 0.22, 0.3], skin: [0.66, 0.48, 0.36], hair: [0.06, 0.05, 0.05], style: 'short', beard: true, cap: [0.15, 0.2, 0.35], voice: 0.95 } },
        lalita: { name: 'Lalita Sen', role: 'Bought vouchers from ajk.deals77', look: { model: 'sundress', height: 1.63, shirt: [0.25, 0.55, 0.45], pants: [0.2, 0.2, 0.24], skin: [0.76, 0.58, 0.46], hair: [0.1, 0.07, 0.06], style: 'long', female: true, bindi: true, outfit: 'saree', saree: [0.15, 0.5, 0.45], border: [0.9, 0.3, 0.3], voice: 1.28 } }
      },
      lineup: {
        q: 'Who made the fake bank call?', ids: ['pankaj', 'ajay', 'lalita'], culprit: 'ajay',
        alibis: {
          pankaj: { say: 'I sold SIM cards. A man paid me extra to activate 300 of them!', why: 'Selling SIMs on fake IDs is a crime, but the vouchers didn’t go to him.' },
          lalita: { say: 'I resell gift vouchers. I bought these from ajk.deals77 in good faith!', why: 'She was a buyer. The seller’s email belongs to someone else.' }
        },
        caught: 'I just sell vouchers online! Lots of people call banks.',
        why: 'The vouchers went to his email, ajk.deals77, and the 300 SIMs were picked up by "A.K.".'
      },
      suspect: {
        id: 'ajay', style: 'questions',
        intro: 'The voucher email and the SIM register both point to Ajay Kumar. You choose the questions: make him commit.',
        tone: { prefers: 'calm', mood: 'Ajay talks fast and keeps smiling, like he’s on a sales call. Pressure just makes him dig in.',
          calm: 'Finally, someone polite! Okay, I’ll tell you everything… well, most things.',
          tough: 'Sir, I understand your concern. Kindly hold the line. I have nothing to add.' },
        statements: [
          { ask: 'Who did you call on the morning of the fraud?', say: 'I have never called anyone pretending to be a bank.', truth: false, contradict: ['E1', 'E5'], why: 'The call came from a fake-ID SIM sold by Shah Mobiles, from the batch he collected.',
            alts: [{ q: 'Do you own a phone?', a: 'Everyone has a phone, sir.' }, { q: 'Do you know Kavita ji?', a: 'Never heard of her.' }] },
          { ask: 'What did you need from her during that call?', say: 'I never asked her for any code.', truth: false, contradict: ['E2'], why: 'She wrote it down: she read the code to "Mr. Sharma" on the call.',
            alts: [{ q: 'Do you use UPI?', a: 'Sure, for chai and petrol.' }, { q: 'What’s your favourite app?', a: 'Cricket scores. Why?' }] },
          { ask: 'Where did you learn to talk like bank staff?', say: 'I worked in a call centre for two years.', truth: true, why: 'True, and it’s how he learned to sound like bank staff. But it isn’t evidence.',
            alts: [{ q: 'Where did you study?', a: 'Commerce college. I didn’t finish.' }, { q: 'Is your English good?', a: 'Very good, sir. Thank you for asking.' }] },
          { ask: 'How did you pay for ₹1,85,000 of gift vouchers?', say: 'Those vouchers were bought with my own money.', truth: false, contradict: ['E3', 'E4'], why: 'They were bought with Kavita’s card and sent to his email.',
            alts: [{ q: 'Do you like shopping?', a: 'Who doesn’t like a sale?' }, { q: 'What is your salary?', a: 'Enough. I manage.' }] },
          { ask: 'Who picked up 300 SIMs from Shah Mobiles?', say: 'I know nothing about those SIM cards.', truth: false, contradict: ['E6'], why: 'The register says the 300 SIMs were picked up by "A.K.".',
            alts: [{ q: 'Which phone network do you use?', a: 'Whichever is cheapest that month.' }, { q: 'Do you know Pankaj Shah?', a: 'Everybody knows Pankaj bhai. He sells phones.' }] }
        ],
        confession: 'I called people from a list, pretending to be the bank. When they read me the OTP, I bought gift vouchers and sold them online. The SIMs were on fake IDs so no one could trace me.'
      },
      ending: 'Police traced the SIMs and the voucher sales and arrested the gang. Kavita reported it within the hour, so her bank recovered part of the money.',
      badge: 'Call Catcher', report: '1930',
      real: { text: 'Delhi Police busted a Jamtara-linked fraud gang that had cheated about 2,000 people and seized around 21,000 SIM cards. Gangs like this call people pretending to be bank staff and ask for OTPs.', source: 'The Tribune, Moneylife' }
    }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = INVESTIGATIONS;
  else root.Investigations = INVESTIGATIONS;
})(this);
