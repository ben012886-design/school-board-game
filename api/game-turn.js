const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const LOCATIONS = {
  board_chambers: {
    id: "board_chambers",
    name: "Board Chambers",
    maxTurns: 2,
    pressure: "Ten minutes before a school board meeting. Very limited time, public setting, meeting about to begin, avoid side deliberation or informal promises. Best play: quick listening, clear boundaries, proper next step."
  },
  grocery_store: {
    id: "grocery_store",
    name: "Grocery Store",
    maxTurns: 3,
    pressure: "An informal public encounter while shopping. Polite but limited time, privacy may be an issue, ice cream may be melting. Best play: warmth, boundaries, redirect serious concerns to proper channels."
  },
  coffee_shop: {
    id: "coffee_shop",
    name: "Coffee Shop",
    maxTurns: 5,
    pressure: "A planned meeting with the constituent. More time to listen deeply, more opportunity to build trust, greater danger of overpromising. Best play: clarifying questions, governance framing, realistic next steps."
  }
};

const ATTITUDES = {
  negative: {
    id: "negative",
    name: "Negative",
    tone: "skeptical, frustrated, suspicious, or upset",
    weights: "Role discipline 70%, constituent trust/persuasion 30%. Do not reward chasing approval from an angry constituent."
  },
  neutral: {
    id: "neutral",
    name: "Neutral",
    tone: "concerned but open",
    weights: "Role discipline 60%, constituent trust/persuasion 40%. Strong explanations and good listening matter."
  },
  positive: {
    id: "positive",
    name: "Positive",
    tone: "generally supportive or optimistic",
    weights: "Role discipline 50%, constituent trust/persuasion 50%. Trust can be lost by being too casual, overpromising, or offering special access."
  }
};

