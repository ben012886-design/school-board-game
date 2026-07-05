const options = {
  constituents: [
    { id: "mark_pearson", name: "Mark Pearson", label: "Mark Pearson - The Homeowner" },
    { id: "dana_ruiz", name: "Dana Ruiz", label: "Dana Ruiz - The Lifelong Friend" },
    { id: "alicia_grant", name: "Alicia Grant", label: "Alicia Grant - The Teacher-Parent" },
    { id: "jamal_brooks", name: "Jamal Brooks", label: "Jamal Brooks - The Classroom Experience Parent" },
    { id: "priya_nair", name: "Priya Nair", label: "Priya Nair - The High School Junior" },
    { id: "brent_caldwell", name: "Brent Caldwell", label: "Brent Caldwell - The Eager Ideas Parent" },
    { id: "emily_tran", name: "Emily Tran", label: "Emily Tran - The New-to-the-Board Parent" },
    { id: "marcus_bell", name: "Marcus Bell", label: "Marcus Bell - The Teaching-and-Learning Parent" }
  ],
  locations: [
    { id: "board_chambers", name: "Board Chambers", label: "Board Chambers - 2 responses" },
    { id: "grocery_store", name: "Grocery Store", label: "Grocery Store - 3 responses" },
    { id: "coffee_shop", name: "Coffee Shop", label: "Coffee Shop - 5 responses" }
  ],
  attitudes: [
    { id: "negative", name: "Negative", label: "Negative - skeptical or frustrated" },
    { id: "neutral", name: "Neutral", label: "Neutral - concerned but open" },
    { id: "positive", name: "Positive", label: "Positive - supportive or optimistic" }
  ]
};

let gameState = null;
let previousResponses = [];

const el = {
  setupPanel: document.getElementById("setupPanel"),
  gamePanel: document.getElementById("gamePanel"),
  finalPanel: document.getElementById("finalPanel"),
  constituentSelect: document.getElementById("constituentSelect"),
  locationSelect: document.getElementById("locationSelect"),
  attitudeSelect: document.getElementById("attitudeSelect"),
  randomizeBtn: document.getElementById("randomizeBtn"),
  startBtn: document.getElementById("startBtn"),
  submitBtn: document.getElementById("submitBtn"),
  playAgainBtn: document.getElementById("playAgainBtn"),
  trustPercent: document.getElementById("trustPercent"),
  trustLabel: document.getElementById("trustLabel"),
  meterFill: document.getElementById("meterFill"),
  turnChip: document.getElementById("turnChip"),
  sceneText: document.getElementById("sceneText"),
  speakerName: document.getElementById("speakerName"),
  speakerContext: document.getElementById("speakerContext"),
  constituentText: document.getElementById("constituentText"),
  feedbackPanel: document.getElementById("feedbackPanel"),
  lastScore: document.getElementById("lastScore"),
  scoreExplanation: document.getElementById("scoreExplanation"),
  flagsList: document.getElementById("flagsList"),
  playerResponse: document.getElementById("playerResponse"),
  previousPanel: document.getElementById("previousPanel"),
  previousResponses: document.getElementById("previousResponses"),
  finalResult: document.getElementById("finalResult"),
  finalScore: document.getElementById("finalScore"),
  privateThought: document.getElementById("privateThought"),
  reelectionVote: document.getElementById("reelectionVote"),
  whyVote: document.getElementById("whyVote"),
  playerFeedback: document.getElementById("playerFeedback"),
  loadingOverlay: document.getElementById("loadingOverlay")
};

function populateSelect(select, items) {
  select.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.label;
    select.appendChild(opt);
  }
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getSetup() {
  return {
    constituentId: el.constituentSelect.value,
    locationId: el.locationSelect.value,
    attitudeId: el.attitudeSelect.value
  };
}

function setLoading(isLoading) {
  el.loadingOverlay.classList.toggle("hidden", !isLoading);
  el.startBtn.disabled = isLoading;
  el.submitBtn.disabled = isLoading;
  el.randomizeBtn.disabled = isLoading;
}

function showError(message) {
  alert(message || "Something went wrong. Check the Vercel function logs for details.");
}

