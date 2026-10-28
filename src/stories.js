/* Scam Detective — story cases. A client brings a case; the player examines evidence from the victim's
 * phone (stamping each SCAM or SAFE), then answers how the scam worked and what to do next.
 * Evidence messages use the same format as cases.js and are marked story: true so they stay out of
 * the daily and training pools. All names, brands, numbers and links are fictional. */
(function (root) {
  'use strict';
  var C = root.Cases || (typeof require !== 'undefined' ? require('./cases.js') : null);

  var EVIDENCE = [
    /* ---- Case 1: The Grandmother's Prize ---- */
    { id: 'C1a', story: true, type: 'chat', scam: true, from: 'Lucky Draw Office', avatar: '★', time: '10:02 am',
      body: 'Congratulations Madam! Your number won [[₹25 lakh in our Diwali Lucky Draw|prize]]. To release it, [[approve the ₹24,999 processing request we sent|fee]]. [[Offer valid only today|urgent]]. [[Don’t tell anyone or the prize is cancelled|secret]].',
      clues: {
        from: { flag: true, note: 'A "lucky draw office" she never entered, messaging her on chat.' },
        prize: { flag: true, note: 'She never entered a draw. Surprise prizes are bait.' },
        fee: { flag: true, note: 'Real prizes never ask you to pay to receive them.' },
        urgent: { flag: true, note: 'A same-day deadline stops her checking with family.' },
        secret: { flag: true, note: 'Scammers ask for secrecy so no one can warn the victim.' } },
      why: 'A fake prize used to push her into approving a payment.', tip: 'If you have to pay to win, it’s a scam.' },
    { id: 'C1b', story: true, type: 'upi', scam: true, from: 'Prize Desk', time: '10:05 am', amount: '₹24,999',
      body: '[[Prize Desk|who]] has requested [[₹24,999|amount]]. Note: "[[Enter UPI PIN to receive your ₹25 lakh prize|pin]]"', action: 'Pay ₹24,999',
      clues: {
        who: { flag: true, note: 'A stranger, not someone she owes money to.' },
        amount: { flag: false, note: 'The amount alone isn’t the clue. Why it’s being requested is.' },
        pin: { flag: true, note: 'A UPI PIN is only ever used to PAY. Receiving needs no PIN.' },
        action: { flag: true, note: 'This button sends money out of her account.' } },
      why: 'A UPI collect request disguised as a prize. The PIN paid the scammer.', tip: 'Receiving money never needs a PIN, QR scan or OTP.' },
    { id: 'C1c', story: true, type: 'sms', scam: false, from: 'AX-KSTRBK', time: '10:09 am',
      body: '[[₹24,999 debited|debit]] from A/c XX4821 to [[prizedesk@zappa|to]] via UPI. [[Not you? Call the number on the back of your card|help]]. -Kestrel Bank',
      clues: {
        from: { flag: false, note: 'The bank’s registered sender ID.' },
        debit: { flag: false, note: 'A real alert. It shows exactly what happened.' },
        to: { flag: false, note: 'It names where the money went: useful for the police report.' },
        help: { flag: false, note: 'It points to a number she already trusts.' } },
      why: 'A genuine bank alert. It’s evidence of the loss, not the scam.', tip: 'Keep bank alerts. They help police trace the money.' },

    /* ---- Case 2: The Dream Job ---- */
    { id: 'C2a', story: true, type: 'chat', scam: true, from: 'Meera | StarReach HR', avatar: 'M', time: '4:10 pm',
      body: 'Hi Neha! [[Earn ₹3,000–₹8,000 a day just by liking videos|pay]]. [[No interview needed|nointerview]]. [[Join our task group on another app|move]] to start today.',
      clues: {
        from: { flag: true, note: 'A stranger offering a job she never applied for.' },
        pay: { flag: true, note: 'Huge pay for a trivial task is too good to be true.' },
        nointerview: { flag: true, note: 'Real employers check who they are hiring.' },
        move: { flag: true, note: 'Moving her to another app makes them harder to report.' } },
      why: 'A fake recruiter luring her into a "task job".', tip: 'Be wary of jobs you never applied for.' },
    { id: 'C2b', story: true, type: 'chat', scam: true, from: 'StarReach VIP Tasks', avatar: 'S', time: '7:45 pm',
      body: '[[Task 3 complete! ₹600 added to your wallet|wallet]]. To withdraw, [[upgrade to VIP by depositing ₹10,000|deposit]]. [[Earnings will be frozen if you don’t upgrade in 30 mins|urgent]].',
      clues: {
        from: { flag: true, note: 'A group run by the same "recruiter".' },
        wallet: { flag: true, note: 'A fake balance. The numbers are just text on a screen.' },
        deposit: { flag: true, note: 'Real jobs pay you. They never ask you to pay to get paid.' },
        urgent: { flag: true, note: 'Threats and deadlines push her to pay without thinking.' } },
      why: 'The task scam: small payouts build trust, then bigger "deposits" follow.', tip: 'Any job that asks you to pay first is a scam.' },
    { id: 'C2c', story: true, type: 'email', scam: false, from: 'Greenfield College <placements@greenfield.edu.in>', time: 'Wed',
      subject: 'Campus placement drive on 14 Nov',
      body: 'Dear students, [[six companies will interview on campus|info]]. [[Register on the student portal|link]]. [[No fees are charged for placements|nofee]].',
      clues: {
        from: { flag: false, note: 'Her college’s official domain.' },
        info: { flag: false, note: 'Expected news from a real office she can visit.' },
        link: { flag: false, note: 'The college’s own student portal.' },
        nofee: { flag: false, note: 'Real placements never charge students.' } },
      why: 'A genuine placement notice from her college.', tip: 'Real opportunities come through official channels, free of charge.' },

    /* ---- Case 3: The Video-Call Arrest ---- */
    { id: 'C3a', story: true, type: 'sms', scam: true, from: '+91 88290 41763', time: '9:12 am',
      body: 'ParcelWing: [[A parcel booked in your name contains illegal items|claim]]. [[Your case is transferred to the Cyber Police|police]]. [[Press 9 or call now to avoid legal action|call]].',
      clues: {
        from: { flag: true, note: 'A mobile number, not ParcelWing’s registered sender ID.' },
        claim: { flag: true, note: 'A frightening accusation out of nowhere is meant to cause panic.' },
        police: { flag: true, note: 'Courier companies don’t hand cases to police by SMS.' },
        call: { flag: true, note: 'Calling connects him straight to the scammers.' } },
      why: 'The opening move of a "digital arrest" scam.', tip: 'Ignore scary messages that tell you to call a number in them.' },
    { id: 'C3b', story: true, type: 'chat', scam: true, from: 'Inspector Vikram (Cyber Cell)', avatar: '★', time: '10:30 am',
      body: 'You are under [[DIGITAL ARREST|arrest]]. [[Stay on video call and do not inform family|secret]]. [[Transfer your savings to the RBI verification account|pay]]. It will be [[returned after verification|returned]].',
      clues: {
        from: { flag: true, note: 'Real officers don’t contact you on a chat app.' },
        arrest: { flag: true, note: '"Digital arrest" does not exist. Police never arrest by video call.' },
        secret: { flag: true, note: 'Isolating him from family is the scammer’s key move.' },
        pay: { flag: true, note: 'No agency asks you to move money to "verify" it.' },
        returned: { flag: true, note: 'A false promise to make the transfer feel safe.' } },
      why: 'A fake officer using fear and secrecy to take his savings.', tip: 'Hang up, tell family, and call 1930.' },
    { id: 'C3c', story: true, type: 'sms', scam: false, from: 'AX-KSTRBK', time: '11:00 am',
      body: 'Your [[fixed deposit of ₹4,20,000|fd]] matures on 30 Nov. [[Renew or withdraw in the Kestrel Bank app or at your branch|where]].',
      clues: {
        from: { flag: false, note: 'The bank’s registered sender ID.' },
        fd: { flag: false, note: 'Information about his own savings, with no request.' },
        where: { flag: false, note: 'Official app or branch. No links, no calls.' } },
      why: 'A routine bank message: no links, no pressure.', tip: 'Calm messages pointing to official apps are usually real.' },

    /* ---- Case 4: The Stolen Account ---- */
    { id: 'C4a', story: true, type: 'social', scam: true, from: 'kabir.rao', avatar: 'K', time: '2h',
      body: '[[omg is this you in this video?? 😳|hook]] [[pixgram-login.co/v/31|link]]',
      clues: {
        from: { flag: false, note: 'Her real friend’s account, but it had already been hacked.' },
        hook: { flag: true, note: 'Shock and curiosity make people click without thinking.' },
        link: { flag: true, note: 'A fake login page. Pixgram’s real site is pixgram.com.' } },
      why: 'A hacked friend’s account spreading a fake login page.', tip: 'Check with your friend another way before clicking.' },
    { id: 'C4b', story: true, type: 'sms', scam: true, from: '+91 70456 23310', time: '2h',
      body: 'Pixgram: [[Send us the 6-digit code you just received|code]] [[to verify your account|reason]], or it will be [[disabled in 1 hour|urgent]].',
      clues: {
        from: { flag: true, note: 'A mobile number pretending to be Pixgram.' },
        code: { flag: true, note: 'That code is the key to her account. Never share it.' },
        reason: { flag: false, note: 'Apps do verify accounts, but never by asking for your code.' },
        urgent: { flag: true, note: 'A deadline to rush her.' } },
      why: 'Asking for her login code to take over the account.', tip: 'Login codes are for you to type, never to share.' },
    { id: 'C4c', story: true, type: 'email', scam: false, from: 'Pixgram <security@pixgram.com>', time: '1h',
      subject: 'Your password was changed',
      body: '[[Your password was changed at 9:41 pm|info]]. [[If this wasn’t you, secure your account from the Pixgram app|help]].',
      clues: {
        from: { flag: false, note: 'Pixgram’s real domain.' },
        info: { flag: false, note: 'A genuine alert about what the scammer did.' },
        help: { flag: false, note: 'It sends her to the official app, not a link.' } },
      why: 'A genuine security alert showing when the scammer took over.', tip: 'Real alerts point you to the official app.' },

    /* ---- Case 5: The Flat That Never Was ---- */
    { id: 'C5a', story: true, type: 'social', scam: true, from: 'HomeFinds Listings', avatar: 'H', time: 'Mon',
      body: '[[2BHK, fully furnished, prime area: only ₹9,000/month|price]]! [[Photos below|photos]]. [[Many people interested, book fast|scarcity]].',
      clues: {
        from: { flag: false, note: 'Listing pages can be real or fake. The details matter more.' },
        price: { flag: true, note: 'Far below normal rent for the area: too good to be true.' },
        photos: { flag: false, note: 'Photos are easy to copy, so they prove nothing either way.' },
        scarcity: { flag: true, note: 'Fake demand to rush him.' } },
      why: 'A bait listing with an unrealistic price.', tip: 'If the price seems too good, compare nearby rents.' },
    { id: 'C5b', story: true, type: 'chat', scam: true, from: 'Owner (Col. Mehra)', avatar: 'M', time: 'Mon',
      body: 'I am [[posted out of the city, so I can’t show the flat|away]]. [[Pay ₹15,000 token to book|token]] and [[I will courier the keys|keys]]. [[Here is my ID card photo|id]].',
      clues: {
        from: { flag: true, note: 'A stranger whose identity he can’t check.' },
        away: { flag: true, note: 'An excuse to avoid meeting or showing the flat.' },
        token: { flag: true, note: 'Paying before seeing the flat is the key warning sign.' },
        keys: { flag: true, note: 'Real owners hand over keys in person, with an agreement.' },
        id: { flag: true, note: 'An ID photo is easy to fake or steal.' } },
      why: 'A fake owner using an excuse to collect a booking fee.', tip: 'Never pay before visiting and meeting the owner.' },
    { id: 'C5c', story: true, type: 'email', scam: false, from: 'SafeNest Rentals <bookings@safenest.in>', time: 'Tue',
      subject: 'Your flat visit is confirmed',
      body: '[[Visit to flat B-204 on Sat, 11 am|visit]] with [[agent Pooja (ID verified)|agent]]. [[No payment is needed before your visit|nopay]].',
      clues: {
        from: { flag: false, note: 'A rental company’s official domain.' },
        visit: { flag: false, note: 'An in-person visit he booked.' },
        agent: { flag: false, note: 'A named agent he will meet.' },
        nopay: { flag: false, note: 'No money asked up front: a good sign.' } },
      why: 'A genuine visit confirmation: you see the flat before paying.', tip: 'Real rentals let you visit before you pay anything.' }
  ];

  var STORIES = [
    { id: 'case1', title: 'The Grandmother’s Prize', client: 'Arjun Mehta', role: 'Grandson of Kamala Mehta, 68', initial: 'A', lost: '₹24,999',
      story: 'My grandmother got a message saying she won a Diwali lucky draw. A few minutes later, ₹24,999 was gone from her account. She’s too upset to talk about it. Please find out what happened.',
      evidence: ['C1a', 'C1b', 'C1c'],
      questions: [
        { q: 'How did the money leave Kamala ji’s account?', options: ['She entered her UPI PIN on a payment request', 'Hackers broke into the bank', 'The bank charged a prize tax'], answer: 0,
          why: 'She approved the scammer’s collect request with her PIN. Entering a UPI PIN always sends money.' },
        { q: 'What should the family do first?', options: ['Pay the "release fee" so the prize arrives', 'Call 1930, report at cybercrime.gov.in and tell the bank', 'Wait a week to see if the prize comes'], answer: 1,
          why: 'Report quickly. The sooner the bank and police know, the better the chance of stopping the money.' } ],
      ending: 'Arjun helped his grandmother report the fraud the same day. The family now has a rule: no payments to strangers without a quick call first.',
      badge: 'Prize Patrol' },
    { id: 'case2', title: 'The Dream Job', client: 'Neha Sharma', role: 'College student, 20', initial: 'N', lost: '₹38,000',
      story: 'I found a part-time job that paid me for liking videos. I earned ₹150, then ₹600. Then I had to "deposit" money to unlock bigger tasks. Now my earnings are frozen and the group has blocked me.',
      evidence: ['C2a', 'C2b', 'C2c'],
      questions: [
        { q: 'What trick kept Neha paying more?', options: ['Her bank added hidden charges', 'Small early payouts built trust, then bigger deposits were demanded', 'The app had a technical bug'], answer: 1,
          why: 'Scammers pay small amounts first so the victim trusts them with bigger deposits.' },
        { q: 'Which rule would have protected her?', options: ['Only join groups with many members', 'Ask to see screenshots of other people’s earnings', 'Real jobs never ask you to pay to start or to withdraw'], answer: 2,
          why: 'Member counts and screenshots are easy to fake. Paying to work is always a red flag.' } ],
      ending: 'Neha reported the group at cybercrime.gov.in and now helps classmates spot task scams. She’s preparing for her college’s real placement drive.',
      badge: 'Job Guard' },
    { id: 'case3', title: 'The Video-Call Arrest', client: 'Mr. S. Iyer', role: 'Retired teacher, 71', initial: 'I', lost: '₹0 (his son stopped him in time)',
      story: 'I was told a parcel in my name had illegal items. A man in uniform on a video call said I was under "digital arrest" and must transfer my savings for verification. My son walked in just in time. Was it real?',
      evidence: ['C3a', 'C3b', 'C3c'],
      questions: [
        { q: 'Which claim proves the "inspector" is fake?', options: ['He knew Mr. Iyer’s name', '"Digital arrest": police never arrest anyone over a video call', 'He was wearing a uniform'], answer: 1,
          why: 'Names and uniforms are easy to fake. "Digital arrest" is not a real legal process.' },
        { q: 'What should anyone do on a call like this?', options: ['Hang up, tell family, and report it to 1930', 'Stay on the call and explain politely', 'Send a small amount to show cooperation'], answer: 0,
          why: 'Ending the call and talking to someone you trust breaks the scammer’s pressure.' } ],
      ending: 'Mr. Iyer reported the number to 1930. His savings are safe, and he now warns his walking group about "digital arrest" scams.',
      badge: 'Arrest Breaker' },
    { id: 'case4', title: 'The Stolen Account', client: 'Riya Kapoor', role: 'Content creator, 19', initial: 'R', lost: 'Her Pixgram account',
      story: 'I can’t get into my Pixgram account, and now "I" am messaging my friends asking for money! I didn’t give anyone my password. How did they get in?',
      evidence: ['C4a', 'C4b', 'C4c'],
      questions: [
        { q: 'How did the scammer get into Riya’s account?', options: ['Pixgram leaked her password', 'She typed her password on a fake login page, then shared her code', 'Her phone battery was low'], answer: 1,
          why: 'The fake page stole her password, and the shared code got past the extra check.' },
        { q: 'What should Riya do now?', options: ['Recover it in the official app, change her password and turn on two-step verification', 'Message the hacker and ask them to stop', 'Ignore it and make a new account'], answer: 0,
          why: 'Recovering through the official app and turning on two-step verification locks the scammer out.' } ],
      ending: 'Riya recovered her account through the official app, turned on two-step verification and warned her followers not to send money.',
      badge: 'Account Guardian' },
    { id: 'case5', title: 'The Flat That Never Was', client: 'Kabir Singh', role: 'Moving to a new city, 24', initial: 'K', lost: '₹15,000',
      story: 'I found a beautiful, cheap flat online. The owner said he was posted far away, so I paid a "token amount" to book it. The keys never came, and now his number is switched off.',
      evidence: ['C5a', 'C5b', 'C5c'],
      questions: [
        { q: 'What was the biggest warning sign?', options: ['The flat had nice photos', 'The owner replied quickly', 'Paying a token before seeing the flat or meeting the owner'], answer: 2,
          why: 'Photos and quick replies are normal. Paying before visiting is what let the scam work.' },
        { q: 'How should Kabir rent safely next time?', options: ['Pay a smaller token amount', 'Visit in person, check the owner’s documents, and pay only after signing an agreement', 'Only rent from owners who send ID photos'], answer: 1,
          why: 'Seeing the flat and the owner in person, with a written agreement, protects his money.' } ],
      ending: 'Kabir reported the fraud and found a real flat through a verified visit. He now checks every listing in person first.',
      badge: 'Home Hunter' }
  ];

  EVIDENCE.forEach(function (m) { C.MESSAGES.push(m); C.BY_ID[m.id] = m; });
  C.STORIES = STORIES;
  if (typeof module !== 'undefined' && module.exports) module.exports = STORIES;
})(this);
