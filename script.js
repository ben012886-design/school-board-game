const CONSTITUENTS = [
  { id: "mark-pearson", name: "Mark Pearson", label: "Mark Pearson - The Homeowner", detail: "District performance, property taxes, home value, accountability." },
  { id: "dana-ruiz", name: "Dana Ruiz", label: "Dana Ruiz - The Lifelong Friend", detail: "Personal access, rumors, confidential information, informal influence." },
  { id: "alicia-grant", name: "Alicia Grant", label: "Alicia Grant - The Teacher-Parent", detail: "Teacher workload, classroom conditions, and her own child's experience." },
  { id: "jamal-brooks", name: "Jamal Brooks", label: "Jamal Brooks - The Classroom Experience Parent", detail: "A specific classroom incident involving his child. The teacher is Ms. Grant." },
  { id: "priya-nair", name: "Priya Nair", label: "Priya Nair - The High School Junior", detail: "Senior year experience, student voice, schedules, privileges, academic options, or graduation-related concerns." },
  { id: "brent-caldwell", name: "Brent Caldwell", label: "Brent Caldwell - The Eager Ideas Parent", detail: "Big improvement ideas that may not account for cost, staffing, policy, or implementation complexity." },
  { id: "emily-tran", name: "Emily Tran", label: "Emily Tran - The New Parent", detail: "How the school board works, who does what, and how to raise concerns." },
  { id: "marcus-bell", name: "Marcus Bell", label: "Marcus Bell - The Teaching-and-Learning Parent", detail: "Curriculum, instruction, academic outcomes, grading, interventions, or learning models." }
];

const LOCATIONS = [
  { id: "board-chambers", name: "Board Chambers", maxTurns: 2, detail: "Ten minutes before a school board meeting. Quick listening, clear boundaries, and a proper next step." },
  { id: "grocery-store", name: "Grocery Store", maxTurns: 3, detail: "Informal public encounter while shopping. Polite, limited time, privacy concerns, and possibly melting ice cream." },
  { id: "coffee-shop", name: "Coffee Shop", maxTurns: 5, detail: "A planned meeting. More time to listen deeply, but more danger of overpromising." }
];

const ATTITUDES = [
  { id: "negative", name: "Negative", detail: "Skeptical, frustrated, suspicious, or upset. Role discipline matters most." },
  { id: "neutral", name: "Neutral", detail: "Concerned but open. Strong explanations and good listening matter." },
  { id: "positive", name: "Positive", detail: "Supportive or optimistic, but trust can be lost by being too casual or overpromising." }
];

