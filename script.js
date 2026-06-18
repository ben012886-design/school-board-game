const CONSTITUENTS = [
  { id: 'mark', name: 'Mark Pearson', label: 'The Homeowner' },
  { id: 'dana', name: 'Dana Ruiz', label: 'The Lifelong Friend' },
  { id: 'alicia', name: 'Alicia Grant', label: 'The Teacher-Parent' },
  { id: 'jamal', name: 'Jamal Brooks', label: 'The Classroom Experience Parent' },
  { id: 'priya', name: 'Priya Nair', label: 'The High School Junior' },
  { id: 'brent', name: 'Brent Caldwell', label: 'The Eager Ideas Parent' },
  { id: 'emily', name: 'Emily Tran', label: 'The New-to-the-Board Parent' },
  { id: 'marcus', name: 'Marcus Bell', label: 'The Teaching-and-Learning Parent' }
];

const LOCATIONS = [
  { id: 'board_chambers', name: 'Board Chambers', turns: 2, meaning: 'Respect under pressure' },
  { id: 'grocery_store', name: 'Grocery Store', turns: 3, meaning: 'Boundary plus helpfulness' },
  { id: 'coffee_shop', name: 'Coffee Shop', turns: 5, meaning: 'Trust through clarity' }
];

const ATTITUDES = [
  { id: 'negative', name: 'Negative', weight: '70% role discipline / 30% persuasion' },
  { id: 'neutral', name: 'Neutral', weight: '60% role discipline / 40% persuasion' },
  { id: 'positive', name: 'Positive', weight: '50% role discipline / 50% persuasion' }
];

let state = null;

const $ = (id) => document.getElementById(id);

function fillSelect(select, items, render) {
  select.innerHTML = items.map(item => `<option value="${item.id}">${render(item)}</option>`).join('');
}

function findById(list, id) {
  return list.find(item => item.id === id);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showStatus(message, sticky = false) {
  const status = $('status');
  status.textContent = message;
  status.classList.remove('hidden');
  if (!sticky) {
    window.clearTimeout(showStatus.timer);
    showStatus.timer = window.setTimeout(() => status.classList.add('hidden'), 2800);
  }
}

function setBusy(isBusy) {
  $('startBtn').disabled = isBusy;
  $('submitBtn').disabled = isBusy;
  $('randomizeBtn').disabled = isBusy;
  $('playerResponse').disabled = isBusy;
}

function getSelections() {
  const constituent = findById(CONSTITUENTS, $('constituentSelect').value);
  const location = findById(LOCATIONS, $('locationSelect').value);
  const attitude = findById(ATTITUDES, $('attitudeSelect').value);
  return { constituent, location, attitude };
}

function randomize() {
  $('constituentSelect').value = CONSTITUENTS[Math.floor(Math.random() * CONSTITUENTS.length)].id;
  $('locationSelect').value = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)].id;
  $('attitudeSelect').value = ATTITUDES[Math.floor(Math.random() * ATTITUDES.length)].id;
}

function meterLabel(percent) {
  if (percent >= 80) return 'Trusted Governor';
  if (percent >= 60) return 'Mostly Credible';
  if (percent >= 40) return 'Wobbly';
  if (percent >= 21) return 'Losing Confidence';
  return 'Trust Broken';
}

function updateMeter(percent = 50, label) {
  const rounded = Math.max(0, Math.min(100, Math.round(percent)));
  $('meterPercent').textContent = `${rounded}%`;
  $('meterName').textContent = label || meterLabel(rounded);
}

function renderScenario(data) {
  $('scenarioBox').innerHTML = `
    <article class="card">
      <h3>Scene</h3>
      <p>${escapeHtml(data.scene)}</p>
    </article>
    <article class="card">
      <h3>Constituent</h3>
      <p class="dialogue">${escapeHtml(data.constituentDialogue)}</p>
    </article>
  `;
}

function scoreClass(score) {
  if (score >= 6) return 'good';
  if (score >= 0) return 'warn';
  return 'bad';
}

function renderConversation() {
  const history = state?.history || [];
  $('conversationBox').innerHTML = history.map(entry => {
    if (entry.role === 'player') {
      return `<article class="card turn-card player"><h3>You</h3><p>${escapeHtml(entry.text)}</p></article>`;
    }
    if (entry.role === 'constituent') {
      return `<article class="card turn-card"><h3>${escapeHtml(state.selections.constituent.name)}</h3><p class="dialogue">${escapeHtml(entry.text)}</p></article>`;
    }
    if (entry.role === 'feedback') {
      const flags = Array.isArray(entry.flags) && entry.flags.length
        ? `<p class="meta-line"><strong>Flags:</strong> ${entry.flags.map(escapeHtml).join(' · ')}</p>`
        : '';
      return `<article class="card turn-card feedback ${scoreClass(entry.score)}"><h3>Score: ${entry.score > 0 ? '+' : ''}${entry.score}</h3><p>${escapeHtml(entry.explanation)}</p><p class="meta-line">Public Trust Meter: ${Math.round(entry.runningPercent)}% — ${escapeHtml(entry.meterLabel)}</p>${flags}</article>`;
    }
    return '';
  }).join('');
}