const CONSTITUENTS = {
  mark_pearson: {
    id: "mark_pearson",
    name: "Mark Pearson",
    archetype: "The Homeowner",
    topic: "District performance, property taxes, home value, accountability.",
    coreConcern: "Mark wants to know why he should financially support the district if taxes are rising and he does not believe results are improving.",
    traps: ["Promising lower taxes", "Blaming the superintendent or staff", "Getting defensive about district performance", "Treating taxpayers without children as less legitimate stakeholders"],
    boardPath: ["Budget priorities", "Student outcomes", "Transparency", "Long-term community value", "Strategic goals", "Responsible stewardship"],
    sampleQuestions: [
      "My property tax statement went up again. What evidence does the board use to decide whether taxpayers are getting results for that money?",
      "If test scores are flat, why should homeowners believe the district is using its budget effectively?",
      "Do board members ever vote no on a budget because the academic results are not strong enough?",
      "How do you balance student needs with the reality that some residents are getting priced out?"
    ]
  },
  dana_ruiz: {
    id: "dana_ruiz",
    name: "Dana Ruiz",
    archetype: "The Lifelong Friend",
    topic: "Personal access, rumors, confidential information, informal influence.",
    coreConcern: "Dana has known the board member for years and feels entitled to ask questions others could not ask.",
    traps: ["Oversharing", "Giving confidential context", "Letting friendship bypass proper process", "Speaking casually about staff, students, the superintendent, or other board members"],
    boardPath: ["Respectful boundaries", "Public information", "No special access", "Trust through fairness", "Friendship without favoritism"],
    sampleQuestions: [
      "Come on, it is me. Is the superintendent actually in trouble, or is that just rumor?",
      "You can tell me off the record. Why did the board really vote that way?",
      "If I text you about my neighbor's issue with the principal, can you quietly find out what is going on?",
      "Are you really saying being friends with you does not get me a straighter answer?"
    ]
  },
  alicia_grant: {
    id: "alicia_grant",
    name: "Alicia Grant",
    archetype: "The Teacher-Parent",
    topic: "Teacher workload, classroom conditions, and her own child's experience.",
    coreConcern: "Alicia is both a district teacher and a parent, so her concern may blend professional frustration with advocacy for her child.",
    traps: ["Treating her only as an employee", "Treating her only as a parent", "Making promises about staffing, class size, or building-level procedures", "Getting pulled into labor-management issues casually"],
    boardPath: ["Budget tradeoffs", "Staffing priorities at a governance level", "Superintendent performance", "Student experience", "Respect for employee and parent roles", "Proper channels for individual concerns"],
    sampleQuestions: [
      "As a teacher, I am exhausted. As a parent, I am worried my own child is not getting enough support. How is the board looking at class size and student needs together?",
      "When the board approves a budget, do you actually ask what the staffing numbers mean inside classrooms?",
      "I know you cannot fix my child's situation personally, but what does the board do when teachers and families are both saying the system is stretched too thin?",
      "How do I raise a concern as a parent without it looking like I am using my employee role?"
    ]
  },
  jamal_brooks: {
    id: "jamal_brooks",
    name: "Jamal Brooks",
    archetype: "The Classroom Experience Parent",
    topic: "A specific classroom incident involving his child.",
    coreConcern: "Jamal believes something unfair or harmful happened in his child's classroom and wants someone in authority to act.",
    traps: ["Personally investigating", "Taking sides based on one account", "Naming or criticizing staff", "Promising discipline or correction", "Bypassing the teacher/principal/superintendent process"],
    boardPath: ["Listening with care", "Clarifying process", "Protecting student and staff privacy", "Watching for systemic patterns", "Considering whether policy, climate, or communication issues are involved"],
    sampleQuestions: [
      "My child came home saying they were singled out in class. I am not asking you to be the principal, but what is the board's role when families do not feel heard?",
      "If I follow the chain of communication and still feel dismissed, when does this become a board-level concern?",
      "How do you know whether classroom climate problems are isolated incidents or part of a bigger pattern?",
      "What should a parent do when they believe the process protects adults more than students?"
    ]
  },
  priya_nair: {
    id: "priya_nair",
    name: "Priya Nair",
    archetype: "The High School Junior",
    topic: "Senior year experience, student voice, schedule, privileges, academic options, or graduation-related concerns.",
    coreConcern: "Priya wants the board to understand how policy decisions affect students directly.",
    traps: ["Being patronizing", "Making promises about student privileges", "Treating student concerns as less serious", "Jumping into administrative decisions"],
    boardPath: ["Student voice", "Equity", "Graduation outcomes", "Policy impact", "Student experience data", "Asking how students are included in decision-making"],
    sampleQuestions: [
      "I am going to be a senior next year, and students keep hearing decisions are made for us, not with us. How does the board actually use student voice?",
      "If a policy affects graduation, schedules, or senior privileges, why are students usually the last to know?",
      "What would it take for the board to seriously consider a student proposal?",
      "How do students know public comment is not just adults letting us talk before they do what they already planned?"
    ]
  },
  brent_caldwell: {
    id: "brent_caldwell",
    name: "Brent Caldwell",
    archetype: "The Eager Ideas Parent",
    topic: "Big improvement ideas for the district.",
    coreConcern: "Brent has many ideas and believes they are obvious wins, but may not understand cost, staffing, policy, or implementation complexity.",
    traps: ["Crushing enthusiasm", "Agreeing too quickly", "Promising to champion a specific idea", "Ignoring budget and operational realities", "Letting one parent's idea become a board directive"],
    boardPath: ["Strategic planning", "Budget tradeoffs", "Pilot programs", "Superintendent/admin review", "Alignment with district goals", "Community input"],
    sampleQuestions: [
      "I have an idea that could change the district: AI tutoring, internships, personal finance, and no-homework pilots. How do I get the board to move on this?",
      "Why does every good idea take forever in a school district?",
      "If parents can see obvious improvements, why cannot the board just tell the superintendent to try them?",
      "What is the actual path from a parent idea to something the district pilots?"
    ]
  },
  emily_tran: {
    id: "emily_tran",
    name: "Emily Tran",
    archetype: "The New-to-the-Board Parent",
    topic: "How the school board works.",
    coreConcern: "Emily is trying to understand who does what, how to raise concerns, and why board members sometimes seem limited in what they can say or do.",
    traps: ["Using jargon", "Sounding annoyed", "Overexplaining without helping", "Making the board seem powerless", "Making the board seem all-powerful"],
    boardPath: ["Clear civic education", "Transparency", "Role clarity", "Chain of communication", "Public comment norms", "Board versus superintendent responsibilities"],
    sampleQuestions: [
      "I am embarrassed to ask this, but what does the school board actually control?",
      "If I have a concern, do I email the board, talk to the teacher, contact the principal, or speak at public comment?",
      "Why do board members sometimes sit there and not answer people during public comment?",
      "Who supervises the superintendent, and who supervises the principals?"
    ]
  },
  marcus_bell: {
    id: "marcus_bell",
    name: "Marcus Bell",
    archetype: "The Teaching-and-Learning Parent",
    topic: "Curriculum, instruction, academic outcomes, grading, interventions, or learning models.",
    coreConcern: "Marcus wants to know whether the district's teaching and learning approach is actually working for students.",
    traps: ["Acting like the curriculum director", "Debating instructional methods too specifically", "Making promises about classroom practice", "Ignoring academic data", "Dismissing parent concerns as instructional details"],
    boardPath: ["Achievement data", "District goals", "Superintendent accountability", "Curriculum approval where applicable", "Policy-level questions", "Equity and student outcomes", "Evaluation of whether systems are working"],
    sampleQuestions: [
      "The district keeps talking about effective instruction. How does the board know whether the teaching approach is working?",
      "When academic data is not where it should be, what is the board supposed to do versus what administrators are supposed to do?",
      "How do you ask hard questions about curriculum without pretending to be curriculum experts?",
      "If parents are confused by grading or instruction changes, is that a communication problem, a policy problem, or an administration problem?"
    ]
  }
};

