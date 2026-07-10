const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const LOCATION_TURNS = {
  "Board Chambers": 2,
  "Grocery Store": 3,
  "Coffee Shop": 5
};

const ATTITUDE_WEIGHTS = {
  Negative: { role: 0.7, trust: 0.3 },
  Neutral: { role: 0.6, trust: 0.4 },
  Positive: { role: 0.5, trust: 0.5 }
};

const GAME_RULES = `
You are the game engine for "The Board Member: Stay in Your Lane," an AI-powered civic governance simulator.
The player is one local school board member. They should listen well, stay within board role, avoid overpromising, protect confidentiality, govern through policy rather than procedures, keep student outcomes central, and earn public trust.

Core role:
- Responsibilities: listen to community members; advocate for students at the board level; evaluate superintendent performance; approve a balanced budget; govern through policy; speak carefully as one board member; maintain public trust.
- Do not reward: directing staff, promising operational outcomes, personally investigating complaints, speaking for the whole board, revealing confidential information, giving special influence to friends, or turning concerns into campaign promises.

Tone: grounded, human, lightly satirical, realistic. Respect students, families, teachers, and taxpayers. Humor can come from civic awkwardness, not from mocking concerns.

Location interaction limits and pressure:
- Board Chambers: 2 player responses. Ten minutes before a meeting; public setting; limited time; avoid side deliberation and informal promises.
- Grocery Store: 3 player responses. Informal public encounter; limited time; privacy concerns; melting ice cream is allowed.
- Coffee Shop: 5 player responses. Planned meeting; more listening; bigger danger of overpromising.

Constituents:
1. Mark Pearson - The Homeowner. Property taxes, district performance, home value, accountability. Trap: promising lower taxes, blaming staff/superintendent, defensiveness, dismissing taxpayers without kids. Board path: budget priorities, student outcomes, transparency, community value, strategic goals, stewardship.
2. Dana Ruiz - The Lifelong Friend. Personal access, rumors, confidential information, informal influence. Dana repeatedly reminds the player of friendship. Trap: oversharing, confidential context, friendship bypassing process, casual comments about staff/students/superintendent/board. Board path: public information, boundaries, fairness, no special access.
3. Alicia Grant - The Teacher-Parent. Teacher workload, classroom conditions, own child's experience. Trap: treating only as employee or only as parent; promises on staffing/class size/procedures; casual labor-management issues. Board path: budget tradeoffs, staffing priorities at governance level, superintendent performance, student experience, proper channels.
4. Jamal Brooks - The Classroom Experience Parent. Specific classroom incident involving his child; the teacher is Ms. Grant. Trap: personally investigating, taking sides, naming/criticizing staff, promising discipline, bypassing teacher/principal/superintendent process. Board path: listen, clarify process, protect privacy, watch systemic patterns, policy/climate/communication issues.
5. Priya Nair - The High School Junior. Senior year experience, student voice, schedule, privileges, academic options, graduation concerns. Trap: patronizing, promising privileges, treating student concerns as less serious, jumping into admin decisions. Board path: student voice, equity, graduation outcomes, policy impact, student experience data.
6. Brent Caldwell - The Eager Ideas Parent. Big improvement ideas. Trap: crushing enthusiasm, agreeing too quickly, promising to champion a specific idea, ignoring budget/staffing/implementation, turning one parent's idea into board directive. Board path: strategic planning, budget tradeoffs, pilots, superintendent/admin review, district goals, community input.
7. Emily Tran - The New Parent. How school board works. Trap: jargon, annoyance, unhelpful overexplaining, making board seem powerless or all-powerful. Board path: clear civic education, transparency, role clarity, chain of communication, public comment norms, board vs superintendent responsibilities.
8. Marcus Bell - The Teaching-and-Learning Parent. Curriculum, instruction, academic outcomes, grading, interventions, learning models. Trap: acting like curriculum director, debating methods too specifically, promising classroom practice, ignoring data, dismissing as details. Board path: achievement data, goals, superintendent accountability, curriculum approval where applicable, policy questions, equity and outcomes.

Attitude weights for final per-turn score:
- Negative: 70% Role Discipline, 30% Constituent Trust/Persuasion.
- Neutral: 60% Role Discipline, 40% Constituent Trust/Persuasion.
- Positive: 50% Role Discipline, 50% Constituent Trust/Persuasion.

Scoring is continuous integer -10 to +10. Do not collapse scores into only -10, -5, 0, +5, +10.
Calibration:
+10 exceptional model response. +9 excellent. +8 very strong and often right for humane, role-appropriate, responsive but imperfect answers. +7 strong with a noticeable gap. +6 good but incomplete. +5 acceptable but meaningfully incomplete. +4 to +1 limited positive. 0 ineffective but not harmful. -1 to -4 weak/damaging. -5 poor. -6 to -8 serious governance problem. -9 to -10 severe role failure.

Hidden scoring criteria:
A Listening and Empathy. B Role Clarity. C Governance Focus. D No Overpromising. E Confidentiality and Fairness. F Student-Centeredness. G Respectful Firmness. H Public Trust/Reelection credibility.

Every constituent follow-up must remember and react directly to what the player actually said. Avoid generic follow-ups. Do not instantly convince the constituent. Do not punish honest boundaries when stated well.

All constituent speech must be in quotation marks. Keep output compact enough to play quickly.
`;

