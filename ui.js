// ============================================================
// ui.js — Interface · Coruche Digital
// ============================================================

const UI = {

  // ─── SCREENS ────────────────────────────────────────────
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
    if (name === 'game') requestAnimationFrame(() => this.drawBoard());
  },

  // ─── HEADER ─────────────────────────────────────────────
  updateHeader() {
    const el = document.getElementById('hdr-team');
    if (el) {
      el.textContent = G.teamName;
      // Show shop logo if available
      const logoEl = document.getElementById('hdr-shop-logo');
      if (logoEl) {
        logoEl.src   = G.shopLogo || 'logo.png';
        logoEl.style.display = '';
      }
    }
    const badge = document.getElementById('hdr-round');
    if (badge) {
      badge.textContent = G.round === 1 ? 'Ronda 1 — Cartas de Tempo' : 'Ronda 2 — Desafios & Perguntas';
      badge.className   = 'round-badge ' + (G.round === 1 ? 'r1' : 'r2');
    }
    this.updateTimer();
    this.updatePoints();
    this.updateTurns();
  },

  updateTimer() {
    const el   = document.getElementById('hdr-timer');
    const warn = document.getElementById('hdr-warning');
    if (!el) return;
    const s = G.secsLeft;
    el.textContent = fmtTime(s);
    // Need config for warning thresholds
    if (!G.cfg) { el.className = 'timer'; return; }
    el.className = 'timer' + (s <= G.cfg.dangerSeconds ? ' danger' : s <= G.cfg.warningSeconds ? ' warn' : '');
    if (warn) {
      if (s <= G.cfg.dangerSeconds) {
        warn.textContent = '⚠️ Menos de ' + G.cfg.dangerSeconds + 's!';
        warn.className   = 'timer-warn danger';
      } else if (s <= G.cfg.warningSeconds) {
        warn.textContent = '⏳ Menos de ' + Math.round(G.cfg.warningSeconds/60) + ' min!';
        warn.className   = 'timer-warn warn';
      } else {
        warn.textContent = '';
        warn.className   = 'timer-warn';
      }
    }
  },

  updatePoints() {
    const el = document.getElementById('hdr-points');
    if (el) el.textContent = G.points + ' pts';
    // ranking only updates from DB at end of game — no live poll during play
  },

  updateTurns() {
    const el = document.getElementById('hdr-throws');
    if (!el) return;
    const t = G.round === 1 ? G.throwsR1 : G.throwsR2;
    el.textContent = t + ' / ' + G.totalPlayers;
  },

  // ─── PAUSE ──────────────────────────────────────────────
  showPause(on) {
    const ov  = document.getElementById('overlay-pause');
    const btn = document.getElementById('btn-pause');
    if (ov)  ov.style.display  = on ? 'flex' : 'none';
    if (btn) btn.textContent   = on ? '▶ Continuar' : '⏸ Pausa';
  },

  // ─── RANKING (right panel) ───────────────────────────────
  async updateRanking() {
    const el = document.getElementById('ranking-list');
    if (!el) return;
    const ranking = await DB.todayRanking();
    if (!ranking.length) {
      el.innerHTML = '<div class="ranking-empty">Os resultados de hoje aparecem aqui</div>';
      return;
    }
    el.innerHTML = ranking.map((g, i) => {
      const pos    = i + 1;
      const medal  = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos + 'º';
      const isFake = g.fake ? ' fake' : '';
      const logoSrc = g.shopLogo || 'logo.png';
      const logo    = `<img src="${logoSrc}" class="ranking-logo" alt="">`;
      return `
        <div class="ranking-row${isFake}">
          <span class="rank-pos">${medal}</span>
          <span class="rank-logo">${logo}</span>
          <div class="rank-info">
            <span class="rank-name">${esc(g.teamName)}</span>
            ${g.fake ? '<span class="rank-fake-tag">exemplo</span>' : ''}
          </div>
          <span class="rank-pts">${g.points}<small>pts</small></span>
        </div>`;
    }).join('');
  },

  // ─── DICE ───────────────────────────────────────────────
  promptDice(childNum, total) {
    const msg = document.getElementById('dice-msg');
    if (msg) msg.textContent = '🎲 Criança ' + childNum + ' de ' + total + ' — lança o dado!';
    const sec = document.getElementById('dice-section');
    if (sec) sec.style.display = '';
    document.querySelectorAll('.die-btn').forEach(b => b.classList.remove('active'));
    const roll = document.getElementById('btn-roll');
    if (roll) { roll.disabled = true; roll.dataset.val = ''; }
  },

  hideDice() {
    const sec = document.getElementById('dice-section');
    if (sec) sec.style.display = 'none';
  },

  // ─── BOARD ──────────────────────────────────────────────
  drawBoard() {
    const wrap = document.getElementById('board-wrap');
    if (!wrap) return;
    const svg = document.getElementById('board-svg');
    if (!svg) return;
    const VB = 600;
    svg.setAttribute('viewBox', '0 0 ' + VB + ' ' + VB);

    const CR = 72;
    const CW = Math.floor((VB - 2*CR) / 7);
    const CH = CR;

    svg.innerHTML = this._boardHTML(VB, CR, CW, CH);
  },

  _buildLayout(VB, CR, CW, CH) {
    const L = new Array(32);
    L[0]  = { x:0,       y:VB-CR,      w:CR, h:CR, dir:'corner' };
    for (let i=1;i<=7;i++) L[i]    = { x:0,       y:VB-CR-i*CW, w:CH, h:CW, dir:'right' };
    L[8]  = { x:0,       y:0,          w:CR, h:CR, dir:'corner' };
    for (let i=1;i<=7;i++) L[8+i]  = { x:CR+(i-1)*CW, y:0,      w:CW, h:CH, dir:'down' };
    L[16] = { x:VB-CR,   y:0,          w:CR, h:CR, dir:'corner' };
    for (let i=1;i<=7;i++) L[16+i] = { x:VB-CH, y:CR+(i-1)*CW,  w:CH, h:CW, dir:'left' };
    L[24] = { x:VB-CR,   y:VB-CR,      w:CR, h:CR, dir:'corner' };
    for (let i=1;i<=7;i++) L[24+i] = { x:VB-CR-i*CW, y:VB-CH,   w:CW, h:CH, dir:'up' };
    return L;
  },

  _boardHTML(VB, CR, CW, CH) {
    const layout = this._buildLayout(VB, CR, CW, CH);
    const ix = CH, iy = CH, iw = VB-2*CH, ih = VB-2*CH;
    const cx = ix+iw/2, cy = iy+ih/2;

    const isLight = document.documentElement.dataset.theme === 'light';
    const TYPE_STYLE = isLight ? {
      corner:    { bg:'#ffffff', stroke:'#008f5e', icon:'🎲' },
      challenge: { bg:'#ffffff', stroke:'#0f5cc8', icon:'⚡' },
      question:  { bg:'#ffffff', stroke:'#7020c8', icon:'❓' },
    } : {
      corner:    { bg:'#0a2010', stroke:'#00e5a0', icon:'🎲' },
      challenge: { bg:'#0a1530', stroke:'#1a8cff', icon:'⚡' },
      question:  { bg:'#18082a', stroke:'#c77dff', icon:'❓' },
    };

    // Cells
    let cellsHTML = BOARD.map((cell, i) => {
      const L  = layout[i];
      if (!L) return '';
      const st = TYPE_STYLE[cell.type] || TYPE_STYLE.challenge;
      const cx2 = L.x + L.w/2, cy2 = L.y + L.h/2;
      const minD  = Math.min(L.w, L.h);
      const isC   = L.dir === 'corner';
      const isCur = i === G.pos;

      const rot = { right:90, left:-90, up:180, down:0 }[L.dir] || 0;

      // Strip on inner edge
      const sw = Math.round(minD * 0.16);
      const stripOpacity = isLight ? '0.35' : '0.2';
      const strips = {
        right: `<rect x="${L.x+L.w-sw}" y="${L.y}" width="${sw}" height="${L.h}" fill="${st.stroke}" opacity="${stripOpacity}"/>`,
        left:  `<rect x="${L.x}"         y="${L.y}" width="${sw}" height="${L.h}" fill="${st.stroke}" opacity="${stripOpacity}"/>`,
        down:  `<rect x="${L.x}" y="${L.y+L.h-sw}" width="${L.w}" height="${sw}" fill="${st.stroke}" opacity="${stripOpacity}"/>`,
        up:    `<rect x="${L.x}"         y="${L.y}" width="${L.w}" height="${sw}" fill="${st.stroke}" opacity="${stripOpacity}"/>`,
      };

      const iconSize = Math.round(minD * (isC ? 0.3 : 0.38));
      const textContent = isC
        ? `<text x="${cx2}" y="${cy2-minD*0.1}" text-anchor="middle" dominant-baseline="middle" font-size="${iconSize}px">${st.icon}</text>
           <text x="${cx2}" y="${cy2+minD*0.28}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${Math.round(minD*0.1)}px" fill="${st.stroke}">RODA DE NOVO</text>`
        : `<g transform="rotate(${rot},${cx2},${cy2})">
             <text x="${cx2}" y="${cy2}" text-anchor="middle" dominant-baseline="middle" font-size="${iconSize}px">${st.icon}</text>
           </g>`;

      // Pawn
      const pawn = isCur
        ? `<circle cx="${cx2}" cy="${cy2}" r="${Math.round(minD*0.22)}" fill="${isLight ? '#e63030' : '#ff4040'}" stroke="white" stroke-width="2.5" opacity="0.9"/>`
        : '';

      return `<g>
        <rect x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" fill="${st.bg}" stroke="${st.stroke}" stroke-width="${isCur ? 3 : (isLight ? 2 : 1.5)}"/>
        ${!isC ? (strips[L.dir]||'') : ''}
        ${textContent}
        ${pawn}
      </g>`;
    }).join('');

    // Center area with UNO-style cards
    const centerHTML = this._centerHTML(ix, iy, iw, ih, cx, cy);

    return `
      <rect x="0" y="0" width="${VB}" height="${VB}" fill="${isLight ? '#dce6ff' : '#080d1a'}"/>
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="8" fill="${isLight ? '#eef2ff' : '#090e1c'}" stroke="${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.04)'}" stroke-width="1"/>
      ${centerHTML}
      ${cellsHTML}
    `;
  },

  _centerHTML(ix, iy, iw, ih, cx, cy) {
    // Logo top-center, subtle
    const logoW = Math.round(iw * 0.38);
    const logoH = Math.round(logoW * 0.44);
    const logoX = cx - logoW/2;
    const logoY = iy + Math.round(ih * 0.04);

    // Two cards — IDENTICAL dimensions, calculated once
    const deckH  = Math.round(ih * 0.5);
    const deckW  = Math.round(deckH * 0.72); // aspect ratio 1056×1408 = 0.75
    const gap    = Math.round(iw * 0.06);
    const deckY  = logoY + logoH + Math.round(ih * 0.04);
    const deck1X = Math.round(cx - gap/2 - deckW);
    const deck2X = Math.round(cx + gap/2);
    // Force both to exact same int dimensions
    const cardW  = deckW;
    const cardH  = deckH;
    const labelY = deckY + cardH + Math.round(cardH * 0.1);
    const labelFs= Math.round(cardH * 0.1);

    return `
      <image href="logo.png" x="${logoX}" y="${logoY}" width="${logoW}" height="${logoH}"
        preserveAspectRatio="xMidYMid meet" opacity="0.15"/>
      ${this._unoCard(deck1X, deckY, cardW, cardH, 'challenge')}
      ${this._unoCard(deck2X, deckY, cardW, cardH, 'question')}
      <text x="${deck1X+deckW/2}" y="${labelY}" text-anchor="middle"
        font-family="Arial,sans-serif" font-weight="bold" font-size="${labelFs}px"
        fill="${isLight ? '#1472e8' : 'rgba(90,171,255,0.85)'}">Desafios</text>
      <text x="${deck2X+deckW/2}" y="${labelY}" text-anchor="middle"
        font-family="Arial,sans-serif" font-weight="bold" font-size="${labelFs}px"
        fill="${isLight ? '#8b44e8' : 'rgba(199,125,255,0.85)'}">Perguntas</text>
    `;
  },

  // UNO card back design
  _unoCard(x, y, w, h, type) {
    const isC  = type === 'challenge';
    const edge = isC ? '#1a8cff' : '#c77dff';
    const r    = Math.round(w * 0.12);
    const img  = isC ? 'card-challenge.png' : 'card-question.png';

    // Stack effect (3 cards behind)
    let stack = '';
    for (let i=3;i>=1;i--) {
      stack += `<rect x="${x+i*4}" y="${y-i*3}" width="${w}" height="${h}" rx="${r}"
        fill="${isC ? '#0a1830' : '#1a0828'}" stroke="${edge}" stroke-width="1"
        opacity="${0.1+i*0.08}"/>`;
    }

    // Card image with rounded clip
    const uid = 'uc-' + type;
    return `<g>
      ${stack}
      <defs>
        <clipPath id="${uid}">
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>
        </clipPath>
      </defs>
      <image href="${img}" x="${x}" y="${y}" width="${w}" height="${h}"
        preserveAspectRatio="xMidYMid meet"
        clip-path="url(#${uid})"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"
        fill="none" stroke="${edge}" stroke-width="2.5"/>
    </g>`;
  },

  // ─── SHOP PICKER ────────────────────────────────────────
  showShopPicker(shops) {
    const cfg = DB.loadConfig();
    document.getElementById('picker-players').value = cfg.playersPerTeam;
    document.getElementById('picker-minutes').value = cfg.gameMinutes;

    const container = document.getElementById('shop-cards');
    container.innerHTML = '';
    // Reset name step
    document.getElementById('picker-name-step').style.display = 'none';
    document.getElementById('shop-cards').style.display = '';
    document.querySelector('.picker-title').textContent = 'Escolhe o vosso símbolo!';

    shops.forEach(shop => {
      const card = document.createElement('div');
      card.className = 'shop-card shop-card-logo-only';
      card.onclick   = () => uiPickShop(shop.id);

      const logoDiv = document.createElement('div');
      logoDiv.className = 'shop-card-logo';
      const img = document.createElement('img');
      img.src = shop.logo || 'logo.png';
      img.alt = '';
      logoDiv.appendChild(img);

      card.appendChild(logoDiv);
      container.appendChild(card);
    });

    window._pickerShops = shops;
    this.showOverlay('overlay-picker');
  },

  // ─── R1 CARDS ───────────────────────────────────────────
  showR1Cards() {
    this.hideDice();

    // Randomise which card image shows on each side (so it's truly a mystery)
    const flip = Math.random() < 0.5;
    const leftImg  = document.getElementById('r1-left-img');
    const rightImg = document.getElementById('r1-right-img');
    if (leftImg)  leftImg.src  = flip ? 'card-challenge.png' : 'card-question.png';
    if (rightImg) rightImg.src = flip ? 'card-question.png'  : 'card-challenge.png';

    ['left','right'].forEach(s => {
      document.getElementById('r1-'+s+'-inner').classList.remove('flipped');
      document.getElementById('r1-'+s+'-front').innerHTML = '';
    });
    document.getElementById('r1-result').textContent  = '';
    document.getElementById('r1-result').className    = 'r1-result';
    document.getElementById('btn-r1-next').style.display = 'none';
    document.getElementById('r1-left').onclick  = () => uiR1ChooseCard('left');
    document.getElementById('r1-right').onclick = () => uiR1ChooseCard('right');
    document.getElementById('r1-left').classList.remove('chosen','disabled');
    document.getElementById('r1-right').classList.remove('chosen','disabled');
    this.showOverlay('overlay-r1');
  },

  showR1Result(card, cb) {
    const res = document.getElementById('r1-result');
    res.textContent = card.isBonus
      ? '+' + card.secs + ' segundos ganhos! ⭐'
      : '-' + card.secs + ' segundos perdidos! ⏱️';
    res.className = 'r1-result ' + (card.isBonus ? 'win' : 'lose');
    const btn = document.getElementById('btn-r1-next');
    btn.style.display = '';
    btn.onclick = () => { this.hideOverlay('overlay-r1'); cb(); };
  },

  // ─── ROUND 2 INTRO ──────────────────────────────────────
  showRound2Intro(cb) {
    document.getElementById('r2intro-time').textContent = fmtTime(G.secsLeft);
    document.getElementById('btn-r2intro').onclick = () => {
      this.hideOverlay('overlay-r2intro');
      cb();
    };
    this.showOverlay('overlay-r2intro');
  },

  // ─── R2 CARD ────────────────────────────────────────────
  showCard() {
    this.hideDice();
    const isC = G.cardDeck === 'challenge';
    document.getElementById('r2-card-box').className = 'r2-card-box ' + (isC ? 'challenge' : 'question');
    document.getElementById('r2-deck-label').textContent = isC ? '⚡ Desafio' : '❓ Pergunta';
    document.getElementById('r2-card-text').textContent  = G.cardItem.text;
    document.getElementById('r2-card-hint').textContent  = isC ? (G.cardItem.hint||'') : '';
    document.getElementById('r2-card-pts').textContent   = '+' + (isC ? G.cfg.pointsChallenge : G.cfg.pointsQuestion) + ' pontos';
    document.getElementById('r2-answer-box').style.display  = 'none';
    document.getElementById('r2-answer-text').textContent   = '';
    document.getElementById('r2-result-text').textContent   = '';
    document.getElementById('r2-result-text').className     = 'r2-result';
    document.getElementById('btn-r2-done').style.display    = isC ? '' : 'none';
    document.getElementById('btn-r2-reveal').style.display  = isC ? 'none' : '';
    document.getElementById('btn-r2-repeat').style.display  = '';
    document.getElementById('r2-answer-btns').innerHTML     = '';
    document.getElementById('btn-r2-close').style.display   = 'none';
    this.updateCardTimer();
    document.getElementById('r2-timer-arc').style.stroke = isC ? '#1a8cff' : '#c77dff';
    this.showOverlay('overlay-r2');
  },

  updateCardTimer() {
    const cur   = Math.max(0, G.cardSecsLeft);
    const total = G.cfg.cardTime;
    document.getElementById('r2-secs').textContent = cur;
    const arc   = document.getElementById('r2-timer-arc');
    const circ  = 2 * Math.PI * 50;
    arc.style.strokeDasharray  = circ;
    arc.style.strokeDashoffset = circ * (1 - cur/total);
    if (cur <= 5) arc.style.stroke = '#ff3d5a';
  },

  cardTimeOut() {
    document.getElementById('r2-result-text').textContent = 'Tempo esgotado!';
    document.getElementById('r2-result-text').className   = 'r2-result lose';
    document.getElementById('btn-r2-done').style.display   = 'none';
    document.getElementById('btn-r2-reveal').style.display = 'none';
    document.getElementById('btn-r2-repeat').style.display = 'none';
    document.getElementById('r2-answer-btns').innerHTML    = '';
    if (G.cardDeck === 'question' && G.cardItem) {
      document.getElementById('r2-answer-box').style.display = '';
      document.getElementById('r2-answer-text').textContent  = G.cardItem.answer;
    }
    const btn = document.getElementById('btn-r2-close');
    btn.style.display = '';
    btn.onclick = () => { this.hideOverlay('overlay-r2'); r2CardClosed(); };
  },

  showCardResult(correct, pts, cb) {
    document.getElementById('r2-result-text').textContent = correct
      ? '+' + pts + ' pontos! 🎉'
      : 'Resposta errada. Continuem!';
    document.getElementById('r2-result-text').className = 'r2-result ' + (correct ? 'win' : 'lose');
    document.getElementById('btn-r2-done').style.display   = 'none';
    document.getElementById('btn-r2-reveal').style.display = 'none';
    document.getElementById('btn-r2-repeat').style.display = 'none';
    document.getElementById('r2-answer-btns').innerHTML    = '';
    if (correct) triggerConfetti();
    const btn = document.getElementById('btn-r2-close');
    btn.style.display = '';
    btn.onclick = () => { this.hideOverlay('overlay-r2'); cb(); };
  },

  // ─── AGAIN ──────────────────────────────────────────────
  showAgain(cb) {
    this.hideDice();
    document.getElementById('btn-again').onclick = () => { this.hideOverlay('overlay-again'); cb(); };
    this.showOverlay('overlay-again');
  },

  // ─── END ────────────────────────────────────────────────
  async showEnd() {
    if (!G.cfg) return;
    document.getElementById('end-emoji').textContent   = G.secsLeft > 0 ? '🏆' : '⏰';
    document.getElementById('end-title').textContent   = G.secsLeft > 0 ? 'Missão cumprida!' : 'O tempo acabou!';
    document.getElementById('end-team').textContent    = G.teamName;
    document.getElementById('end-time').textContent    = fmtTime(G.secsLeft);
    document.getElementById('end-points').textContent  = G.points;
    const ranking  = await DB.todayRanking();
    const myRank   = ranking.findIndex(g => !g.fake && g.points === G.points);
    const ordinals = ['1ª','2ª','3ª','4ª','5ª','6ª','7ª','8ª','9ª','10ª'];
    const countEl  = document.getElementById('end-team-count');
    if (countEl) countEl.textContent = (ordinals[myRank] || (myRank+1)+'ª') + ' equipa hoje · ' + ranking.length + ' jogos';
    // Refresh ranking panel with final data before showing end screen
    this.updateRanking();
    this.showScreen('end');
  },

  // ─── HELPERS ────────────────────────────────────────────
  showOverlay(id) { const el=document.getElementById(id); if(el) el.style.display='flex'; },
  hideOverlay(id) { const el=document.getElementById(id); if(el) el.style.display='none'; },
};

