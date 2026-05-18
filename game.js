// ============================================================
// game.js — Lógica do jogo · Coruche Digital
// ============================================================

function gameInit() {
  G.cfg        = DB.loadConfig();
  G.challenges = DB.loadChallenges();
  G.questions  = DB.loadQuestions();
  // index.html starts directly with the shop picker
  gameNewFlow();
}

// ─── START FLOW ───────────────────────────────────────────
// Called from admin when monitor clicks "Novo Jogo"
async function gameNewFlow() {
  const shops = await DB.draw3Shops();
  if (shops.length === 0) {
    alert('Adiciona pelo menos uma loja no Admin antes de jogar!');
    return;
  }
  UI.showShopPicker(shops);
}

// Called when monitor picks a shop card
function gamePickShop(shop, teamName, totalPlayers, minutes) {
  G.cfg            = DB.loadConfig();
  G.challenges     = DB.loadChallenges();
  G.questions      = DB.loadQuestions();
  G.shopId         = shop.id;
  G.shopName       = shop.name;
  G.shopLogo       = shop.logo;
  G.ownerName      = shop.ownerName || shop.name || '';
  G.teamName       = teamName || shop.ownerName;
  G.totalPlayers   = totalPlayers;
  G.points         = 0;
  G.round          = 1;
  G.throwsR1       = 0;
  G.throwsR2       = 0;
  G.pos            = 0;
  G.secsLeft       = minutes * 60;
  G.timerRunning   = false;
  G.usedChallenges = [];
  G.usedQuestions  = [];
  G.r1Left = G.r1Right = null;
  G.cardDeck = G.cardItem = null;
  stopCardTimer();

  // Mark shop as used today
  DB.markShopUsed(shop.id);

  UI._gameEnded = false;
  UI.showScreen('game');
  UI.updateHeader();
  UI.updateRanking();
  UI.drawBoard();
  timerStart();
  UI.promptDice(1, G.totalPlayers);
}

function isVowel(ch) {
  return 'aeiouáéíóúâêîôûàèìòùAEIOUÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙ'.includes(ch);
}

// ─── TIMER ────────────────────────────────────────────────
function timerStart() {
  if (G._timerInterval) clearInterval(G._timerInterval);
  G.timerRunning = true;
  G._timerInterval = setInterval(() => {
    if (!G.timerRunning) return;
    G.secsLeft--;
    UI.updateTimer();
    if (G.secsLeft <= 0) {
      G.secsLeft = 0;
      timerStop();
      gameEnd(false);
    }
  }, 1000);
}

function timerStop()   { G.timerRunning = false; }
function timerResume() { G.timerRunning = true; }

function gamePause() {
  if (G.timerRunning) { timerStop();   UI.showPause(true);  }
  else                { timerResume(); UI.showPause(false); }
}

// ─── ROLL ─────────────────────────────────────────────────
function gameRoll(steps) {
  G.pos = (G.pos + steps) % BOARD.length;
  UI.drawBoard();
  if (G.round === 1) { G.throwsR1++; handleCellR1(); }
  else               { G.throwsR2++; handleCellR2(); }
  UI.updateTurns();
}

// ─── ROUND 1 ──────────────────────────────────────────────
function handleCellR1() {
  const plusSecs    = randInt(G.cfg.r1PlusMin,  G.cfg.r1PlusMax);
  const minusSecs   = randInt(G.cfg.r1MinusMin, G.cfg.r1MinusMax);
  const plusIsLeft  = Math.random() < 0.5;
  G.r1Left  = plusIsLeft  ? { secs:plusSecs,  isBonus:true  } : { secs:minusSecs, isBonus:false };
  G.r1Right = !plusIsLeft ? { secs:plusSecs,  isBonus:true  } : { secs:minusSecs, isBonus:false };
  UI.showR1Cards();
}

function r1Choose(side) {
  const card  = side === 'left' ? G.r1Left : G.r1Right;
  const delta = card.isBonus ? card.secs : -card.secs;
  G.secsLeft  = Math.max(0, G.secsLeft + delta);
  UI.updateTimer();
  UI.showR1Result(card, () => afterThrow());
}