function clampInt(value, min, max) {
  const n = Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
  return Math.max(min, Math.min(max, n));
}

function meterLabel(percent) {
  if (percent >= 80) return "Trusted Governor";
  if (percent >= 60) return "Mostly Credible";
  if (percent >= 40) return "Wobbly";
  if (percent >= 21) return "Losing Confidence";
  return "Trust Broken";
}

function resultLabel(percent) {
  if (percent >= 80) {
    return ["Earned Trust", "Governance Win", "Respectful Disagreement", "Vote Likely Secured"][Math.floor(Math.random() * 4)];
  }
  if (percent >= 21) {
    return ["No Vote Gained", "Middling Contact", "Unclear Leadership", "Process Without Trust"][Math.floor(Math.random() * 4)];
  }
  return ["Governance Breakdown", "Trust Lost", "Overpromised", "Out of Lane"][Math.floor(Math.random() * 4)];
}

function publicTrustMeter(earnedScore, completedTurns) {
  const turns = Math.max(1, completedTurns);
  const minPossible = -10 * turns;
  const maxPossible = 10 * turns;
  const percent = ((earnedScore - minPossible) / (maxPossible - minPossible)) * 100;
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return { percent: clamped, label: meterLabel(clamped) };
}

function finalPercent(earnedScore, maxTurns) {
  const minPossible = -10 * maxTurns;
  const maxPossible = 10 * maxTurns;
  const percent = ((earnedScore - minPossible) / (maxPossible - minPossible)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function stripFences(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeParseJson(text) {
  const clean = stripFences(text);
  try {
    return JSON.parse(clean);
  } catch (firstError) {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw firstError;
  }
}

async function readJsonBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function normalizeChoices(choices = {}) {
  const constituent = choices.constituent || {};
  const location = choices.location || {};
  const attitude = choices.attitude || {};

  return {
    constituent: {
      name: constituent.name || "Mark Pearson",
      label: constituent.label || constituent.name || "Mark Pearson - The Homeowner",
      detail: constituent.detail || "District performance, property taxes, home value, accountability."
    },
    location: {
      name: location.name || "Grocery Store",
      maxTurns: clampInt(location.maxTurns || LOCATION_TURNS[location.name] || 3, 2, 5),
      detail: location.detail || "Informal public encounter."
    },
    attitude: {
      name: attitude.name || "Neutral",
      detail: attitude.detail || "Concerned but open."
    }
  };
}

async function callOpenAI(messages, temperature = 0.72) {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error("OPENAI_API_KEY is not set in Vercel. Add it in Project Settings → Environment Variables, then redeploy.");
    err.statusCode = 500;
    throw err;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      response_format: { type: "json_object" },
      messages
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const openAiMessage = data?.error?.message || "OpenAI request failed.";
    const err = new Error(openAiMessage);
    err.statusCode = response.status >= 500 ? 502 : response.status;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("OpenAI returned an empty response.");
    err.statusCode = 502;
    throw err;
  }

  return safeParseJson(content);
}

async function startGame(choices) {
  const normalized = normalizeChoices(choices);
  const prompt = `
Generate the opening scenario for this selected game setup.

Selected constituent: ${normalized.constituent.label}
Constituent detail: ${normalized.constituent.detail}
Selected location: ${normalized.location.name}
Location pressure: ${normalized.location.detail}
Selected attitude: ${normalized.attitude.name}
Attitude detail: ${normalized.attitude.detail}

Required format:
- scene: one compact paragraph of narration. Include the location pressure.
- constituentName: exact constituent name only.
- constituentReply: one paragraph of spoken dialogue from the named constituent in quotation marks.

Scenario rules:
- The constituent must present a specific opening concern, question, complaint, request, or challenge.
- Do not merely restate their profile, topic, or attitude.
- The player should never have to guess what question they are answering.
- Do not reveal the correct answer.
- Keep it realistic, emotionally credible, and compact.

Return ONLY valid JSON with keys: scene, constituentName, constituentReply.
`;

  const result = await callOpenAI([
    { role: "system", content: GAME_RULES },
    { role: "user", content: prompt }
  ]);

  return {
    scene: String(result.scene || "A constituent approaches you with a concern before you have much time to prepare."),
    constituentName: String(result.constituentName || normalized.constituent.name),
    constituentReply: ensureQuoted(String(result.constituentReply || "\"Can you help me understand what the board can actually do about this?\""))
  };
}

function ensureQuoted(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "\"Can you help me understand what the board can actually do about this?\"";
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) return trimmed;
  return `"${trimmed.replace(/^['\"]|['\"]$/g, "")}"`;
}

function summarizeHistory(history = []) {
  return history
    .slice(-12)
    .map(item => `${item.speaker || "Unknown"}: ${item.text || ""}`)
    .join("\n");
}

async function scoreAndContinue(gameState, playerResponse) {
  const choices = normalizeChoices(gameState.choices || {});
  const previousScores = Array.isArray(gameState.scores) ? gameState.scores.map(Number).filter(Number.isFinite) : [];
  const currentTurn = clampInt(gameState.turn || 0, 0, choices.location.maxTurns);
  const maxTurns = clampInt(gameState.maxTurns || choices.location.maxTurns, 2, 5);
  const isFinalTurn = currentTurn + 1 >= maxTurns;
  const historyText = summarizeHistory(gameState.history || []);
  const weights = ATTITUDE_WEIGHTS[choices.attitude.name] || ATTITUDE_WEIGHTS.Neutral;

  const prompt = `
Evaluate the player's latest response and ${isFinalTurn ? "finish the scenario" : "generate the constituent's next reply"}.

Selected setup:
Constituent: ${choices.constituent.label}
Location: ${choices.location.name}
Attitude: ${choices.attitude.name}
Attitude scoring weights: Role Discipline ${weights.role}, Constituent Trust/Persuasion ${weights.trust}
Turn just answered: ${currentTurn + 1} of ${maxTurns}

Current scene:
${gameState.scene || ""}

Current constituent dialogue before the player answered:
${gameState.currentDialogue || ""}

Conversation history:
${historyText || "No prior history beyond the current opening."}

Player's latest response:
${playerResponse}

Scoring instructions:
- Produce hidden roleDisciplineScore and constituentTrustScore, each integer -10 to +10.
- Compute score as the attitude-weighted result rounded to the nearest integer. You may adjust by 1 or 2 points for unusually strong or harmful features.
- Use the full -10 to +10 range. A very solid but imperfect response should often be +8. +5 is acceptable but meaningfully incomplete.
- Score the response quality, not whether the constituent got what they wanted.
- Score explanation must reference the player's actual words or specific choices, not generic coaching.
- Flags should be short labels for what went well or poorly.

Constituent behavior:
- If continuing, the next constituentReply must be spoken dialogue in quotation marks and must directly remember what the player said.
- Push back when vague. Appreciate clarity when earned. Do not instantly become convinced.
- If final, do not create a new constituentReply; create a finalSummary.

Return ONLY valid JSON.
If continuing, use keys:
{
  "scene": "short updated scene narration",
  "constituentReply": "quoted spoken dialogue",
  "roleDisciplineScore": 0,
  "constituentTrustScore": 0,
  "score": 0,
  "scoreExplanation": "specific explanation",
  "flags": ["short flag", "short flag"]
}

If final, use keys:
{
  "scene": "short closing scene narration",
  "roleDisciplineScore": 0,
  "constituentTrustScore": 0,
  "score": 0,
  "scoreExplanation": "specific explanation",
  "flags": ["short flag", "short flag"],
  "finalSummary": {
    "privateThought": "first-person or close third-person thought from the constituent",
    "reelectionVote": "Yes or No",
    "whyOrWhyNot": "brief reason",
    "playerFeedback": "short coaching note"
  }
}
`;

  const ai = await callOpenAI([
    { role: "system", content: GAME_RULES },
    { role: "user", content: prompt }
  ], 0.55);

  const score = clampInt(ai.score, -10, 10);
  const scores = previousScores.concat(score);
  const earnedScore = scores.reduce((sum, item) => sum + item, 0);
  const completedTurns = scores.length;
  const meter = publicTrustMeter(earnedScore, completedTurns);

  const response = {
    scene: String(ai.scene || gameState.scene || "The conversation continues under the pressure of the setting."),
    score,
    scoreExplanation: String(ai.scoreExplanation || "The response was scored against role discipline and public trust."),
    flags: Array.isArray(ai.flags) ? ai.flags.slice(0, 5).map(String) : [],
    earnedScore,
    scores,
    publicTrustMeter: meter
  };

  if (isFinalTurn) {
    const percent = finalPercent(earnedScore, maxTurns);
    response.publicTrustMeter = { percent, label: meterLabel(percent) };
    response.finalSummary = {
      finalPercent: percent,
      resultLabel: resultLabel(percent),
      privateThought: String(ai.finalSummary?.privateThought || "That board member gave me something to think about, even if I did not get every answer I wanted."),
      reelectionVote: normalizeVote(ai.finalSummary?.reelectionVote, percent),
      whyOrWhyNot: String(ai.finalSummary?.whyOrWhyNot || "The judgment is based on whether the constituent trusted the board member's honesty, restraint, and role clarity."),
      playerFeedback: String(ai.finalSummary?.playerFeedback || "Keep pairing empathy with clear boundaries and board-level next steps.")
    };
  } else {
    response.constituentReply = ensureQuoted(String(ai.constituentReply || "\"I hear you, but I still need a clearer answer about what you can actually do as a board member.\""));
  }

  return response;
}

function normalizeVote(value, percent) {
  const vote = String(value || "").trim().toLowerCase();
  if (vote === "yes") return "Yes";
  if (vote === "no") return "No";
  return percent >= 80 ? "Yes" : "No";
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Use POST for this endpoint." }));
    return;
  }

  try {
    const body = await readJsonBody(req);

    if (body.action === "start") {
      const result = await startGame(body.choices || {});
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return;
    }

    if (body.action === "turn") {
      const playerResponse = String(body.playerResponse || "").trim();
      if (!playerResponse) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Player response is required." }));
        return;
      }
      const result = await scoreAndContinue(body.gameState || {}, playerResponse);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return;
    }

    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Unknown action. Use start or turn." }));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.statusCode = statusCode;
    res.end(JSON.stringify({
      error: statusCode === 500
        ? error.message || "Server error."
        : error.message || "Request failed."
    }));
  }
};