function renderFinal(final) {
  $('gamePanel').classList.add('hidden');
  $('finalPanel').classList.remove('hidden');
  $('finalPanel').innerHTML = `
    <h2>Final Summary</h2>
    <p class="big-score">${Math.round(final.finalPercent)}%</p>
    <div class="final-grid">
      <article class="card"><h3>Result</h3><p>${escapeHtml(final.resultLabel)}</p></article>
      <article class="card"><h3>Reelection Vote</h3><p>${escapeHtml(final.reelectionVote)}</p></article>
    </div>
    <article class="card"><h3>Constituent's Private Thought</h3><p>${escapeHtml(final.privateThought)}</p></article>
    <article class="card"><h3>Why or Why Not</h3><p>${escapeHtml(final.why)}</p></article>
    <article class="card"><h3>Player Feedback</h3><p>${escapeHtml(final.playerFeedback)}</p></article>
    <div class="button-row"><button id="finalNewGameBtn" type="button">Play Another Scenario</button></div>
  `;
  $('finalNewGameBtn').addEventListener('click', resetGame);
}

function resetGame() {
  state = null;
  $('setupPanel').classList.remove('hidden');
  $('gamePanel').classList.add('hidden');
  $('finalPanel').classList.add('hidden');
  $('conversationBox').innerHTML = '';
  $('scenarioBox').innerHTML = '';
  $('playerResponse').value = '';
  updateMeter(50, 'Wobbly');
}

async function apiCall(payload) {
  const response = await fetch('/api/game-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

async function startGame() {
  const selections = getSelections();
  setBusy(true);
  showStatus('Generating the encounter...', true);

  try {
    const data = await apiCall({ action: 'start', selections });
    state = {
      selections,
      scene: data.scene,
      constituentDialogue: data.constituentDialogue,
      turn: 0,
      maxTurns: selections.location.turns,
      earnedScore: 0,
      history: [{ role: 'constituent', text: data.constituentDialogue }]
    };

    $('setupPanel').classList.add('hidden');
    $('finalPanel').classList.add('hidden');
    $('gamePanel').classList.remove('hidden');
    $('choiceSummary').textContent = `${selections.constituent.name} (${selections.constituent.label}) · ${selections.location.name} · ${selections.attitude.name}`;
    $('turnTitle').textContent = `Turn 1 of ${state.maxTurns}`;
    renderScenario(data);
    renderConversation();
    updateMeter(50, 'Wobbly');
    $('playerResponse').focus();
    $('status').classList.add('hidden');
  } catch (error) {
    showStatus(error.message || 'Something went wrong.');
  } finally {
    setBusy(false);
  }
}

async function submitResponse(event) {
  event.preventDefault();
  if (!state) return;

  const text = $('playerResponse').value.trim();
  if (!text) {
    showStatus('Type a response first.');
    return;
  }

  state.history.push({ role: 'player', text });
  $('playerResponse').value = '';
  renderConversation();
  setBusy(true);
  showStatus('Scoring and generating the reply...', true);

  try {
    const data = await apiCall({ action: 'respond', state, playerResponse: text });
    state.turn += 1;
    state.earnedScore += Number(data.score || 0);

    state.history.push({
      role: 'feedback',
      score: Number(data.score || 0),
      explanation: data.scoreExplanation || '',
      runningPercent: data.runningPercent,
      meterLabel: data.meterLabel,
      flags: data.flags || []
    });

    if (data.constituentReply) {
      state.history.push({ role: 'constituent', text: data.constituentReply });
    }

    updateMeter(data.runningPercent, data.meterLabel);
    renderConversation();

    if (data.isFinal && data.finalSummary) {
      renderFinal(data.finalSummary);
    } else {
      $('turnTitle').textContent = `Turn ${state.turn + 1} of ${state.maxTurns}`;
      $('playerResponse').focus();
    }

    $('status').classList.add('hidden');
  } catch (error) {
    showStatus(error.message || 'Something went wrong.');
    renderConversation();
  } finally {
    setBusy(false);
  }
}

function init() {
  fillSelect($('constituentSelect'), CONSTITUENTS, item => `${item.name} — ${item.label}`);
  fillSelect($('locationSelect'), LOCATIONS, item => `${item.name} (${item.turns} turns)`);
  fillSelect($('attitudeSelect'), ATTITUDES, item => `${item.name} (${item.weight})`);
  $('randomizeBtn').addEventListener('click', randomize);
  $('startBtn').addEventListener('click', startGame);
  $('responseForm').addEventListener('submit', submitResponse);
  $('newGameBtn').addEventListener('click', resetGame);
}

init();
