/* ═══════════════════════════════════════════════════════════════════
   HARMOS · FIRST LIGHT — THE CHRONOLATTICE FILM
   chapters-data.js · v1.0 — the single source of truth
   Every chapter's narration, beat-by-beat, synced to animation cues.
   The engine reads this file. Nothing else hardcodes the story.
   ═══════════════════════════════════════════════════════════════════ */

const CL_FILM = {

  title:    "FIRST LIGHT",
  subtitle: "A film about the last unverified world",
  world:    "The ChronoLattice",
  countdownISO: "2027-06-22T00:00:00Z",   // the 300-day gate

  acts: [
    { id:"I",   name:"The Flood",   color:"#FF5A5F" },
    { id:"II",  name:"The Weapon",  color:"#44EDF7" },
    { id:"III", name:"The World",   color:"#F5B84A" },
    { id:"IV",  name:"The Future",  color:"#8FA8FF" }
  ],

  chapters: [

  /* ═════════════ ACT I · THE FLOOD ═════════════ */

  {
    id:"synthetic-dawn", n:1, act:0, title:"The Synthetic Dawn",
    kicker:"Where the world broke",
    scene:"swarm",
    beats:[
      { fx:"void-real",      text:"It began quietly." },
      { fx:"fracture",       text:"A photo that never happened. A voice cloned from three seconds of audio. A video call from a CFO who never existed — until a finance worker in Hong Kong wired $25 million to a ghost." },
      { fx:"stat-flood",     text:"Then the flood. Half a million synthetic files detected every month — only the ones caught. Five trillion dollars a year bleeding from the real economy into the fake one." },
      { fx:"stat-parcel",    text:"In Pakistan, nearly one in three cash-on-delivery parcels is refused at the door — the buyer bought from a ghost and knows it." },
      { fx:"stat-odo",       text:"Four hundred and fifty thousand cars a year in America alone roll back their odometers — and roll into families' driveways." },
      { fx:"stat-heart",     text:"Six hundred and fifty million dollars lost in a single year to lovers who never existed." },
      { fx:"swarm-turn",     text:"This is not a crime wave. This is a replacement wave — reality itself being re-rendered around you, transaction by transaction." },
      { fx:"real-pixel",     text:"You are standing at the edge of it. And somewhere in the noise, something real is waiting to be proven." }
    ],
    cfg:{ swarmCount:220, glitchRate:.35, realGlow:"#44EDF7" }
  },

  {
    id:"vanishing-witness", n:2, act:0, title:"The Vanishing Witness",
    kicker:"The defense we deleted",
    scene:"timeline",
    beats:[
      { fx:"era-ancient",    text:"Before this, we had a defense older than language." },
      { fx:"era-handshake",  text:"When two strangers traded, a third person watched. The elder at the well. The grandmother holding the gold bangles until both sides smiled. The notary. The witness — the oldest trust technology humanity ever built." },
      { fx:"era-screen",     text:"Then we built the internet: a city of five billion people. And in all that brilliance, we deleted the witness. We connected everyone — and verified no one. Every deal crossed a dark room." },
      { fx:"padlock-door",   text:"The padlock in your browser proved the shop was real. The car in the listing, the contract in the inbox, the delivery at the door — all of it lived outside the door, in the dark." },
      { fx:"drift-dark",     text:"The scammers didn't get smarter. The room just got darker." }
    ],
    cfg:{ eraCount:7, witnessColor:"#F5B84A", dissolveSpeed:1.6 }
  },

  /* ═════════════ ACT II · THE WEAPON ═════════════ */

  {
    id:"first-sealing", n:3, act:1, title:"The First Sealing",
    kicker:"Zerith's question",
    scene:"ignition",
    beats:[
      { fx:"question",       text:"The turn came when someone asked the right question:" },
      { fx:"ignite",         text:"What if the witness could be made of mathematics?" },
      { fx:"zerith",         text:"They called her Zerith — the First Witness. She pointed a phone at a single object and made the device itself testify." },
      { fx:"ring-attest",    text:"The chip swore the phone was real." },
      { fx:"ring-light",     text:"The camera swallowed a flash of light that existed for one second and could never be reconstructed afterward." },
      { fx:"ring-motion",    text:"The sensors recorded a living hand's natural tremor." },
      { fx:"ring-chain",     text:"Every frame was chained to the last by a fingerprint no computer on Earth can forge." },
      { fx:"seal",           text:"One moment. Sealed. Timeless. Returnable." },
      { fx:"sunrise",        text:"The forgers had spent twenty years learning to fake video. Zerith's moment wasn't video anymore. It was evidence — signed inside lattice mathematics, built to survive quantum computers. That was the first coordinate of a new world." }
    ],
    cfg:{ gridDepth:14, ringLabels:["ATTESTATION","LIGHT","MOTION","CHAIN"], sunriseSpeed:2.2 }
  },

  {
    id:"four-senses", n:4, act:1, title:"The Four Senses",
    kicker:"Guardians of realness",
    scene:"senses",
    beats:[
      { fx:"intro",          text:"Zerith's discovery became four guardians — the Senses, reborn in silicon." },
      { fx:"guardian-see",   text:"It Sees. The screen flashes a random pattern of light; the object must reflect it. A stolen video cannot reflect light that never existed." },
      { fx:"case-see",       text:"In practice: a \u201Clive factory tour\u201D from a supplier in another timezone — the flash exposes a recording made three weeks ago." },
      { fx:"guardian-hear",  text:"It Hears. Both phones emit a chirp above the range of human hearing — and must hear each other back." },
      { fx:"case-hear",      text:"In practice: the \u201Clocal agent\u201D assisting your house purchase is exposed as a relay when the room refuses to echo." },
      { fx:"guardian-feel",  text:"It Feels. A real hand trembles; the motion sensor knows the tremor, and the pixels must move with it, millisecond by millisecond. A rendered video has no hands. It has never held anything." },
      { fx:"case-feel",      text:"In practice: the walkaround video of a car whose camera motion is too perfect. Perfect is the confession." },
      { fx:"guardian-swear", text:"It Swears. When all three have testified, the tamper-proof chip at the heart of the phone signs the proof with a key even the phone's own operating system can never touch." },
      { fx:"converge",       text:"Four senses. Four verdicts." },
      { fx:"shatter",        text:"No forgery in history has passed all four — because to pass, it would have to actually exist." }
    ],
    cfg:{
      guardians:[
        {key:"see",  glyph:"👁", name:"IT SEES",  color:"#44EDF7", case:"factory replay · shatters at the flash"},
        {key:"hear", glyph:"👂", name:"IT HEARS", color:"#7FB8FF", case:"relay scammer · silent room betrays"},
        {key:"feel", glyph:"✋", name:"IT FEELS", color:"#8FA8FF", case:"too-smooth camera · perfect is the confession"},
        {key:"swear",glyph:"🔐", name:"IT SWEARS",color:"#E0AAFF", case:"silicon key · even the OS can't touch"}
      ]
    }
  },

  {
    id:"sixty-second-deal", n:5, act:1, title:"The Sixty-Second Deal",
    kicker:"One deal, in real time",
    scene:"deal60",
    beats:[
      { fx:"t00",  text:":00 — Two strangers meet over a used car, eleven hundred kilometers apart. Distrust is the default. It always was." },
      { fx:"t07",  text:":07 — Both phones join a session. Each chip attests: I am a real device, unmodified, with a real camera. Neither knows the other's name. Both know the other's hardware can't lie." },
      { fx:"t15",  text:":15 — The seller walks the camera around the car. The screen flashes its random pattern; the paint reflects light that did not exist a second ago. The hand's tremor is recorded beside the pixels' motion. A challenge code appears and is read aloud — audio and frame agree, to the millisecond." },
      { fx:"t38",  text:":38 — Every frame since :15 has been chained, fingerprint to fingerprint. Engine bay, chassis plate, odometer — each captured in sequence, each link welded to the last." },
      { fx:"t49",  text:":49 — The verdict assembles: liveness confirmed, presence confirmed, sequence unbroken. A Receipt is issued — anchored publicly, signed in post-quantum ink." },
      { fx:"t60",  text:":60 — The buyer releases payment through her own bank, on the proof. Total elapsed: one minute. Total doubt remaining: none that either party can name." },
      { fx:"close",text:"This is not the future of trust. This is trust, back on demand." }
    ],
    cfg:{
      markers:[
        {t:0,  label:":00", tag:"THE MEETING"},
        {t:7,  label:":07", tag:"ATTESTATION"},
        {t:15, label:":15", tag:"THE WALKAROUND"},
        {t:38, label:":38", tag:"THE CHAINING"},
        {t:49, label:":49", tag:"THE RECEIPT"},
        {t:60, label:":60", tag:"THE RELEASE"}
      ], heartbeat:true
    }
  },

  {
    id:"the-five", n:6, act:1, title:"The Five and Kaelith",
    kicker:"Doubt, employed",
    scene:"five",
    beats:[
      { fx:"question",   text:"But some lies aren't about objects. They're about judgment — is this contract safe? is this diagnosis sound? is this audit honest?" },
      { fx:"dispatch",   text:"For these, sensors alone are not enough. So the network did something radical: it made doubt itself an employee." },
      { fx:"isolate",    text:"Every high-stakes decision goes to The Five — certified experts on at least two continents, working in total isolation. They never meet. They never see each other's answers. Their independence isn't a rule they follow; it's the architecture they exist inside." },
      { fx:"kaelith",    text:"Then comes Kaelith, the Adversary — an artificial intelligence with one job description: destroy this verdict before the client ever sees it. Kaelith attacks every conclusion, hunts every assumption, argues the opposite with citations. It is paid to disagree. It has never once been congratulated." },
      { fx:"survive",    text:"A decision that survives five strangers and one professional enemy is not a promise. It's a probability you can hold — confidence written on its face, dissenting opinions published in full." },
      { fx:"capture",    text:"And if you ever wonder whether the Five coordinated: if their answers come back byte-identical, the system doesn't celebrate. It raises the alarm. Five humans who never met never write the same report. Identical isn't consensus. Identical is capture." }
    ],
    cfg:{ panelCount:5, continents:2, adversaryColor:"#FF5A5F", verdictColor:"#F5B84A", captureTest:true }
  },

  {
    id:"the-receipt", n:7, act:1, title:"The Receipt",
    kicker:"Truth with a serial number",
    scene:"receipt",
    beats:[
      { fx:"assemble-open", text:"When the senses, the Five, and the Adversary are done, something remains. Not a video. Not a PDF. Not a promise." },
      { fx:"layer-media",     text:"The Receipt — the artifact at the heart of everything." },
      { fx:"layer-sensors",   text:"It carries the sealed media, the sensor seals," },
      { fx:"layer-consensus", text:"the Five's confidence score, the Adversary's scars," },
      { fx:"layer-anchor",    text:"the exact timestamp, and a public anchor anyone on Earth can independently verify." },
      { fx:"layer-pq",        text:"Signed in post-quantum ink. Engineered to be readable in fifty years by machines that don't exist yet." },
      { fx:"sweep",           text:"It never says \u201Ctrust us.\u201D It says: check me yourself." },
      { fx:"wall",            text:"Courts understand it. Blockchains carry it. Grandchildren will inherit it. This is what we sell. Not feelings about truth. Truth with a serial number." }
    ],
    cfg:{ layers:["MEDIA","SENSORS","CONSENSUS","ANCHOR","PQ-SIGNATURE"], dial:"50 YEARS" }
  },

  /* ═════════════ ACT III · THE WORLD ═════════════ */

  {
    id:"two-lanes", n:8, act:2, title:"Noorish, Between Two Lanes",
    kicker:"The economy of honesty",
    scene:"lanes",
    beats:[
      { fx:"meet",     text:"Meet Noorish. A student. Not so different from you." },
      { fx:"use-lane", text:"In one lane of her life, she uses the network — a few dollars a month to have her freelance contracts stress-tested before she signs away her evenings." },
      { fx:"earn-lane",text:"In the other lane, she powers it — between classes, her phone becomes a node: she verifies deliveries, confirms presence, labels reality. The network pays her through the rails of her own city, in the money of her own street." },
      { fx:"both",     text:"One person. Two lanes. Paying for truth with one hand, earning from it with the other." },
      { fx:"multiply", text:"Multiply her by a city. By a continent. Every phone a micro-witness; every verified moment a little more light in the room — and every payment published on-chain, auditable by anyone alive." },
      { fx:"ledger",   text:"Seventy percent of every fee flows to the people doing the witnessing. Not because we're generous. Because it's checkable — every payout, every time, forever." },
      { fx:"close",    text:"That's not a subscription model. That's an economy of honesty." }
    ],
    cfg:{ currencies:["\u20A8","KSh","\u20B9","AED","$","\u20A6"], split:70 }
  },

  {
    id:"seventy-worlds", n:9, act:2, title:"The Seventy Worlds",
    kicker:"Every world named",
    scene:"worlds",
    beats:[
      { fx:"open",        text:"Truth is not one industry. So the network is not one network — it is seventy worlds, each a specialist pool with its own certified witnesses, its own machine senses, its own hard-earned trust." },
      { fx:"arm-core",    text:"The Core Eighteen hold civilization's foundations: Legal, where contracts are stress-tested. Health, where credentials and billing integrity are proven. Finance. Energy. Forensics. The deep infrastructure everything else stands on." },
      { fx:"arm-everyday",text:"The Seven Markets of Everyday Life are where ordinary people meet fraud face to face: Autos. Travel. Weddings. E-Commerce. The deals of the weekly grind." },
      { fx:"arm-luxury",  text:"The Seventeen Houses of Rare Value guard what must never be faked: Fine Art. Watches. Gems. Falconry. Classic Cars — objects whose forgery is a craft older than nations." },
      { fx:"arm-industry",text:"And the Twenty-Eight Corridors of Industry run the world's quiet commerce: Carbon. Machinery. Marine. Pharma. Timber. Water — where a single forged document moves millions." },
      { fx:"explore",     text:"Seventy names. Seventy specializations. Touch any world to see what it verifies." },
      { fx:"exile",       text:"And one law unites them all: fraud anywhere is exile everywhere. Flee the autos market, reappear in luxury watches — the network remembers the device. The ghosts can change shops." },
      { fx:"exile-2",     text:"They cannot change their fingerprints." }
    ],
    cfg:{ interactive:true, armColors:{core:"#44EDF7",everyday:"#F5B84A",luxury:"#E0AAFF",industry:"#7FB8FF"} }
  },

  {
    id:"giants", n:10, act:2, title:"The Giants and the Street",
    kicker:"Names already on the street",
    scene:"globe",
    beats:[
      { fx:"open",     text:"This is not a dream for someday. The street already has names on it." },
      { fx:"karachi",  text:"In Karachi and Lahore, the marketplaces where one in three parcels comes back refused wire in the Release Signal — and refusal rates collapse, because the parcel now carries proof before it carries COD." },
      { fx:"dubai",    text:"In Dubai, an off-plan apartment's token money sits safe: the installment releases only when a drone-verified foundation milestone lands on-chain. In the Gold Souk, a forty-thousand-dirham watch trades hands with a Receipt welded to it forever." },
      { fx:"texas",    text:"In Texas, a buyer releases funds for a '69 Camaro she has never touched — because the chassis, the odometer, and the seller's presence all verified first." },
      { fx:"corridor", text:"On the China–US corridor, where buyers today trust a photograph and inspectors cost hundreds of dollars per sample — every handover, every container seal, verified live, for dollars." },
      { fx:"layer",    text:"And for the giants already proving parts of this world — the payment networks, the attestation standards, the blockchains — we are not the rival. We are the layer they were missing. Their rails. Our proof." }
    ],
    cfg:{
      corridors:[
        {from:"Karachi",  to:"Lahore",  vignette:"COD parcel glows green on delivery"},
        {from:"Dubai",    to:"Dubai",   vignette:"drone verifies the foundation pour"},
        {from:"Texas",    to:"Michigan",vignette:"chassis plate scans \u00B7 presence verified"},
        {from:"Guangzhou",to:"Ohio",    vignette:"container seal hashes at both ends"}
      ]
    }
  },

  {
    id:"grid-lights-up", n:11, act:2, title:"The Grid Lights Up",
    kicker:"Phases with gates, not hype",
    scene:"grid",
    beats:[
      { fx:"open",   text:"How does a network of witnesses get built? The same way every great thing has ever been built: in phases, with gates, and no shortcuts." },
      { fx:"p0",     text:"Phase Zero — the first proof is sold by hand. Seven days. One founder, one phone, real clients paying real money for real verification. The point is not the revenue. The point is the answer to the only question that matters: do people pay for truth? Gate: ten paid jobs." },
      { fx:"p1",     text:"Phase One — the app ships. Two-dollar certificates. The Four Senses in every pocket. Three worlds only — Autos, Legal, E-Commerce — because a grid built wide before it's built true is just more darkness. Gate: five hundred paid verifications, and an accuracy benchmark published publicly." },
      { fx:"p2",     text:"Phase Two — the witnesses join. The Five convene. The payout ledger goes public. Marketplaces plug in the Release Signal, and money moves only when proof arrives. Gate: one marketplace live, one thousand witnesses earning." },
      { fx:"p3",     text:"Phase Three — the grid. Continental sovereignty. Arbitration at civilization scale. All seventy worlds open. Gate: enterprise contracts." },
      { fx:"law",    text:"Every phase has a gate, and every gate has a number. No phase opens on hope. No phase opens on hype. The grid lights up exactly as fast as it earns the right to." }
    ],
    cfg:{ meters:true, gateEngrave:true }
  },

  {
    id:"the-promise", n:12, act:2, title:"The Promise",
    kicker:"Who holds the money? Not us.",
    scene:"moneyflow",
    beats:[
      { fx:"question", text:"Now, the question every serious person asks: who holds the money?" },
      { fx:"around",   text:"The answer is the reason this network will outlive its imitators: we don't." },
      { fx:"rails",    text:"Not a rupee, not a dirham, not a dollar of client money ever touches us. When a marketplace uses our signal, their bank moves their money on our proof. We are the referee — and referees don't score goals, don't hold the purse, and don't bet on the teams." },
      { fx:"signal",   text:"The promise to every witness — seventy percent of every fee — is not enforced by our good character. It's enforced by publicity: every payout published, anchored, auditable by anyone alive." },
      { fx:"lever",    text:"No vaults to rob. No promises to break. No founder anywhere in the system with the power to overturn a verdict — not even the founder." },
      { fx:"close",    text:"Neutrality isn't our value. It's our architecture." }
    ],
    cfg:{ leverShatter:true, ledgerTicker:true }
  },

  {
    id:"honesty", n:13, act:2, title:"The Care Layer and the Limits",
    kicker:"What we cannot do, told first",
    scene:"honesty",
    beats:[
      { fx:"open",    text:"Here is the part most companies hide, told first instead of last." },
      { fx:"limits",  text:"What we cannot do. Physics proves events and visible state — never ownership, never what's hidden inside metal, never a coerced smile. Our accuracy is a published number, not a slogan: roughly ninety-five to ninety-nine percent against opportunistic fraud — benchmark and method published quarterly, red-teamed by outsiders who are paid to break us." },
      { fx:"refund",  text:"What we owe you when we err. A refund of three times the fee, capped, contractual — a guarantee sized to be always honorable rather than impressively large. And when the real thing is needed, a licensed insurer stands behind Phase Three." },
      { fx:"care",    text:"What stands beside the machine. The Care Layer — human beings, dispute windows with visible deadlines, a duress PIN for the moment a phone is taken, seventy-two-hour identity recovery, and an appeal that summons five fresh witnesses for two percent of the fee, refunded if they overturn the first five." },
      { fx:"moat",    text:"A company that admits its boundaries is a company you can trust with your deals. The forgers must over-promise to compete with us." },
      { fx:"shatter", text:"We made honesty the competitive position. This page is the moat." }
    ],
    cfg:{
      ledgerEntries:[
        "accuracy \u00B7 published, quarterly, red-teamed",
        "hidden defects \u00B7 cannot see",
        "coercion \u00B7 cannot detect",
        "errors \u00B7 refunded 3\u00D7 the fee",
        "appeals \u00B7 2% \u00B7 refunded if overturned",
        "duress PIN \u00B7 always on",
        "recovery \u00B7 72 hours"
      ],
      competitorClaim:"100% GUARANTEED"
    }
  },

  /* ═════════════ ACT IV · THE FUTURE ═════════════ */

  {
    id:"quantum-mask", n:14, act:3, title:"The Quantum Mask",
    kicker:"The enemy's next generation",
    scene:"quantummask",
    beats:[
      { fx:"open",     text:"Here is what keeps us up at night — and why it shouldn't keep you up." },
      { fx:"gen1",     text:"The Synthetic is evolving. Gen-1 was replay — yesterday's video sold as today." },
      { fx:"gen2",     text:"Gen-2 is the deepfake — a face that never existed, speaking in a cloned voice." },
      { fx:"gen3",     text:"Gen-3 is already visible on the horizon: the quantum mask — forgeries built to break the cryptographic locks most of the world still relies on." },
      { fx:"lunge",    text:"Most of the world. Not this network." },
      { fx:"interlock",text:"Every Receipt ever issued here is signed in post-quantum ink — lattice-based mathematics from the same family of proofs quantum computers themselves cannot crack." },
      { fx:"crack",    text:"While others race to patch, we were sealed before the race began." },
      { fx:"close",    text:"We don't wait for the enemy's next generation. We ship ours first." }
    ],
    cfg:{ molt:["REPLAY","DEEPFAKE","GEN-3 ?"], latticeCloseup:true }
  },

  {
    id:"time-travelers-oath", n:15, act:3, title:"The Time Traveler's Oath",
    kicker:"The future, honestly labeled",
    scene:"vault",
    beats:[
      { fx:"open",      text:"And now the future we're building toward — the part that sounds like science fiction, so we label it as honestly as we label everything." },
      { fx:"corridor",  text:"A world where you can return to any verified moment — five years from now, walk back to the second a deal was sealed, and find it still provably real. That is the Time Vault: every coordinate, glass-sealed, permanent." },
      { fx:"zk",        text:"A world of zero-knowledge proofs — the network proves the mango is genuine without ever opening the box. A doctor proves she is licensed without revealing her patients. You prove you know, without ever telling." },
      { fx:"zkml",      text:"And one day, an AI that can prove it reasoned honestly without exposing a single thought. That one is horizon. We will tell you when it's not." },
      { fx:"countdown", text:"The gate to this future is already counting down. Three hundred days. Every second of it, publicly verifiable." }
    ],
    cfg:{ yearsBack:["2031","2029","2026"], caveRounds:3 }
  },

  {
    id:"first-coordinate", n:16, act:3, title:"The First Coordinate Is Yours",
    kicker:"The oath",
    scene:"cta",
    beats:[
      { fx:"recap",  text:"Which brings us to you." },
      { fx:"recap2", text:"You arrived at the edge of the flood. You've seen what the Synthetic took — and what mathematics gave back: the Senses, the Sixty-Second Deal, the Five and the Adversary, the Receipt. Noorish paying and earning. Seventy worlds, all named, all opening. The grid lighting itself honestly. The money never touching us. The limits we publish first. The future sealed against the future." },
      { fx:"unlit",  text:"There is exactly one thing left in this story without a holder: the next coordinate." },
      { fx:"yours",  text:"It doesn't belong to us. It belongs to the first person who decides their next deal — their car, their contract, their delivery, their word — deserves a witness again." },
      { fx:"wait",   text:"The grid is waiting. The vault is open. The countdown is running." },
      { fx:"oath",   text:"Sealing begins the moment you do." }
    ],
    cfg:{ oathHold:2.4, chargeFlashback:true }
  }
  ]
};