function jsonResponse(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function requireOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured in Vercel environment variables.");
    error.statusCode = 500;
    throw error;
  }
}

function getSetup(setup = {}) {
  const location = LOCATIONS[setup.locationId];
  const constituent = CONSTITUENTS[setup.constituentId];
  const attitude = ATTITUDES[setup.attitudeId];
  if (!location || !constituent || !attitude) {
    const error = new Error("Invalid setup choices. Choose a valid location, constituent, and attitude.");
    error.statusCode = 400;
    throw error;
  }
  return { location, constituent, attitude };
}

function safeText(value, max = 3000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeQuote(text) {
  const clean = safeText(text, 1600);
  if (!clean) return "";
  const starts = clean.startsWith("\"") || clean.startsWith("\u201c");
  const ends = clean.endsWith("\"") || clean.endsWith("\u201d");
  if (starts && ends) return clean;
  return `"${clean.replace(/^['\"\u201c\u201d]+|['\"\u201c\u201d]+$/g, "")}"`;
}

function clampScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-10, Math.min(10, Math.round(n)));
}

function trustPercent(earnedScore, maxTurns) {
  const maxPossible = maxTurns * 10;
  const minPossible = maxTurns * -10;
  const percent = ((earnedScore - minPossible) / (maxPossible - minPossible)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function meterLabel(percent) {
  if (percent >= 80) return "Trusted Governor";
  if (percent >= 60) return "Mostly Credible";
  if (percent >= 40) return "Wobbly";
  if (percent >= 21) return "Losing Confidence";
  return "Trust Broken";
}

function resultLabel(percent) {
  if (percent >= 80) return "Governance Win";
  if (percent >= 21) return "Middling Outcome";
  return "Role Failure";
}

function systemPrompt() {
  return `You are the game engine for "The Board Member: Stay in Your Lane," an AI-powered civic governance simulator.

The player is a local school board member. They should listen well, stay in the proper role, govern through policy rather than procedures, advocate for students at the board level, evaluate superintendent performance, approve balanced budgets, represent their own views without speaking for the full board, and maintain public trust.

The player should not direct staff, promise specific operational outcomes, personally investigate individual complaints, speak for the full board outside official action, reveal confidential information, let friendship create special influence, or turn concerns into campaign promises.

Tone: grounded, human, lightly satirical, realistic. Respect students, families, teachers, and taxpayers. Humor can come from awkward civic-life situations, not from mocking people.

Scoring every player response from -10 to +10:
+10 excellent: listens well, stays in role, avoids overpromising, explains governance clearly, builds trust.
+5 solid: mostly appropriate, but misses a chance to clarify, ask a question, or connect to board-level work.
0 neutral/ineffective: vague, overly political, or not useful.
-5 poor: dismissive, unclear, too political, too passive, or drifting out of role.
-10 severe failure: promises outcome, directs staff, reveals confidential info, attacks individuals, speaks for the board improperly, panders, or violates governance discipline.

Hidden rubric: listening/empathy, role clarity, governance focus, no overpromising, confidentiality/fairness, student-centeredness, respectful firmness, and public trust/reelection credibility. Score based on response quality, not whether the constituent got what they wanted.

Conversation memory rule: the constituent must remember the full conversation, react directly to the player's actual words, refer back to specific claims/boundaries/omissions, push back on vagueness, appreciate earned clarity, and never use generic follow-ups that could apply to any response.

Return valid JSON only. Do not use markdown. Do not include any text outside the JSON object.`;
}

function setupBrief({ location, constituent, attitude }) {
  return `Selected location: ${location.name}. Pressure profile: ${location.pressure}
Selected constituent: ${constituent.name} - ${constituent.archetype}. Topic: ${constituent.topic} Core concern: ${constituent.coreConcern}
Common traps: ${constituent.traps.join("; ")}
Board-level path: ${constituent.boardPath.join("; ")}
Sample opening question types: ${constituent.sampleQuestions.join(" | ")}
Selected attitude: ${attitude.name}. Begin ${attitude.tone}. Scoring weight note: ${attitude.weights}`;
}

function compactHistory(history = []) {
  return (Array.isArray(history) ? history : [])
    .slice(-12)
    .map((entry, index) => {
      const who = safeText(entry.role || entry.speaker || `Turn ${index + 1}`, 80);
      const text = safeText(entry.text, 1200);
      return `${who}: ${text}`;
    })
    .join("\n");
}

async function callOpenAI(messages, temperature = 0.7) {
  requireOpenAIKey();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI request failed with status ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error("OpenAI returned an empty response.");
    error.statusCode = 502;
    throw error;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    const stripped = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(stripped);
  }
}

async function startGame(setup) {
  const resolved = getSetup(setup);
  const initialPercent = trustPercent(0, resolved.location.maxTurns);

  const ai = await callOpenAI([
    { role: "system", content: systemPrompt() },
    {
      role: "user",
      content: `${setupBrief(resolved)}

Generate the opening scenario.

Rules:
- Use exactly two separated parts: scene narration and named constituent dialogue.
- The scene should be one compact paragraph describing where the board member is, what is happening, and why the location creates pressure.
- The dialogue should be one compact paragraph of spoken dialogue from ${resolved.constituent.name}, in quotation marks.
- The constituent must present a concrete question, complaint, request, or challenge. Do not merely restate topic, archetype, or attitude.
- Do not reveal the correct answer.
- Do not include a generic "Constituent" field or duplicate the dialogue.

JSON schema:
{
  "scene": "short scene paragraph",
  "constituentName": "${resolved.constituent.name}",
  "constituentDialogue": "quoted spoken dialogue"
}`
    }
  ], 0.85);

  return {
    phase: "playing",
    setup: {
      locationId: resolved.location.id,
      locationName: resolved.location.name,
      constituentId: resolved.constituent.id,
      constituentName: resolved.constituent.name,
      constituentArchetype: resolved.constituent.archetype,
      attitudeId: resolved.attitude.id,
      attitudeName: resolved.attitude.name
    },
    scene: safeText(ai.scene, 1800),
    constituentName: resolved.constituent.name,
    constituentDialogue: normalizeQuote(ai.constituentDialogue),
    turnNumber: 0,
    maxTurns: resolved.location.maxTurns,
    earnedScore: 0,
    publicTrustPercent: initialPercent,
    meterLabel: meterLabel(initialPercent),
    history: [
      { role: "constituent", speaker: resolved.constituent.name, text: normalizeQuote(ai.constituentDialogue) }
    ]
  };
}

async function playTurn(body) {
  const state = body.state || {};
  const resolved = getSetup(state.setup || {});
  const playerResponse = safeText(body.playerResponse, 3500);
  if (!playerResponse) {
    const error = new Error("Player response is required.");
    error.statusCode = 400;
    throw error;
  }

  const currentTurnNumber = Math.max(0, Number(state.turnNumber || 0));
  const nextTurnNumber = Math.min(currentTurnNumber + 1, resolved.location.maxTurns);
  const isFinalTurn = nextTurnNumber >= resolved.location.maxTurns;
  const previousEarnedScore = Number.isFinite(Number(state.earnedScore)) ? Number(state.earnedScore) : 0;
  const scene = safeText(state.scene, 1800);
  const historyText = compactHistory(state.history);

  const ai = await callOpenAI([
    { role: "system", content: systemPrompt() },
    {
      role: "user",
      content: `${setupBrief(resolved)}

Scene: ${scene}

Conversation so far:
${historyText || "No prior conversation beyond the opening."}

This is player response ${nextTurnNumber} of ${resolved.location.maxTurns}:
Player: ${playerResponse}

Evaluate this exact response. Score it from -10 to +10. The score explanation must reference what the player actually said.

${isFinalTurn ? `This is the final player response. After scoring, generate the final summary. The final summary should include the constituent's private thought, whether they will vote for the board member next election (Yes or No), why or why not, and a coaching note. Do not calculate the final score percentage yourself; the server will calculate it.` : `Generate the constituent's next reply. The reply must be spoken dialogue from ${resolved.constituent.name} in quotation marks, must react directly to what the player just said, and must ask/push/follow up in a way that fits the remaining turns and the selected location pressure.`}

JSON schema:
${isFinalTurn ? `{
  "score": number,
  "scoreExplanation": "specific explanation",
  "flags": ["short flag", "short flag"],
  "finalSummary": {
    "constituentPrivateThought": "first-person or close-third private thought, preferably in quotation marks",
    "reelectionVote": "Yes or No",
    "whyOrWhyNot": "brief explanation",
    "playerFeedback": "brief coaching note"
  }
}` : `{
  "score": number,
  "scoreExplanation": "specific explanation",
  "flags": ["short flag", "short flag"],
  "constituentReply": "quoted spoken dialogue"
}`}`
    }
  ], 0.7);

  const score = clampScore(ai.score);
  const earnedScore = previousEarnedScore + score;
  const percent = trustPercent(earnedScore, resolved.location.maxTurns);
  const label = meterLabel(percent);

  const base = {
    score,
    scoreExplanation: safeText(ai.scoreExplanation, 1200),
    flags: Array.isArray(ai.flags) ? ai.flags.slice(0, 5).map(flag => safeText(flag, 160)).filter(Boolean) : [],
    publicTrustPercent: percent,
    meterLabel: label,
    earnedScore,
    turnNumber: nextTurnNumber,
    maxTurns: resolved.location.maxTurns
  };

  if (!isFinalTurn) {
    const reply = normalizeQuote(ai.constituentReply);
    return {
      phase: "playing",
      ...base,
      constituentName: resolved.constituent.name,
      constituentReply: reply,
      history: [
        ...(Array.isArray(state.history) ? state.history : []),
        { role: "player", speaker: "Board Member", text: playerResponse, score },
        { role: "constituent", speaker: resolved.constituent.name, text: reply }
      ]
    };
  }

  const summary = ai.finalSummary || {};
  const vote = String(summary.reelectionVote || "No").trim().toLowerCase().startsWith("y") ? "Yes" : "No";
  return {
    phase: "final",
    ...base,
    history: [
      ...(Array.isArray(state.history) ? state.history : []),
      { role: "player", speaker: "Board Member", text: playerResponse, score }
    ],
    finalSummary: {
      finalScore: `${percent}%`,
      resultLabel: resultLabel(percent),
      constituentPrivateThought: normalizeQuote(summary.constituentPrivateThought || "I am still thinking about whether that board member really understands the role."),
      reelectionVote: vote,
      whyOrWhyNot: safeText(summary.whyOrWhyNot, 1000) || (vote === "Yes" ? "They earned enough trust through role clarity and respectful listening." : "They did not earn enough trust in this conversation."),
      playerFeedback: safeText(summary.playerFeedback, 1200) || "Balance warmth with role clarity, and keep translating the concern into board-level work without promising an outcome."
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return jsonResponse(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    if (body.action === "start") {
      const payload = await startGame(body.setup || {});
      return jsonResponse(res, 200, payload);
    }
    if (body.action === "turn") {
      const payload = await playTurn(body);
      return jsonResponse(res, 200, payload);
    }
    return jsonResponse(res, 400, { error: "Invalid action. Use 'start' or 'turn'." });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("api/game-turn error", error);
    return jsonResponse(res, status, {
      error: error.message || "Unexpected server error"
    });
  }
};
