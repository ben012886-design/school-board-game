const MODEL = 'gpt-4o-mini';

const MAX_TURNS = {
  board_chambers: 2,
  grocery_store: 3,
  coffee_shop: 5
};

const LOCATION_DETAILS = {
  board_chambers: 'Board Chambers: ten minutes before a school board meeting. Very limited time, public setting, meeting about to begin. The player must avoid side deliberation or informal promises.',
  grocery_store: 'Grocery Store: informal public encounter while the board member is shopping. Privacy may be an issue; the board member wants to be polite but has limited time, and the ice cream may be melting.',
  coffee_shop: 'Coffee Shop: planned meeting with the constituent. More time to listen deeply, but greater danger of overpromising.'
};

const ATTITUDE_DETAILS = {
  negative: 'Negative: skeptical, frustrated, suspicious, or upset. Weight role discipline 70%, constituent trust/persuasion 30%. Do not reward chasing approval.',
  neutral: 'Neutral: concerned but open. Weight role discipline 60%, constituent trust/persuasion 40%. Strong explanations and listening matter.',
  positive: 'Positive: generally supportive or optimistic. Weight role discipline 50%, constituent trust/persuasion 50%. The player can lose trust by getting too casual or offering special access.'
};

const CONSTITUENT_DETAILS = {
  mark: `Mark Pearson - The Homeowner.
Topic: District performance, property taxes, home value, accountability.
Core concern: Mark wants to know why he should financially support the district if taxes are rising and he does not believe results are improving.
Common traps: promising lower taxes, blaming superintendent/staff, defensiveness, treating taxpayers without children as less legitimate.
Board-level path: budget priorities, student outcomes, transparency, long-term community value, strategic goals, responsible stewardship.
Good opening question examples: "My property tax statement went up again. What evidence does the board use to decide whether taxpayers are getting results for that money?" / "If test scores are flat, why should homeowners believe the district is using its budget effectively?" / "Do board members ever vote no on a budget because academic results are not strong enough?"`,

  dana: `Dana Ruiz - The Lifelong Friend.
Topic: personal access, rumors, confidential information, informal influence.
Core concern: Dana has known the board member for years and feels entitled to ask questions others could not ask.
Common traps: oversharing, confidential context, friendship bypassing proper process, speaking casually about staff/students/superintendent/board members.
Board-level path: respectful boundaries, public information, no special access, trust through fairness, friendship without favoritism.
Good opening question examples: "Come on, it's me. Is the superintendent actually in trouble, or is that just rumor?" / "You can tell me off the record. Why did the board really vote that way?" / "Are you really saying being friends with you does not get me a straighter answer?"`,

  alicia: `Alicia Grant - The Teacher-Parent.
Topic: teacher workload, classroom conditions, and her own child's experience.
Core concern: Alicia is both a district teacher and a parent, so her concern may blend professional frustration with advocacy for her child.
Common traps: treating her only as employee or only as parent, promising staffing/class size/building procedure changes, casual labor-management discussion.
Board-level path: budget tradeoffs, staffing priorities at governance level, superintendent performance, student experience, respect for both roles, proper channels for individual concerns.
Good opening question examples: "As a teacher, I'm exhausted. As a parent, I'm worried my own child is not getting enough support. How is the board looking at class size and student needs together?" / "When the board approves a budget, do you actually ask what the staffing numbers mean inside classrooms?"`,

  jamal: `Jamal Brooks - The Classroom Experience Parent.
Topic: a specific classroom incident involving his child.
Core concern: Jamal believes something unfair or harmful happened in his child's classroom and wants someone in authority to act.
Common traps: personally investigating, taking sides based on one account, naming/criticizing staff, promising discipline/correction, bypassing teacher/principal/superintendent process.
Board-level path: listening with care, clarifying process, protecting privacy, watching for systemic patterns, policy/climate/communication issues.
Good opening question examples: "My child came home saying they were singled out in class. I am not asking you to be the principal, but what is the board's role when families do not feel heard?" / "If I follow the chain of communication and still feel dismissed, when does this become a board-level concern?"`,

  priya: `Priya Nair - The High School Junior.
Topic: senior year experience, student voice, schedule, privileges, academic options, graduation concerns.
Core concern: Priya wants the board to understand how policy decisions affect students directly.
Common traps: patronizing, promising student privileges, treating student concerns as less serious, jumping into administrative decisions.
Board-level path: student voice, equity, graduation outcomes, policy impact, student experience data, how students are included in decision-making.
Good opening question examples: "I'm going to be a senior next year, and students keep hearing decisions are made for us, not with us. How does the board actually use student voice?" / "If a policy affects graduation, schedules, or senior privileges, why are students usually the last to know?"`,

  brent: `Brent Caldwell - The Eager Ideas Parent.
Topic: big improvement ideas for the district.
Core concern: Brent has many ideas and believes they are obvious wins, but may not understand cost, staffing, policy, or implementation complexity.
Common traps: crushing enthusiasm, agreeing too quickly, promising to champion a specific idea, ignoring budget/operations, letting one parent's idea become a board directive.
Board-level path: strategic planning, budget tradeoffs, pilot programs, superintendent/admin review, alignment with district goals, community input.
Good opening question examples: "I have an idea that could change the district: AI tutoring, internships, personal finance, and no homework pilots. How do I get the board to move on this?" / "If parents can see obvious improvements, why can't the board just tell the superintendent to try them?"`,

  emily: `Emily Tran - The New-to-the-Board Parent.
Topic: how the school board works.
Core concern: Emily is trying to understand who does what, how to raise concerns, and why board members sometimes seem limited in what they can say or do.
Common traps: jargon, sounding annoyed, overexplaining without helping, making the board seem powerless or all-powerful.
Board-level path: clear civic education, transparency, role clarity, chain of communication, public comment norms, board versus superintendent responsibilities.
Good opening question examples: "I'm embarrassed to ask this, but what does the school board actually control?" / "If I have a concern, do I email the board, talk to the teacher, contact the principal, or speak at public comment?" / "Why do board members sometimes sit there and not answer people during public comment?"`,

  marcus: `Marcus Bell - The Teaching-and-Learning Parent.
Topic: curriculum, instruction, academic outcomes, grading, interventions, learning models.
Core concern: Marcus wants to know whether the district's teaching and learning approach is actually working for students.
Common traps: acting like curriculum director, debating instructional methods too specifically, promises about classroom practice, ignoring academic data, dismissing concerns as instructional details.
Board-level path: achievement data, district goals, superintendent accountability, curriculum approval where applicable, policy-level questions, equity and outcomes.
Good opening question examples: "The district keeps talking about effective instruction. How does the board know whether the teaching approach is working?" / "When academic data is not where it should be, what is the board supposed to do versus what administrators are supposed to do?"`
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function meterLabel(percent) {
  if (percent >= 80) return 'Trusted Governor';
  if (percent >= 60) return 'Mostly Credible';
  if (percent >= 40) return 'Wobbly';
  if (percent >= 21) return 'Losing Confidence';
  return 'Trust Broken';
}

function normalizedPercent(earnedScore, maxTurns) {
  const max = maxTurns * 10;
  const min = maxTurns * -10;
  return clamp(((earnedScore - min) / (max - min)) * 100, 0, 100);
}

function stripCodeFence(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
}

function safeParseJson(text) {
  try {
    return JSON.parse(stripCodeFence(text));
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw error;
  }
}

async function callOpenAI(messages, temperature = 0.75) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY. Add it as a Vercel environment variable.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      response_format: { type: 'json_object' },
      messages
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || 'OpenAI request failed.';
    throw new Error(message);
  }
  return safeParseJson(data.choices?.[0]?.message?.content || '{}');
}