async function postGame(payload) {
  const response = await fetch("/api/game-turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

function updateTrust(percent, label) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  el.trustPercent.textContent = `${safePercent}%`;
  el.trustLabel.textContent = label || "Wobbly";
  el.meterFill.style.width = `${safePercent}%`;
}

function renderGame() {
  if (!gameState) return;
  el.sceneText.textContent = gameState.scene || "";
  el.speakerName.textContent = gameState.constituentName || gameState.setup?.constituentName || "Constituent";
  el.speakerContext.textContent = gameState.setup?.constituentArchetype || "";
  el.constituentText.textContent = gameState.constituentDialogue || gameState.constituentReply || "";
  updateTrust(gameState.publicTrustPercent, gameState.meterLabel);
  el.turnChip.textContent = `Turn ${gameState.turnNumber || 0} of ${gameState.maxTurns || 0}`;
}

function renderFeedback(result) {
  el.feedbackPanel.classList.remove("hidden");
  el.lastScore.textContent = result.score > 0 ? `+${result.score}` : `${result.score}`;
  el.scoreExplanation.textContent = result.scoreExplanation || "";
  el.flagsList.innerHTML = "";
  for (const flag of result.flags || []) {
    const li = document.createElement("li");
    li.textContent = flag;
    el.flagsList.appendChild(li);
  }
}

function renderPreviousResponses() {
  el.previousResponses.innerHTML = "";
  el.previousPanel.classList.toggle("hidden", previousResponses.length === 0);
  for (const item of previousResponses) {
    const div = document.createElement("div");
    div.className = "previous-response";
    const score = item.score > 0 ? `+${item.score}` : `${item.score}`;
    div.innerHTML = `<strong>Response ${item.number} (${score})</strong><p></p>`;
    div.querySelector("p").textContent = item.text;
    el.previousResponses.appendChild(div);
  }
}

function renderFinal(summary) {
  el.gamePanel.classList.add("hidden");
  el.finalPanel.classList.remove("hidden");
  el.finalResult.textContent = summary.resultLabel || "Final Result";
  el.finalScore.textContent = summary.finalScore || "0%";
  el.privateThought.textContent = summary.constituentPrivateThought || "";
  el.reelectionVote.textContent = summary.reelectionVote || "";
  el.whyVote.textContent = summary.whyOrWhyNot || "";
  el.playerFeedback.textContent = summary.playerFeedback || "";
}

async function startGame() {
  setLoading(true);
  try {
    previousResponses = [];
    gameState = await postGame({ action: "start", setup: getSetup() });
    el.setupPanel.classList.add("hidden");
    el.finalPanel.classList.add("hidden");
    el.gamePanel.classList.remove("hidden");
    el.feedbackPanel.classList.add("hidden");
    el.previousPanel.classList.add("hidden");
    el.playerResponse.value = "";
    renderGame();
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

async function submitResponse() {
  const playerText = el.playerResponse.value.trim();
  if (!playerText) {
    el.playerResponse.focus();
    return;
  }

  setLoading(true);
  try {
    const result = await postGame({
      action: "turn",
      state: gameState,
      playerResponse: playerText
    });

    previousResponses.push({
      number: (gameState.turnNumber || 0) + 1,
      text: playerText,
      score: result.score
    });

    gameState = {
      ...gameState,
      ...result,
      setup: gameState.setup,
      scene: gameState.scene,
      constituentName: gameState.constituentName,
      constituentDialogue: result.constituentReply || gameState.constituentDialogue,
      history: result.history || gameState.history
    };

    el.playerResponse.value = "";
    renderFeedback(result);
    renderPreviousResponses();
    updateTrust(result.publicTrustPercent, result.meterLabel);
    el.turnChip.textContent = `Turn ${result.turnNumber} of ${result.maxTurns}`;

    if (result.phase === "final") {
      renderFinal(result.finalSummary || {});
    } else {
      renderGame();
    }
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

function resetGame() {
  gameState = null;
  previousResponses = [];
  el.finalPanel.classList.add("hidden");
  el.gamePanel.classList.add("hidden");
  el.setupPanel.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function init() {
  populateSelect(el.constituentSelect, options.constituents);
  populateSelect(el.locationSelect, options.locations);
  populateSelect(el.attitudeSelect, options.attitudes);

  el.randomizeBtn.addEventListener("click", () => {
    el.constituentSelect.value = randomItem(options.constituents).id;
    el.locationSelect.value = randomItem(options.locations).id;
    el.attitudeSelect.value = randomItem(options.attitudes).id;
  });

  el.startBtn.addEventListener("click", startGame);
  el.submitBtn.addEventListener("click", submitResponse);
  el.playAgainBtn.addEventListener("click", resetGame);
  el.playerResponse.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") submitResponse();
  });
}

init();