/* ═════════════════════════════════════════════════════
   THE SEVENTY WORLDS — every world named, with its
   micro-legend (what it verifies). Used by Chapter 9
   and the seventy-worlds.html chapter page.
   ═════════════════════════════════════════════════════ */

const SEVENTY_WORLDS = {

  core: { label:"The Core Eighteen", color:"#44EDF7", worlds:[
    {n:"Protocol",    v:"routes tasks \u00B7 runs consensus \u00B7 the street's law"},
    {n:"Telecom",     v:"signal logs \u00B7 tower zoning"},
    {n:"Legal",       v:"contracts \u00B7 clause risk \u00B7 stress-tested opinions"},
    {n:"Manufacturing",v:"CAD stress \u00B7 materials \u00B7 supply chain"},
    {n:"Cyber",       v:"pen-tests \u00B7 phishing \u00B7 ransomware playbooks"},
    {n:"Veterans",    v:"service records \u00B7 credentials for civilian work"},
    {n:"Agriculture", v:"yields \u00B7 soil \u00B7 climate ground truth"},
    {n:"Real Estate", v:"zoning \u00B7 construction milestones \u00B7 title"},
    {n:"Finance",     v:"audits \u00B7 quant risk \u00B7 flash-loon forensics"},
    {n:"Education",   v:"thesis validation \u00B7 plagiarism \u00B7 peer review"},
    {n:"Logistics",   v:"freight rerouting \u00B7 maritime \u00B7 carbon routes"},
    {n:"Media",       v:"IP timestamps \u00B7 script originality"},
    {n:"Energy",      v:"grid stability \u00B7 renewables yield"},
    {n:"Spatial",     v:"computer vision \u00B7 imaging precision"},
    {n:"IoT",         v:"firmware security \u00B7 smart-city sensors"},
    {n:"Forensics",   v:"deepfake detection \u00B7 chain of custody"},
    {n:"Health",      v:"credentials \u00B7 billing integrity \u00B7 admin scope"},
    {n:"Supreme",     v:"cross-domain arbitration \u00B7 the hardest calls"}
  ]},

  everyday: { label:"The Everyday Seven", color:"#F5B84A", worlds:[
    {n:"E-Commerce", v:"COD parcels \u00B7 return verification"},
    {n:"Autos",      v:"chassis \u00B7 odometer \u00B7 presence"},
    {n:"Travel",     v:"hotel condition \u00B7 escrow milestones"},
    {n:"Weddings",   v:"vendor milestones \u00B7 no-show proof"},
    {n:"Blue-Collar",v:"wage protection \u00B7 gig verification"},
    {n:"Dining",     v:"hygiene \u00B7 discount honoring"},
    {n:"Electronics",v:"refurbished grading \u00B7 serial chains"}
  ]},

  luxury: { label:"The Houses of Rare Value", color:"#E0AAFF", worlds:[
    {n:"Yachts",       v:"hull integrity \u00B7 charter records"},
    {n:"Private Jets", v:"maintenance log oracles"},
    {n:"Fine Art",     v:"provenance \u00B7 brushstroke topology"},
    {n:"Hypercars",    v:"matching numbers \u00B7 build sheets"},
    {n:"Watches",      v:"movement micro-geometry \u00B7 the golden receipt"},
    {n:"Bloodstock",   v:"DNA lineage \u00B7 veterinary history"},
    {n:"Gems",         v:"spectral signature \u00B7 lab-grown detection"},
    {n:"Numismatics",  v:"acoustic ping \u00B7 micro-wear"},
    {n:"Islands",      v:"title escrow \u00B7 mandate proof"},
    {n:"Armored",      v:"ballistic glass \u00B7 batch hashes"},
    {n:"Classic Cars", v:"VIN metallurgy \u00B7 restoration proof"},
    {n:"Handbags",     v:"stitch-count \u00B7 hardware provenance"},
    {n:"Instruments",  v:"wood-ring dating \u00B7 acoustic fingerprint"},
    {n:"Antiquities",  v:"looted-art registry \u00B7 erosion dating"},
    {n:"Falconry",     v:"microchip \u00B7 veterinary hash"},
    {n:"Sneakers",     v:"sole topology authentication"},
    {n:"Vintage",      v:"fabric \u00B7 hardware \u00B7 era proof"}
  ]},

  industry: { label:"The Corridors of Industry", color:"#7FB8FF", worlds:[
    {n:"Carbon",     v:"satellite + LiDAR ground truth"},
    {n:"Litigation", v:"litigation-finance case risk"},
    {n:"Franchise",  v:"FDD \u00B7 territory verification"},
    {n:"Machinery",  v:"engine-hour memory \u00B7 the metal remembers"},
    {n:"MedEquip",   v:"used MRI/CT grading"},
    {n:"Mining",     v:"concessions \u00B7 core-sample audits"},
    {n:"Minerals",   v:"rare earths \u00B7 dilution detection"},
    {n:"Timber",     v:"illegal-logging detection"},
    {n:"Water",      v:"water rights \u00B7 desalination contracts"},
    {n:"Spectrum",   v:"tower lease verification"},
    {n:"DataCenter", v:"SLA \u00B7 uptime audits"},
    {n:"Robotics",   v:"automation fleet condition"},
    {n:"Rotor",      v:"helicopter \u00B7 eVTOL fatigue logs"},
    {n:"Marine",     v:"hull \u00B7 engine logs"},
    {n:"Claims",     v:"verified signals \u00B7 to licensed insurers"},
    {n:"Pharma",     v:"clinical trial data integrity"},
    {n:"Estates",    v:"coffee \u00B7 cacao origin proof"},
    {n:"ModelIP",    v:"AI model weights provenance"},
    {n:"Hospitality",v:"management contract audits"},
    {n:"Overland",   v:"RV \u00B7 motorhome condition"},
    {n:"Secondaries",v:"PE secondary NAV checks"},
    {n:"SolarFin",   v:"renewable project yield verification"},
    {n:"Livestock",  v:"ear-tag \u00B7 health and weight proof"},
    {n:"Produce",    v:"mandi grading at handover"},
    {n:"Creator",    v:"influencer metric verification"},
    {n:"Digital",    v:"domain appraisal \u00B7 asset proof"},
    {n:"Esports",    v:"franchise \u00B7 viewership audits"},
    {n:"Endowment",  v:"grant allocation oversight"}
  ]}
};

/* ═══ shared config ═══ */
const CL_SHARED = {
  logo: "assets/img/harmos.png",
  logoTransparent: "assets/img/harmos-transparent.png",
  palette: { void:"#070818", panel:"#0C1022", violet:"#8FA8FF", cyan:"#44EDF7",
             gold:"#F5B84A", red:"#FF5A5F", ivory:"#F4F1E8", lux:"#E0AAFF", blue:"#7FB8FF" },
  footer: "\u00A9 2026 Harmos \u2014 the honest third person, back in every pocket"
};

/* expose */
window.CL_FILM = CL_FILM;
window.SEVENTY_WORLDS = SEVENTY_WORLDS;
window.CL_SHARED = CL_SHARED;