function baseSystemPrompt() {
  return `You are the game engine for "The Board Member: Stay in Your Lane," an AI-powered school board governance simulator.

Core rule: The player should win by being a good board member, not by being a good politician.

Player role:
- Listen to community members.
- Advocate for students at the board level.
- Evaluate the superintendent's job performance.
- Approve and pass a balanced district budget.
- Govern through policy, not procedures.
- Represent personal views carefully without implying they speak for the full board.
- Maintain public trust.

The player should NOT:
- Direct staff.
- Promise specific operational outcomes.
- Personally investigate individual complaints.
- Speak for the full board outside official action.
- Reveal confidential information.
- Treat friendship or informal access as special influence.
- Turn constituent concerns into campaign promises.

Scoring: each player response gets -10 to +10.
Reward: listening, clarity, boundaries, governance discipline, student-centered framing, budget awareness when relevant, superintendent accountability when relevant, respectful disagreement, realistic next steps.
Penalize: overpromising, speaking for the whole board, directing staff, confidential information, management/procedure drift, blaming individuals, pandering for votes, dismissing concerns, hiding behind process without empathy, vague answers where the constituent learns nothing.

Most important prototype quality rules:
1. The player should always know what question they are answering.
2. Separate scene narration from spoken dialogue.
3. Put constituent speech in quotation marks.
4. The constituent must remember the conversation from turn to turn.
5. Follow-up replies must react to the player's actual words, including specific claims, promises, boundaries, or omissions.
6. Do not produce vague follow-ups that could apply to any response.
7. Keep the constituent human, grounded, and consistent. Do not make them a caricature.
8. Do not reveal the correct answer.

Return only valid JSON.`;
}

