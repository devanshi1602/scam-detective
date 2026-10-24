/* Scam Detective — message cases and case logic (no dependencies).
 * All brands, numbers and links are fictional. Message body uses [[text|key]] to mark a
 * tappable clue; `clues[key]` says whether it is a red flag and explains why.
 * Special clue keys: "from" (the sender line) and "action" (the button at the bottom).
 */
(function (root) {
  'use strict';

  var MESSAGES = [
    /* ---------------- tutorial ---------------- */
    { id: 'T1', type: 'sms', scam: true, tutorial: true,
      from: '+91 70021 55934', time: '9:41 am',
      body: '[[CONGRATULATIONS!!|caps]] You have WON ₹10,00,000 in the Lucky Mobile Draw. To claim, [[pay ₹999 processing fee|fee]] at [[lucky-draw-claim.win|link]] [[within 1 hour|urgent]]!',
      clues: {
        from: { flag: true, note: 'A random mobile number, not a registered company sender.' },
        caps: { flag: true, note: 'Shouting and excitement are used to rush you.' },
        fee: { flag: true, note: 'Real prizes never ask you to pay to receive them.' },
        link: { flag: true, note: 'A strange website made just for this scam.' },
        urgent: { flag: true, note: 'A tight deadline stops you from thinking it through.' } },
      why: 'You never entered a draw, and you’re asked to pay to "receive" a prize.',
      tip: 'If you have to pay to win, it’s a scam.' },

    /* ---------------- scams ---------------- */
    { id: 'S1', type: 'sms', scam: true, from: '+91 98410 22871', time: '10:12 am',
      body: '[[Dear Customer|greet]], your Kestrel Bank account will be [[BLOCKED today|urgent]] due to pending KYC. Update now: [[http://kestrel-kyc-update.co/verify|link]]',
      clues: {
        from: { flag: true, note: 'Banks send alerts from registered IDs like AX-KSTRBK, not mobile numbers.' },
        greet: { flag: false, note: '"Dear Customer" appears in real and fake messages. Not proof by itself.' },
        urgent: { flag: true, note: 'Threats of blocking "today" are meant to panic you.' },
        link: { flag: true, note: 'Not the bank’s site (kestrelbank.in). Banks never ask for KYC via SMS links.' } },
      why: 'A KYC link sent from a personal number, with a threat. Classic bank phishing.',
      tip: 'Do KYC only in the bank’s official app or at the branch.' },

    { id: 'S2', type: 'upi', scam: true, from: 'Lucky Draw Desk', time: '11:03 am',
      amount: '₹4,999',
      body: '[[Lucky Draw Desk|who]] has requested [[₹4,999|amount]]. Note: "[[Enter UPI PIN to RECEIVE your ₹25,000 prize|pin]]"',
      action: 'Pay ₹4,999',
      clues: {
        who: { flag: true, note: 'A stranger, not someone you owe money to.' },
        amount: { flag: false, note: 'The amount alone doesn’t tell you much. Who is asking and why matters more.' },
        pin: { flag: true, note: 'You NEVER need your UPI PIN to receive money. PIN = paying.' },
        action: { flag: true, note: 'This is a payment button. Approving it sends money out.' } },
      why: 'A "collect request" disguised as a prize. Entering your PIN pays the scammer.',
      tip: 'Receiving money never needs a PIN, a QR scan or an OTP.' },

    { id: 'S3', type: 'chat', scam: true, from: 'CBI Officer R. Sharma', time: '2:30 pm', avatar: '★',
      body: 'Your [[Aadhaar is linked to a money laundering case|claim]]. You are under [[DIGITAL ARREST|arrest]]. [[Do not disconnect the video call or tell your family|secret]]. [[Transfer ₹1,50,000 to the verification account|pay]] to prove your innocence.',
      clues: {
        from: { flag: true, note: 'Real officers don’t contact you on a chat app with a badge as their profile photo.' },
        claim: { flag: true, note: 'A frightening accusation out of nowhere is meant to make you panic.' },
        arrest: { flag: true, note: '"Digital arrest" does not exist. Police never arrest anyone over a video call.' },
        secret: { flag: true, note: 'Scammers isolate you so no one can warn you.' },
        pay: { flag: true, note: 'No agency asks you to transfer money to "prove innocence".' } },
      why: 'The "digital arrest" scam: fake officers, fear and secrecy, ending in a transfer.',
      tip: 'Hang up and call 1930 (India’s cyber crime helpline) or a trusted adult.' },

    { id: 'S4', type: 'sms', scam: true, from: 'ParcelWing', time: '8:55 am',
      body: '[[ParcelWing|brand]]: Your parcel is on hold due to an incomplete address. [[Pay ₹25 redelivery fee|fee]] [[within 12 hrs|urgent]]: [[parcelwing.delivery-fee.top|link]]',
      clues: {
        from: { flag: false, note: 'Sender names can be faked. Check the link and the request, not just the name.' },
        brand: { flag: false, note: 'Using a real company’s name is common in scams. On its own it proves nothing.' },
        fee: { flag: true, note: 'A tiny fee is bait to collect your card details.' },
        urgent: { flag: true, note: 'An artificial deadline to rush you.' },
        link: { flag: true, note: 'The real site is parcelwing.in. ".top" is a different, cheap domain.' } },
      why: 'A fake delivery fee. The small amount makes it feel harmless, but it’s for stealing card details.',
      tip: 'Check deliveries in the shop’s own app, not from SMS links.' },

    { id: 'S5', type: 'chat', scam: true, from: 'Priya | TalentBridge HR', time: '4:18 pm', avatar: 'P',
      body: 'Hi! [[Earn ₹3,000–₹8,000 daily just by liking videos|pay]]! Part time, work from home. [[Join our Telegram task group|move]] 👉 [[t.me/tb_tasks_vip|link]]. [[Small deposit of ₹1,000 unlocks premium tasks|deposit]].',
      clues: {
        from: { flag: true, note: 'An unknown person messaging you about a job you never applied for.' },
        pay: { flag: true, note: 'Huge pay for a trivial task is too good to be true.' },
        move: { flag: true, note: 'Moving you to another app makes it harder to report them.' },
        link: { flag: false, note: 'A Telegram link alone isn’t proof, but it’s a common next step in task scams.' },
        deposit: { flag: true, note: 'Real jobs pay you. They never ask YOU to pay first.' } },
      why: 'The "task job" scam: small early payouts build trust, then the deposits grow.',
      tip: 'Any job that asks you to pay a deposit is a scam.' },

    { id: 'S6', type: 'sms', scam: true, from: '+91 63945 10228', time: '7:40 pm',
      body: 'Dear consumer, your [[electricity will be disconnected tonight at 9:30 pm|urgent]] because [[previous month bill was not updated|vague]]. Please immediately [[call our electricity officer 98XXX 40112|call]].',
      clues: {
        from: { flag: true, note: 'Power companies don’t message from personal mobile numbers.' },
        urgent: { flag: true, note: 'A same-night cut-off is pressure, not procedure.' },
        vague: { flag: true, note: 'Vague, oddly worded reason: "bill not updated".' },
        call: { flag: true, note: 'The "officer" will ask you to install a screen-sharing app or pay.' } },
      why: 'A fake disconnection threat to make you call a scammer.',
      tip: 'Check your bill on the official app or website, never via a number in an SMS.' },

    { id: 'S7', type: 'email', scam: true, from: 'ShopLoop Rewards <rewards@shoploop-gifts.win>', time: 'Yesterday',
      subject: 'Congratulations! You won a new smartphone 🎉',
      body: 'You were selected in our [[anniversary lucky draw|draw]]! To receive your phone, just [[pay ₹199 shipping|fee]] using the button below. [[Offer expires in 24 hours|urgent]].',
      action: 'Claim my phone',
      clues: {
        from: { flag: true, note: 'ShopLoop emails come from @shoploop.in. This is "shoploop-gifts.win".' },
        draw: { flag: true, note: 'You never entered a draw.' },
        fee: { flag: true, note: 'A "shipping fee" for a prize is a way to take your card details.' },
        urgent: { flag: true, note: 'Countdown pressure.' },
        action: { flag: true, note: 'The button opens a fake payment page.' } },
      why: 'A fake prize from a look-alike email address.',
      tip: 'Check the part after "@". One extra word means a different sender.' },

    { id: 'S8', type: 'email', scam: true, from: 'National Tax Office <refund@ntax-refund.online>', time: 'Mon',
      subject: 'Refund of ₹15,490 approved',
      body: 'Dear Taxpayer, you are [[eligible for a refund of ₹15,490|bait]]. [[Submit your debit card number, expiry and CVV|card]] [[within 24 hours|urgent]] to receive it.',
      action: 'Get refund',
      clues: {
        from: { flag: true, note: 'Government offices don’t use ".online" addresses.' },
        bait: { flag: false, note: 'Refunds are real. What matters is how they ask you to claim one.' },
        card: { flag: true, note: 'No refund needs your CVV. That number is only for paying.' },
        urgent: { flag: true, note: 'A deadline to stop you checking.' },
        action: { flag: true, note: 'Leads to a fake form that steals card details.' } },
      why: 'A fake tax refund that asks for your full card details.',
      tip: 'Never share your CVV, OTP or PIN, with anyone, for any reason.' },

    { id: 'S9', type: 'social', scam: true, from: 'rohan.k_', time: '3m', avatar: 'R',
      body: '[[Heyy is this you in this video?? 😳|hook]] [[pixgram-login.co/v/88|link]]',
      clues: {
        from: { flag: false, note: 'It’s your friend’s account, but accounts get hacked. The message is what’s off.' },
        hook: { flag: true, note: 'Shock and curiosity make you click without thinking.' },
        link: { flag: true, note: 'A fake login page to steal your password. Pixgram’s real site is pixgram.com.' } },
      why: 'A hacked friend’s account spreading a fake login page.',
      tip: 'Ask your friend in another way (a call, in person) before clicking.' },

    { id: 'S10', type: 'chat', scam: true, from: 'Stock Gurus VIP 📈', time: '9:00 am', avatar: '₹',
      body: 'Join our [[guaranteed 30% weekly returns|returns]] plan! [[Members earned ₹5 lakh last month|proof]] (see screenshots). [[Install our trading app from this APK link|apk]]. [[Only 3 seats left!|scarcity]]',
      clues: {
        from: { flag: true, note: 'You were added to a group by strangers.' },
        returns: { flag: true, note: 'No real investment can guarantee returns, especially 30% a week.' },
        proof: { flag: true, note: 'Screenshots of profits are easy to fake.' },
        apk: { flag: true, note: 'APK files from links skip the app store’s safety checks.' },
        scarcity: { flag: true, note: 'Fake scarcity to rush you.' } },
      why: 'An investment scam with fake profits and a malicious app.',
      tip: 'Guaranteed returns are the clearest sign of investment fraud.' },

    { id: 'S11', type: 'sms', scam: true, from: 'QK-LOANS', time: '1:15 pm',
      body: '[[Pre-approved instant loan of ₹50,000|offer]]! [[No documents, no credit check|nodocs]]. [[Download QuickRupee APK|apk]]: [[qrupee-app.in/get|link]]',
      clues: {
        from: { flag: false, note: 'Registered-looking sender IDs can belong to anyone who bought one. Look at the offer.' },
        offer: { flag: true, note: '"Pre-approved" when you never applied.' },
        nodocs: { flag: true, note: 'Real lenders always check who you are.' },
        apk: { flag: true, note: 'Loan apps installed from APKs can read your contacts and photos to harass you.' },
        link: { flag: true, note: 'Not an official app store link.' } },
      why: 'A fake loan app that steals your data and harasses you.',
      tip: 'Borrow only from regulated lenders, through official app stores.' },

    { id: 'S12', type: 'chat', scam: true, from: '+91 81234 66710', time: '5:47 pm', avatar: '?',
      body: 'Hi, I saw your cycle for sale. [[I’ll take it, no need to see it|eager]]! [[I’ve sent the payment, just scan this QR code to receive ₹6,000|qr]].',
      action: 'Scan QR',
      clues: {
        from: { flag: false, note: 'Buyers are often strangers. That’s normal on marketplaces.' },
        eager: { flag: true, note: 'A buyer who doesn’t care what they’re buying is suspicious.' },
        qr: { flag: true, note: 'Scanning a QR code PAYS money. You never scan to receive.' },
        action: { flag: true, note: 'This opens a payment to the scammer.' } },
      why: 'The QR code "refund" trick: scanning sends money instead of receiving it.',
      tip: 'To receive money, just share your UPI ID. Don’t scan anything.' },

    { id: 'S13', type: 'sms', scam: true, from: '+91 90031 88250', time: '12:20 pm',
      body: 'Nimbus Mobile: [[Your SIM will be deactivated in 2 hours|urgent]] due to pending eKYC. [[Reply with the OTP sent to you|otp]] to continue service.',
      clues: {
        from: { flag: true, note: 'A mobile number pretending to be your network.' },
        urgent: { flag: true, note: 'A short deadline to rush you.' },
        otp: { flag: true, note: 'An OTP lets someone take over your SIM or account. Never share it.' } },
      why: 'A SIM-swap scam. Your OTP lets them take your number and your bank OTPs.',
      tip: 'An OTP is like a key. No real company asks you to send it to them.' },

    { id: 'S14', type: 'alert', scam: true, from: 'Security Alert', time: 'now',
      body: '⚠️ [[Your phone is infected with 3 viruses!|scare]] Your photos and bank details are at risk. [[Call Support now: 1800-555-0199|call]] [[Do not close this page|trap]].',
      action: 'Clean now',
      clues: {
        from: { flag: true, note: 'A website pop-up, not your phone’s real security app.' },
        scare: { flag: true, note: 'Websites can’t scan your phone for viruses.' },
        call: { flag: true, note: 'The "support" person will ask for remote access or payment.' },
        trap: { flag: true, note: 'Just close the tab. Nothing bad happens.' },
        action: { flag: true, note: 'Downloads a harmful app.' } },
      why: 'A fake virus warning to get you to call scammers or install malware.',
      tip: 'Close the tab. Real warnings come from your phone’s settings, not websites.' },

    { id: 'S15', type: 'chat', scam: true, from: '+91 77980 31456', time: '6:02 pm', avatar: '?',
      body: '[[Hi Mom, this is my new number|newnum]], phone broke. [[Need ₹8,000 urgently for exam fees|urgent]], please send to [[this UPI: fees.desk@zappa|upi]]. [[Don’t call, I’m in class|nocall]].',
      clues: {
        from: { flag: true, note: 'An unknown number claiming to be family.' },
        newnum: { flag: true, note: '"New number" is the classic opening of this scam.' },
        urgent: { flag: true, note: 'Urgent money request.' },
        upi: { flag: true, note: 'The money goes to someone else’s UPI ID, not your child’s.' },
        nocall: { flag: true, note: 'They stop you calling because one call would expose them.' } },
      why: 'The "family emergency from a new number" scam.',
      tip: 'Always call the person on their old number before sending money.' },

    { id: 'S16', type: 'email', scam: true, from: 'Kestrel Bank Security <alerts@kestre1bank.in>', time: 'Tue',
      subject: 'Unusual sign-in detected',
      body: 'We noticed an unusual sign-in to your account. [[Verify your identity|verify]] by entering your [[net banking password and OTP|creds]] on the secure page.',
      action: 'Secure my account',
      clues: {
        from: { flag: true, note: 'Look closely: "kestre1bank" uses the number 1 instead of the letter l.' },
        verify: { flag: false, note: 'Banks do send security alerts. The request that follows is what matters.' },
        creds: { flag: true, note: 'A bank never asks for your password and OTP together.' },
        action: { flag: true, note: 'The button opens a copy of the bank’s login page.' } },
      why: 'A look-alike domain ("kestre1bank") used to steal your login.',
      tip: 'Type your bank’s address yourself, or use its app. Don’t follow email links.' },

    /* ---------------- legitimate ---------------- */
    { id: 'L1', type: 'sms', scam: false, from: 'AX-KSTRBK', time: '2:05 pm',
      body: '[[482913 is your OTP|otp]] for a [[transaction of ₹1,250 at ShopLoop|txn]]. Valid for 5 mins. [[Do not share it with anyone, including bank staff|warn]]. -Kestrel Bank',
      clues: {
        from: { flag: false, note: 'A registered sender ID from the bank.' },
        otp: { flag: false, note: 'An OTP you asked for, while paying. Just don’t share it.' },
        txn: { flag: false, note: 'It matches a purchase you’re making right now.' },
        warn: { flag: false, note: 'Real banks remind you never to share OTPs. A good sign.' } },
      why: 'A normal OTP for a purchase you started. No link, no request to share it.',
      tip: 'An OTP is safe to use yourself. It only becomes a problem when someone asks for it.' },

    { id: 'L2', type: 'sms', scam: false, from: 'VM-PRCLWG', time: '9:30 am',
      body: 'Your ShopLoop order [[#SL4471|order]] is [[out for delivery today|status]]. Track: [[parcelwing.in/t/SL4471|link]]',
      clues: {
        from: { flag: false, note: 'The courier’s registered sender ID.' },
        order: { flag: false, note: 'An order number you can match in the ShopLoop app.' },
        status: { flag: false, note: 'Just information. No payment or personal details requested.' },
        link: { flag: false, note: 'The courier’s real domain, parcelwing.in.' } },
      why: 'A routine delivery update from the official domain, asking for nothing.',
      tip: 'Messages that only inform you, without asking for money or details, are usually fine.' },

    { id: 'L3', type: 'email', scam: false, from: 'ShopLoop <orders@shoploop.in>', time: 'Sun',
      subject: 'Your order is confirmed',
      body: 'Hi Aditi, thanks for your order of [[1 × Study lamp (₹1,199)|item]]. [[Paid using ZappaPay|paid]]. [[We will never ask for your password or OTP|warn]].',
      action: 'View order',
      clues: {
        from: { flag: false, note: 'The official domain, shoploop.in.' },
        item: { flag: false, note: 'Something you actually bought.' },
        paid: { flag: false, note: 'Already paid. Nothing more is requested.' },
        warn: { flag: false, note: 'A security reminder, a good sign.' },
        action: { flag: false, note: 'Opens your order on the real site. You could also check it in the app.' } },
      why: 'An order confirmation for something you bought, from the real domain.',
      tip: 'When in doubt, open the shop’s app yourself instead of tapping links.' },

    { id: 'L4', type: 'upi', scam: false, from: 'Ananya Rao', time: '1:44 pm', amount: '₹500',
      body: 'You [[received ₹500|received]] from [[Ananya Rao (ananya.rao@zappa)|who]]. Note: "[[Movie tickets 🎬|note]]"',
      clues: {
        who: { flag: false, note: 'A friend you know.' },
        received: { flag: false, note: 'Money already received. No PIN, no action needed.' },
        note: { flag: false, note: 'Matches something you planned together.' } },
      why: 'A real payment received from a friend. Nothing to approve.',
      tip: 'A real payment just arrives in your account. No PIN, QR scan or approval needed.' },

    { id: 'L5', type: 'email', scam: false, from: 'Greenfield College <exams@greenfield.edu.in>', time: 'Wed',
      subject: 'Semester exam timetable published',
      body: 'Dear students, the [[semester exam timetable|info]] is now on the [[student portal (portal.greenfield.edu.in)|link]]. [[Contact the exam office for any questions|contact]].',
      clues: {
        from: { flag: false, note: 'Your college’s official domain.' },
        info: { flag: false, note: 'Expected news, at the expected time of year.' },
        link: { flag: false, note: 'The same domain as the sender: the official portal.' },
        contact: { flag: false, note: 'Points you to a real office you can visit.' } },
      why: 'A normal college announcement on the official domain.',
      tip: 'Real organisations give you ways to check in person or through official channels.' },

    { id: 'L6', type: 'sms', scam: false, from: 'VM-NIMBUS', time: '11:11 am',
      body: 'Your Nimbus Mobile bill of [[₹399|amount]] is generated. Pay via the [[Nimbus app or nimbusmobile.in|where]]. [[Ignore if already paid|tone]].',
      clues: {
        from: { flag: false, note: 'The network’s registered sender ID.' },
        amount: { flag: false, note: 'Your usual monthly bill.' },
        where: { flag: false, note: 'Official app and domain, with no strange links.' },
        tone: { flag: false, note: 'Calm, with no threats or deadlines.' } },
      why: 'A routine bill reminder: calm, official channels, no pressure.',
      tip: 'Calm wording and official channels are good signs.' },

    { id: 'L7', type: 'chat', scam: false, from: 'Rohan (classmate)', time: '3:12 pm', avatar: 'R',
      body: '[[Are we still on for the library at 4?|plan]] 📚 I’ll [[bring the chemistry notes|notes]].',
      clues: {
        from: { flag: false, note: 'A saved contact you talk to often.' },
        plan: { flag: false, note: 'A plan you made together.' },
        notes: { flag: false, note: 'No links, money or personal details.' } },
      why: 'A normal message from a friend. No links, no money, no pressure.',
      tip: 'Not every message is a scam. Stay alert, not afraid.' },

    { id: 'L8', type: 'sms', scam: false, from: 'AX-KSTRBK', time: '10:43 am',
      body: '[[New login to Kestrel Bank app on Android at 10:42|info]]. [[Not you? Call the number on the back of your card|help]].',
      clues: {
        from: { flag: false, note: 'The bank’s registered sender ID.' },
        info: { flag: false, note: 'A login you just made yourself.' },
        help: { flag: false, note: 'It sends you to a number you already trust, not one in the message.' } },
      why: 'A real security alert. It points you to a number you already trust.',
      tip: 'Good alerts send you to contact details you already have, not ones in the message.' }
  ];

  var BY_ID = {}; MESSAGES.forEach(function (m) { BY_ID[m.id] = m; });

  /** Split a body into segments: {text, key?} */
  function segments(body) {
    var out = [], re = /\[\[([^|\]]+)\|([^\]]+)\]\]/g, last = 0, m;
    while ((m = re.exec(body))) {
      if (m.index > last) out.push({ text: body.slice(last, m.index) });
      out.push({ text: m[1], key: m[2] });
      last = re.lastIndex;
    }
    if (last < body.length) out.push({ text: body.slice(last) });
    return out;
  }
  function plainText(msg) { return segments(msg.body).map(function (s) { return s.text; }).join(''); }
  function clueKeys(msg) { return Object.keys(msg.clues); }
  function redFlags(msg) { return clueKeys(msg).filter(function (k) { return msg.clues[k].flag; }); }

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hashString(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shuffle(arr, rnd) { arr = arr.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function dateKey(d) { d = d || new Date(); var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }

  var SCAMS = MESSAGES.filter(function (m) { return m.scam && !m.tutorial; });
  var LEGIT = MESSAGES.filter(function (m) { return !m.scam; });

  /** Today's case: 8 messages, 5 scams + 3 real, the same for everyone on a given date. */
  function dailyCase(key, tutorial) {
    key = key || dateKey();
    var rnd = mulberry32(hashString('scam-detective-' + key));
    var pick = shuffle(SCAMS, rnd).slice(0, 5).concat(shuffle(LEGIT, rnd).slice(0, 3));
    pick = shuffle(pick, rnd);
    // never start with two real messages in a row at the top: keeps the opening punchy
    if (!pick[0].scam) { var k = pick.findIndex(function (m) { return m.scam; }); var t = pick[0]; pick[0] = pick[k]; pick[k] = t; }
    var ids = pick.map(function (m) { return m.id; });
    if (tutorial) ids = ['T1'].concat(ids.slice(0, 7));
    return { key: key, ids: ids };
  }

  /** Training: endless random messages, avoiding the most recent ones. */
  function trainingPick(recent, seed) {
    var rnd = mulberry32(seed >>> 0), pool = SCAMS.concat(LEGIT).filter(function (m) { return (recent || []).indexOf(m.id) < 0; });
    if (!pool.length) pool = SCAMS.concat(LEGIT);
    return pool[Math.floor(rnd() * pool.length)].id;
  }

  /** Score one message. flagged: array of clue keys the player marked. */
  function score(msg, verdictScam, flagged) {
    flagged = flagged || [];
    var correct = verdictScam === msg.scam, flags = redFlags(msg);
    var found = flagged.filter(function (k) { return msg.clues[k] && msg.clues[k].flag; });
    var wrong = flagged.filter(function (k) { return msg.clues[k] && !msg.clues[k].flag; });
    var missed = flags.filter(function (k) { return flagged.indexOf(k) < 0; });
    var points = (correct ? 100 : 0) + found.length * 25 - wrong.length * 10;
    return { correct: correct, found: found, wrong: wrong, missed: missed, points: Math.max(0, points) };
  }

  var RANKS = [[0, 'Rookie'], [10, 'Junior Detective'], [25, 'Detective'], [50, 'Inspector'], [100, 'Cyber Chief']];
  function rank(correctTotal) {
    var r = RANKS[0];
    RANKS.forEach(function (x) { if (correctTotal >= x[0]) r = x; });
    var i = RANKS.indexOf(r), next = RANKS[i + 1];
    return { name: r[1], next: next ? next[1] : null, toNext: next ? next[0] - correctTotal : 0 };
  }

  var api = { MESSAGES: MESSAGES, BY_ID: BY_ID, segments: segments, plainText: plainText, clueKeys: clueKeys, redFlags: redFlags,
    dailyCase: dailyCase, trainingPick: trainingPick, score: score, rank: rank, dateKey: dateKey, hashString: hashString };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Cases = api;
})(this);