const app = document.querySelector("#app");
let gameState = null;
let busy = false;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function optionList(items) {
  return items.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label || item.name)}</option>`).join("");
}

function byId(items, id) {
  return items.find(item => item.id === id) || items[0];
}

function renderSetup() {
  gameState = null;
  app.innerHTML = `
    <section class="card">
      <h2>Set up the encounter</h2>
      <p class="helper">Choose who approaches you, where it happens, and what mood they are in. Or let civic chaos do what civic chaos does.</p>

      <div class="setup-grid grid">
        <div class="control-card">
          <label for="constituent">Constituent</label>
          <select class="select" id="constituent">${optionList(CONSTITUENTS)}</select>
          <p class="choice-detail" id="constituent-detail"></p>
        </div>
        <div class="control-card">
          <label for="location">Location</label>
          <select class="select" id="location">${optionList(LOCATIONS)}</select>
          <p class="choice-detail" id="location-detail"></p>
        </div>
        <div class="control-card">
          <label for="attitude">Constituent Attitude</label>
          <select class="select" id="attitude">${optionList(ATTITUDES)}</select>
          <p class="choice-detail" id="attitude-detail"></p>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-secondary" id="randomize" type="button">Choose For Me</button>
        <button class="btn btn-primary" id="start" type="button">Start Game</button>
      </div>
      <p class="helper">Randomize the encounter. Real board members rarely get to choose who approaches them, where it happens, or what mood they are in.</p>
    </section>
  `;

  const constituent = document.querySelector("#constituent");
  const location = document.querySelector("#location");
  const attitude = document.querySelector("#attitude");

  function syncDetails() {
    document.querySelector("#constituent-detail").textContent = byId(CONSTITUENTS, constituent.value).detail;
    document.querySelector("#location-detail").textContent = byId(LOCATIONS, location.value).detail;
    document.querySelector("#attitude-detail").textContent = byId(ATTITUDES, attitude.value).detail;
  }

  [constituent, location, attitude].forEach(select => select.addEventListener("change", syncDetails));
  syncDetails();

  document.querySelector("#randomize").addEventListener("click", () => {
    constituent.value = randomItem(CONSTITUENTS).id;
    location.value = randomItem(LOCATIONS).id;
    attitude.value = randomItem(ATTITUDES).id;
    syncDetails();
  });

  document.querySelector("#start").addEventListener("click", async () => {
    const choices = {
      constituent: byId(CONSTITUENTS, constituent.value),
      location: byId(LOCATIONS, location.value),
      attitude: byId(ATTITUDES, attitude.value)
    };
    await startGame(choices);
  });
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function apiPost(payload) {
  const response = await fetch("/api/game-turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "The game server returned an error.");
  }
  return data;
}

function renderLoading(message) {
  app.innerHTML = `<section class="loading-card"><h2>Thinking like a constituent...</h2><p>${escapeHtml(message)}</p></section>`;
}

function renderError(error) {
  app.innerHTML = `
    <section class="error-card">
      <h2>Something went sideways</h2>
      <p>${escapeHtml(error.message || error)}</p>
      <div class="actions">
        <button class="btn btn-secondary" type="button" id="back-setup">Back to setup</button>
      </div>
    </section>
  `;
  document.querySelector("#back-setup").addEventListener("click", renderSetup);
}

async function startGame(choices) {
  if (busy) return;
  busy = true;
  renderLoading("Generating the opening scene and question.");

  try {
    const data = await apiPost({ action: "start", choices });
    gameState = {
      choices,
      scene: data.scene,
      constituentName: data.constituentName || choices.constituent.name,
      currentDialogue: data.constituentReply,
      turn: 0,
      maxTurns: choices.location.maxTurns,
      earnedScore: 0,
      scores: [],
      history: [
        { speaker: "scene", text: data.scene },
        { speaker: choices.constituent.name, text: data.constituentReply }
      ],
      lastResult: null,
      complete: false
    };
    renderGame();
  } catch (error) {
    renderError(error);
  } finally {
    busy = false;
  }
}

function statusPills() {
  if (!gameState) return "";
  const { choices, turn, maxTurns } = gameState;
  return `
    <div class="status-row">
      <span class="pill">${escapeHtml(choices.constituent.label)}</span>
      <span class="pill">${escapeHtml(choices.location.name)}</span>
      <span class="pill">${escapeHtml(choices.attitude.name)}</span>
      <span class="pill">Response ${Math.min(turn + 1, maxTurns)} of ${maxTurns}</span>
    </div>
  `;
}

function meterHtml(meter) {
  if (!meter) return "";
  const percent = Math.max(0, Math.min(100, Number(meter.percent || 0)));
  return `
    <section class="meter-card">
      <h3>Public Trust Meter</h3>
      <div class="meter-head">
        <div class="meter-number">${Math.round(percent)}%</div>
        <div class="meter-label">${escapeHtml(meter.label || "Wobbly")}</div>
      </div>
      <div class="meter-track" aria-label="Public Trust Meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}">
        <div class="meter-fill" style="width:${percent}%"></div>
      </div>
    </section>
  `;
}

function scoreHtml(result) {
  if (!result) return "";
  const flags = Array.isArray(result.flags) && result.flags.length
    ? `<ul class="flags">${result.flags.map(flag => `<li>${escapeHtml(flag)}</li>`).join("")}</ul>`
    : "";

  const score = Number(result.score || 0);
  const displayScore = score > 0 ? `+${score}` : `${score}`;

  return `
    <section class="score-card">
      <h3>Last Response Score</h3>
      <p><span class="score-value">${escapeHtml(displayScore)}</span>${escapeHtml(result.scoreExplanation || "")}</p>
      ${flags}
    </section>
  `;
}

function renderGame() {
  if (!gameState) {
    renderSetup();
    return;
  }

  if (gameState.complete) {
    renderFinal();
    return;
  }

  const hasSubmitted = Boolean(gameState.lastResult);
  app.innerHTML = `
    <div class="game-layout">
      ${statusPills()}
      <section class="scene-card">
        <h3>Scene</h3>
        <p>${escapeHtml(gameState.scene)}</p>
      </section>

      ${hasSubmitted ? meterHtml(gameState.lastResult.publicTrustMeter) : ""}

      <section class="speaker-card">
        <h3>${escapeHtml(gameState.constituentName)}</h3>
        <blockquote>${escapeHtml(gameState.currentDialogue)}</blockquote>
      </section>

      ${hasSubmitted ? scoreHtml(gameState.lastResult) : ""}

      <section class="card input-card">
        <textarea class="textarea" id="player-response" placeholder="Type your response here."></textarea>
        <div class="actions">
          <button class="btn btn-primary" type="button" id="submit-response">Submit Response</button>
          <button class="btn btn-secondary" type="button" id="restart">Restart</button>
        </div>
      </section>
    </div>
  `;

  document.querySelector("#submit-response").addEventListener("click", submitResponse);
  document.querySelector("#restart").addEventListener("click", renderSetup);
  document.querySelector("#player-response").focus();
}

async function submitResponse() {
  if (busy || !gameState) return;
  const textarea = document.querySelector("#player-response");
  const playerResponse = textarea.value.trim();

  if (!playerResponse) {
    textarea.focus();
    return;
  }

  busy = true;
  textarea.disabled = true;
  document.querySelector("#submit-response").disabled = true;

  try {
    const data = await apiPost({
      action: "turn",
      gameState: {
        choices: gameState.choices,
        scene: gameState.scene,
        constituentName: gameState.constituentName,
        currentDialogue: gameState.currentDialogue,
        turn: gameState.turn,
        maxTurns: gameState.maxTurns,
        earnedScore: gameState.earnedScore,
        scores: gameState.scores,
        history: gameState.history.slice(-12)
      },
      playerResponse
    });

    gameState.history.push({ speaker: "Player", text: playerResponse });
    gameState.turn += 1;
    gameState.earnedScore = data.earnedScore;
    gameState.scores = data.scores;
    gameState.scene = data.scene || gameState.scene;
    gameState.lastResult = {
      score: data.score,
      scoreExplanation: data.scoreExplanation,
      flags: data.flags,
      publicTrustMeter: data.publicTrustMeter
    };

    if (data.finalSummary) {
      gameState.complete = true;
      gameState.finalSummary = data.finalSummary;
      gameState.publicTrustMeter = data.publicTrustMeter;
    } else {
      gameState.currentDialogue = data.constituentReply;
      gameState.history.push({ speaker: gameState.constituentName, text: data.constituentReply });
    }

    renderGame();
  } catch (error) {
    renderError(error);
  } finally {
    busy = false;
  }
}

function renderFinal() {
  const summary = gameState.finalSummary || {};
  const resultLabel = summary.resultLabel || gameState.publicTrustMeter?.label || "Final Result";

  app.innerHTML = `
    <div class="game-layout">
      ${statusPills().replace(/Response.*?<\/span>/, `Completed ${gameState.maxTurns} responses</span>`)}
      ${meterHtml(gameState.publicTrustMeter)}
      ${scoreHtml(gameState.lastResult)}
      <section class="final-card">
        <h2>${escapeHtml(resultLabel)}</h2>
        <dl>
          <dt>Final Score</dt>
          <dd>${Math.round(summary.finalPercent ?? gameState.publicTrustMeter?.percent ?? 0)}%</dd>
          <dt>Constituent's Private Thought</dt>
          <dd>${escapeHtml(summary.privateThought || "They leave still thinking through the conversation.")}</dd>
          <dt>Reelection Vote</dt>
          <dd>${escapeHtml(summary.reelectionVote || "No")}</dd>
          <dt>Why or Why Not</dt>
          <dd>${escapeHtml(summary.whyOrWhyNot || "The result depends on whether the constituent trusted your judgment and role discipline.")}</dd>
          <dt>Player Feedback</dt>
          <dd>${escapeHtml(summary.playerFeedback || "Keep listening carefully, staying in role, and connecting concerns to board-level levers.")}</dd>
        </dl>
        <div class="actions">
          <button class="btn btn-primary" type="button" id="play-again">Play Again</button>
        </div>
      </section>
    </div>
  `;

  document.querySelector("#play-again").addEventListener("click", renderSetup);
}

renderSetup();