function validateSelections(selections) {
  const constituentId = selections?.constituent?.id;
  const locationId = selections?.location?.id;
  const attitudeId = selections?.attitude?.id;
  if (!CONSTITUENT_DETAILS[constituentId]) throw new Error('Invalid constituent.');
  if (!LOCATION_DETAILS[locationId]) throw new Error('Invalid location.');
  if (!ATTITUDE_DETAILS[attitudeId]) throw new Error('Invalid attitude.');
  return { constituentId, locationId, attitudeId };
}

async function startScenario(selections) {
  const { constituentId, locationId, attitudeId } = validateSelections(selections);

  const messages = [
    { role: 'system', content: baseSystemPrompt() },
    {
      role: 'user',
      content: `Generate the opening scenario.

Selected constituent:
${CONSTITUENT_DETAILS[constituentId]}

Selected location:
${LOCATION_DETAILS[locationId]}

Selected attitude:
${ATTITUDE_DETAILS[attitudeId]}

Required format:
{
  "scene": "Short narration only. No spoken dialogue here.",
  "constituentDialogue": "One paragraph of spoken dialogue in quotation marks. It must include a concrete question, complaint, request, or challenge."
}

Rules:
- The dialogue must be a specific playable question, not a restatement of the topic.
- Do not say things like "approaches you about property taxes" as the main concern.
- Do not simply paste the attitude example line.
- Location pressure should be visible in the scene.
- The player's first response should have an obvious thing to answer.`
    }
  ];

  const result = await callOpenAI(messages, 0.85);
  return {
    scene: String(result.scene || '').trim(),
    constituentDialogue: ensureQuoted(String(result.constituentDialogue || '').trim())
  };
}

function ensureQuoted(text) {
  const trimmed = text.trim();
  if (!trimmed) return '"I have a specific concern, and I need to understand what you can actually do as a board member."';
  if (trimmed.startsWith('"') || trimmed.startsWith('“')) return trimmed;
  return `"${trimmed}"`;
}

function compactHistory(history = []) {
  return history.map(entry => {
    if (entry.role === 'player') return `Player: ${entry.text}`;
    if (entry.role === 'constituent') return `Constituent: ${entry.text}`;
    if (entry.role === 'feedback') return `Engine scored prior response ${entry.score}: ${entry.explanation}`;
    return `${entry.role}: ${entry.text || ''}`;
  }).join('\n');
}