// ─── GLOBAL HANDLERS ──────────────────────────────────────
function uiR1ChooseCard(side) {
  const other = side === 'left' ? 'right' : 'left';
  // Disable both cards immediately to prevent double-click
  document.getElementById('r1-left').onclick  = null;
  document.getElementById('r1-right').onclick = null;
  document.getElementById('r1-' + other).classList.add('disabled');
  document.getElementById('r1-' + side).classList.add('chosen');

  // Flip the chosen card
  const inner = document.getElementById('r1-' + side + '-inner');
  inner.classList.add('flipped');

  // Show the value on the front after flip animation
  const card = side === 'left' ? G.r1Left : G.r1Right;
  setTimeout(() => {
    const front = document.getElementById('r1-' + side + '-front');
    front.innerHTML = card.isBonus
      ? '<span class="r1-val bonus">+' + card.secs + 's</span><span class="r1-val-label">segundos ganhos!</span>'
      : '<span class="r1-val malus">-' + card.secs + 's</span><span class="r1-val-label">segundos perdidos</span>';
    // Now tell game logic
    r1Choose(side);
  }, 420);
}

function uiSelectDie(val) {
  document.querySelectorAll('.die-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.v)===val));
  const btn = document.getElementById('btn-roll');
  btn.disabled = false;
  btn.dataset.val = val;
}

function uiRoll() {
  const btn = document.getElementById('btn-roll');
  const val = parseInt(btn.dataset.val);
  if (!val) return;
  btn.disabled = true;
  btn.dataset.val = '';
  document.querySelectorAll('.die-btn').forEach(b => b.classList.remove('active'));
  gameRoll(val);
}

function uiPause() { gamePause(); }

function uiRevealAnswer() {
  if (!G.cardItem) return;
  document.getElementById('r2-answer-box').style.display  = '';
  document.getElementById('r2-answer-text').textContent   = G.cardItem.answer;
  document.getElementById('btn-r2-reveal').style.display  = 'none';
  document.getElementById('r2-answer-btns').innerHTML = `
    <button class="btn-correct" onclick="r2QuestionAnswer(true)">✓ Certa</button>
    <button class="btn-wrong"   onclick="r2QuestionAnswer(false)">✗ Errada</button>`;
}

function uiPickShop(shopId) {
  const shop = (window._pickerShops || []).find(s => s.id === shopId);
  if (!shop) return;

  // Store selected shop, highlight it
  window._selectedShop = shop;
  document.querySelectorAll('.shop-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  // Show name step, hide logo picker
  document.getElementById('shop-cards').style.display = 'none';
  document.getElementById('picker-name-step').style.display = '';
  document.querySelector('.picker-title').textContent = 'Como se chama a vossa equipa?';
  document.querySelector('.picker-sub').style.display = 'none';

  // Pre-fill config defaults
  const cfg = DB.loadConfig();
  document.getElementById('picker-players').value = cfg.playersPerTeam;
  document.getElementById('picker-minutes').value = cfg.gameMinutes;

  // Focus the name input
  setTimeout(() => document.getElementById('picker-team-name').focus(), 100);
}

function uiConfirmShop() {
  const shop    = window._selectedShop;
  const name    = document.getElementById('picker-team-name').value.trim();
  const players = parseInt(document.getElementById('picker-players').value) || G.cfg.playersPerTeam;
  const minutes = parseInt(document.getElementById('picker-minutes').value) || G.cfg.gameMinutes;
  if (!shop) return;
  if (!name) {
    document.getElementById('picker-team-name').focus();
    document.getElementById('picker-team-name').style.borderColor = '#ff3d5a';
    return;
  }
  UI.hideOverlay('overlay-picker');
  gamePickShop(shop, name, players, minutes);
}

function uiCancelShopPick() {
  // Go back to logo selection
  window._selectedShop = null;
  document.getElementById('shop-cards').style.display = '';
  document.getElementById('picker-name-step').style.display = 'none';
  document.querySelector('.picker-title').textContent = 'Escolhe o vosso símbolo!';
  document.querySelector('.picker-sub').style.display = '';
  document.getElementById('picker-team-name').value = '';
  document.getElementById('picker-team-name').style.borderColor = '';
  document.querySelectorAll('.shop-card').forEach(c => c.classList.remove('selected'));
}

function uiNewTeam() { window.location.href = 'admin.html'; }

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── CONFETTI ─────────────────────────────────────────────
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth; canvas.height = innerHeight;
  const P = Array.from({length:70}, () => ({
    x: Math.random()*canvas.width, y:-20,
    w: Math.random()*10+5, h: Math.random()*6+3,
    c: ['#00e5a0','#1a8cff','#c77dff','#ffb347','#ff4040'][Math.floor(Math.random()*5)],
    sp: Math.random()*4+2, a: Math.random()*360,
    spin:(Math.random()-.5)*8, dr:(Math.random()-.5)*2,
  }));
  let raf;
  (function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive=false;
    P.forEach(p => {
      p.y+=p.sp; p.x+=p.dr; p.a+=p.spin;
      if(p.y<canvas.height+20) alive=true;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a*Math.PI/180);
      ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });
    if(alive) raf=requestAnimationFrame(draw);
  })();
  setTimeout(()=>{ cancelAnimationFrame(raf); ctx.clearRect(0,0,canvas.width,canvas.height); },3500);
}