// ─── ROUND 2 ──────────────────────────────────────────────
function handleCellR2() {
  const cell = BOARD[G.pos];
  if (cell.type === 'corner') {
    UI.showAgain(() => { G.throwsR2--; UI.promptDice(G.throwsR2+1, G.totalPlayers); });
    return;
  }
  G.cardDeck = cell.type === 'challenge' ? 'challenge' : 'question';
  G.cardItem = pickCard(G.cardDeck);
  G.cardSecsLeft = G.cfg.cardTime;
  UI.showCard();
  startCardTimer();
}

function startCardTimer() {
  stopCardTimer();
  G._cardInterval = setInterval(() => {
    if (!G.timerRunning) return;
    G.cardSecsLeft--;
    UI.updateCardTimer();
    if (G.cardSecsLeft <= 0) { stopCardTimer(); UI.cardTimeOut(); }
  }, 1000);
}

function stopCardTimer() {
  if (G._cardInterval) { clearInterval(G._cardInterval); G._cardInterval = null; }
}

function r2ChallengeDone() {
  stopCardTimer();
  G.points += G.cfg.pointsChallenge;
  UI.updatePoints();
  UI._renderRanking(document.getElementById('ranking-list')); // live update
  UI.showCardResult(true, G.cfg.pointsChallenge, () => afterThrow());
}

function r2QuestionAnswer(correct) {
  stopCardTimer();
  if (correct) {
    G.points += G.cfg.pointsQuestion;
    UI.updatePoints();
    UI._renderRanking(document.getElementById('ranking-list')); // live update
  }
  UI.showCardResult(correct, correct ? G.cfg.pointsQuestion : 0, () => afterThrow());
}

function r2CardClosed() { stopCardTimer(); afterThrow(); }

function repeatCard() {
  if (!G.cardItem || !G.cardDeck) return;
  G.cardSecsLeft = G.cfg.cardTime;
  UI.showCard();
  startCardTimer();
}

// ─── AFTER EACH THROW ─────────────────────────────────────
function afterThrow() {
  UI.updateTurns();
  if (G.round === 1) {
    if (G.throwsR1 >= G.totalPlayers) {
      G.round = 2;
      UI.updateHeader();
      UI.showRound2Intro(() => UI.promptDice(1, G.totalPlayers));
    } else {
      UI.promptDice(G.throwsR1+1, G.totalPlayers);
    }
  } else {
    if (G.throwsR2 >= G.totalPlayers) { gameEnd(true); }
    else { UI.promptDice(G.throwsR2+1, G.totalPlayers); }
  }
}

// ─── END ──────────────────────────────────────────────────
async function gameEnd(completed) {
  if (G._timerInterval) clearInterval(G._timerInterval);
  stopCardTimer();
  G.timerRunning = false;
  UI._gameEnded = true; // remove live entry from ranking

  await DB.addGame({
    shopId:    G.shopId,
    shopName:  G.shopName,
    shopLogo:  G.shopLogo,
    teamName:  G.teamName,
    ownerName: G.ownerName,
    players:   G.totalPlayers,
    completed,
    secsLeft:  G.secsLeft,
    points:    G.points,
    fake:      false,
  });

  await UI.refreshRanking(); // force fresh load from Supabase
  UI.showEnd();
}

// ─── UTILS ────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickCard(deck) {
  const arr  = deck === 'challenge' ? G.challenges : G.questions;
  const used = deck === 'challenge' ? G.usedChallenges : G.usedQuestions;
  let avail  = arr.filter(c => !used.includes(c.id));
  if (!avail.length) {
    if (deck === 'challenge') G.usedChallenges = [];
    else                      G.usedQuestions  = [];
    avail = arr;
  }
  const item = avail[Math.floor(Math.random() * avail.length)];
  used.push(item.id);
  return item;
}

function fmtTime(s) {
  s = Math.max(0, s);
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
}

function ordinal(n) {
  const s = ['º','º','º','º'];
  return n + (s[n-1] || 'º');
}