async function respondToPlayer(state, playerResponse) {
  const selections = state?.selections;
  const { constituentId, locationId, attitudeId } = validateSelections(selections);
  const maxTurns = MAX_TURNS[locationId];
  const currentTurn = Number(state.turn || 0) + 1;
  const isFinalTurn = currentTurn >= maxTurns;
  const earnedBefore = Number(state.earnedScore || 0);

  const messages = [
    { role: 'system', content: baseSystemPrompt() },
    {
      role: 'user',
      content: `Evaluate the player's latest response and continue the scenario.

Selected constituent:
${CONSTITUENT_DETAILS[constituentId]}

Selected location:
${LOCATION_DETAILS[locationId]}

Selected attitude:
${ATTITUDE_DETAILS[attitudeId]}

Turn: ${currentTurn} of ${maxTurns}
Existing earned score before this response: ${earnedBefore}

Original scene:
${state.scene || ''}

Conversation history before scoring this latest response:
${compactHistory(state.history || [])}

Latest player response to score:
${playerResponse}

Instructions:
- Score the latest player response from -10 to +10.
- The score explanation MUST reference specific things the player said or failed to say.
- The constituent reply, if any, MUST react to the player's actual response and remember the conversation.
- If the player made a promise, dodged, got too vague, or crossed role boundaries, the constituent should notice.
- If the player set a good boundary or gave a helpful next step, the constituent should notice.
- Do not create a generic reply that could follow any response.
- Do not make the constituent instantly convinced by one good sentence.

Return JSON only.
${isFinalTurn ? `Since this is the final player response, return:
{
  "score": number,
  "scoreExplanation": "specific explanation",
  "flags": ["short flag", "short flag"],
  "finalConstituentReply": "optional final spoken reaction in quotation marks",
  "finalSummary": {
    "resultLabel": "Governance Win OR Middling Contact OR Governance Breakdown or similar",
    "privateThought": "first-person private thought from constituent",
    "reelectionVote": "Yes or No",
    "hiddenVoteLean": "Strong Yes OR Lean Yes OR Lean No OR Strong No",
    "why": "brief reason",
    "playerFeedback": "brief coaching note"
  }
}` : `Since the scenario continues after this response, return:
{
  "score": number,
  "scoreExplanation": "specific explanation",
  "constituentReply": "spoken follow-up in quotation marks that remembers the conversation",
  "flags": ["short flag", "short flag"]
}`}
`
    }
  ];

  const result = await callOpenAI(messages, 0.65);
  const score = clamp(Number(result.score || 0), -10, 10);
  const earnedAfter = earnedBefore + score;
  const runningPercent = normalizedPercent(earnedAfter, maxTurns);
  const label = meterLabel(runningPercent);

  if (isFinalTurn) {
    const finalPercent = runningPercent;
    const resultLabel = result.finalSummary?.resultLabel || (finalPercent >= 80 ? 'Governance Win' : finalPercent <= 20 ? 'Governance Breakdown' : 'Middling Contact');
    const finalConstituentReply = result.finalConstituentReply ? ensureQuoted(String(result.finalConstituentReply)) : '';
    return {
      score,
      scoreExplanation: String(result.scoreExplanation || '').trim(),
      flags: Array.isArray(result.flags) ? result.flags.slice(0, 4) : [],
      constituentReply: finalConstituentReply,
      runningPercent,
      meterLabel: label,
      isFinal: true,
      finalSummary: {
        finalPercent,
        resultLabel,
        privateThought: result.finalSummary?.privateThought || 'I am still deciding what I think, but I noticed how the board member handled the conversation.',
        reelectionVote: normalizeVote(result.finalSummary?.reelectionVote, finalPercent),
        hiddenVoteLean: result.finalSummary?.hiddenVoteLean || hiddenLeanFromPercent(finalPercent),
        why: result.finalSummary?.why || 'The final vote depends on whether the constituent felt respected and whether the board member stayed in role.',
        playerFeedback: result.finalSummary?.playerFeedback || 'Keep listening, naming the board role clearly, and avoiding promises you cannot make.'
      }
    };
  }

  return {
    score,
    scoreExplanation: String(result.scoreExplanation || '').trim(),
    flags: Array.isArray(result.flags) ? result.flags.slice(0, 4) : [],
    constituentReply: ensureQuoted(String(result.constituentReply || '').trim()),
    runningPercent,
    meterLabel: label,
    isFinal: false
  };
}

function normalizeVote(vote, percent) {
  const v = String(vote || '').toLowerCase();
  if (v.startsWith('y')) return 'Yes';
  if (v.startsWith('n')) return 'No';
  return percent >= 80 ? 'Yes' : 'No';
}

function hiddenLeanFromPercent(percent) {
  if (percent >= 90) return 'Strong Yes';
  if (percent >= 80) return 'Lean Yes';
  if (percent >= 35) return 'Lean No';
  return 'Strong No';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { action, selections, state, playerResponse } = req.body || {};

    if (action === 'start') {
      const scenario = await startScenario(selections);
      return res.status(200).json(scenario);
    }

    if (action === 'respond') {
      if (!state || !playerResponse) {
        return res.status(400).json({ error: 'Missing game state or player response.' });
      }
      const turn = await respondToPlayer(state, playerResponse);
      return res.status(200).json(turn);
    }

    return res.status(400).json({ error: 'Invalid action.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Server error.' });
  }
}
