// ============================================================
// admin.js — Configurações · Coruche Digital
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  loadAdmin();
  showTab('config');
});

let adminData = null;

function loadAdmin() {
  adminData = Storage.getData();
  renderConfig();
  renderChallenges();
  renderQuestions();
  renderHistory();
}

function showTab(tab) {
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.toggle('active', s.id === `tab-${tab}`));
  if (tab === 'history') renderHistory();
}

// ── Config ──────────────────────────────────────────────────
function renderConfig() {
  const c = adminData.config;
  sv('cfg-minutes',      c.gameMinutes);
  sv('cfg-players',      c.playersPerTeam);
  sv('cfg-card-time',    c.cardTime);
  sv('cfg-warning',      c.warningAt);
  sv('cfg-danger',       c.dangerAt);
  sv('cfg-r1-plus-min',  c.r1PlusMin);
  sv('cfg-r1-plus-max',  c.r1PlusMax);
  sv('cfg-r1-minus-min', c.r1MinusMin);
  sv('cfg-r1-minus-max', c.r1MinusMax);
  sv('cfg-pts-challenge',c.pointsChallenge);
  sv('cfg-pts-question', c.pointsQuestion);
}

// ── Challenges ──────────────────────────────────────────────
function renderChallenges() {
  document.getElementById('challenges-list').innerHTML =
    adminData.challenges.map((ch, i) => `
      <div class="item-card">
        <span class="item-number">${i+1}</span>
        <div class="item-card-body">
          <input type="text" placeholder="Texto do desafio" value="${esc(ch.text)}"
            oninput="adminData.challenges[${i}].text=this.value">
          <textarea placeholder="Dica / subtítulo" rows="2"
            oninput="adminData.challenges[${i}].sub=this.value">${esc(ch.sub||'')}</textarea>
          <div class="item-card-row">
            <input type="number" placeholder="Pontos" value="${ch.points||20}" style="max-width:100px"
              oninput="adminData.challenges[${i}].points=+this.value">
          </div>
        </div>
        <button class="btn-remove-item" onclick="removeChallenge(${i})">✕</button>
      </div>`).join('');
}

function addChallenge() {
  const maxId = adminData.challenges.reduce((m,c)=>Math.max(m,c.id),0);
  adminData.challenges.push({ id:maxId+1, text:'Novo desafio', sub:'', points:20 });
  renderChallenges();
}

function removeChallenge(idx) {
  if (adminData.challenges.length <= 1) { showMsg('Mínimo 1 desafio.',true); return; }
  adminData.challenges.splice(idx,1);
  renderChallenges();
}

// ── Questions ───────────────────────────────────────────────
function renderQuestions() {
  document.getElementById('questions-list').innerHTML =
    adminData.questions.map((q, i) => `
      <div class="item-card">
        <span class="item-number">${i+1}</span>
        <div class="item-card-body">
          <input type="text" placeholder="Pergunta" value="${esc(q.text)}"
            oninput="adminData.questions[${i}].text=this.value">
          <input type="text" placeholder="Resposta correta" value="${esc(q.answer)}"
            oninput="adminData.questions[${i}].answer=this.value">
          <div class="item-card-row">
            <input type="number" placeholder="Pontos" value="${q.points||10}" style="max-width:100px"
              oninput="adminData.questions[${i}].points=+this.value">
          </div>
        </div>
        <button class="btn-remove-item" onclick="removeQuestion(${i})">✕</button>
      </div>`).join('');
}

function addQuestion() {
  const maxId = adminData.questions.reduce((m,q)=>Math.max(m,q.id),0);
  adminData.questions.push({ id:maxId+1, text:'Nova pergunta', answer:'Resposta', points:10 });
  renderQuestions();
}

function removeQuestion(idx) {
  if (adminData.questions.length <= 1) { showMsg('Mínimo 1 pergunta.',true); return; }
  adminData.questions.splice(idx,1);
  renderQuestions();
}

// ── History ─────────────────────────────────────────────────
function renderHistory() {
  const history = Storage.getHistory();
  const el = document.getElementById('history-container');
  if (!history.length) {
    el.innerHTML = '<div class="history-empty">Ainda não há jogos registados.</div>';
    return;
  }
  const rows = history.map(h => {
    const d = new Date(h.timestamp);
    const tl = Math.max(0, h.timeLeft||0);
    const m  = String(Math.floor(tl/60)).padStart(2,'0');
    const s  = String(tl%60).padStart(2,'0');
    return `<tr>
      <td>${esc(h.team)}</td>
      <td>${h.players}</td>
      <td class="${h.completed?'history-time-ok':'history-time-out'}">${h.completed?`${m}:${s}`:'Esgotado'}</td>
      <td>${h.points||0}</td>
      <td style="color:var(--text3)">${d.toLocaleDateString('pt-PT')} ${d.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})}</td>
    </tr>`;
  }).join('');
  el.innerHTML = `
    <button class="btn-clear-history" onclick="clearHistory()">Limpar histórico</button>
    <table class="history-table">
      <thead><tr><th>Equipa</th><th>Crianças</th><th>Tempo final</th><th>Pontos</th><th>Data</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function clearHistory() {
  if (!confirm('Limpar todo o histórico?')) return;
  Storage.clearHistory(); renderHistory();
}

// ── Save / Reset ────────────────────────────────────────────
function saveAll() {
  const c = adminData.config;
  c.gameMinutes      = iv('cfg-minutes',      10);
  c.playersPerTeam   = iv('cfg-players',      20);
  c.cardTime         = iv('cfg-card-time',    30);
  c.warningAt        = iv('cfg-warning',      120);
  c.dangerAt         = iv('cfg-danger',       30);
  c.r1PlusMin        = iv('cfg-r1-plus-min',  15);
  c.r1PlusMax        = iv('cfg-r1-plus-max',  60);
  c.r1MinusMin       = iv('cfg-r1-minus-min', 10);
  c.r1MinusMax       = iv('cfg-r1-minus-max', 30);
  c.pointsChallenge  = iv('cfg-pts-challenge',20);
  c.pointsQuestion   = iv('cfg-pts-question', 10);
  Storage.saveData(adminData);
  showMsg('Guardado!', false);
}

function resetDefaults() {
  if (!confirm('Repor tudo para os valores de fábrica?')) return;
  adminData = Storage.resetData();
  renderConfig(); renderChallenges(); renderQuestions(); renderHistory();
  showMsg('Valores repostos.', false);
}

function showMsg(text, isErr) {
  const el = document.getElementById('save-msg');
  el.textContent = text;
  el.className = 'save-msg ' + (isErr ? 'err' : 'ok');
  setTimeout(() => { el.textContent=''; el.className='save-msg'; }, 3000);
}

// ── Helpers ─────────────────────────────────────────────────
function sv(id, val) { const el=document.getElementById(id); if(el) el.value=val; }
function iv(id, def) { const el=document.getElementById(id); return el ? (parseInt(el.value)||def) : def; }
function esc(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }