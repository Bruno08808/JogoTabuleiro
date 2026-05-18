// ============================================================
// data.js — Coruche Digital · Jogo da Criação
// ============================================================

// Padrão de casas por lado (9 posições, cantos partilhados)
// pos 0,8 → 'again' (roda de novo) — são os cantos
// pos 1,4,7 → 'challenge' ⚡
// pos 2,3,5,6 → 'question' ❓
const SIDE_PATTERN = ['again','challenge','question','question','challenge','question','question','challenge','again'];

function buildCells() {
  const cells = [];
  for (let i = 0; i < 32; i++) {
    let sidePos;
    if      (i <= 8)  sidePos = i;
    else if (i <= 16) sidePos = i - 8;
    else if (i <= 24) sidePos = i - 16;
    else              sidePos = i - 24;
    cells.push({ id: i, type: SIDE_PATTERN[sidePos] });
  }
  return cells;
}

const DEFAULT_DATA = {
  config: {
    gameMinutes:      10,   // duração total
    playersPerTeam:   20,   // nº crianças = nº lançamentos por ronda
    // Ronda 1 — intervalos das cartas de tempo
    r1PlusMin:        15,   // mínimo segundos a ganhar
    r1PlusMax:        60,   // máximo segundos a ganhar
    r1MinusMin:       10,   // mínimo segundos a perder
    r1MinusMax:       30,   // máximo segundos a perder
    // Ronda 2 — cartas de desafio/pergunta
    cardTime:         30,   // segundos por card
    pointsChallenge:  20,   // pontos por desafio concluído
    pointsQuestion:   10,   // pontos por pergunta certa
    // Aviso visual quando tempo < X segundos
    warningAt:        120,  // 2 minutos
    dangerAt:         30,   // 30 segundos
  },

  cells: buildCells(),

  challenges: [
    { id:1,  text:'Façam o som de um animal todos juntos!',            sub:'Leão? Vaca? Pato? A equipa decide em 3 segundos!',      points:20 },
    { id:2,  text:'Nomeiem 5 animais criados por Deus!',               sub:'Em 10 segundos — todos participam!',                    points:20 },
    { id:3,  text:'Todos de pé! Pose de estátua 10 segundos.',         sub:'Sem se mexer, sem rir — a equipa toda imóvel!',          points:20 },
    { id:4,  text:'Digam 3 coisas que Deus criou no mar!',             sub:'Peixe, baleia, algas... conseguem mais?',                points:20 },
    { id:5,  text:'Cantem uma nota juntos durante 5 segundos!',        sub:'Aaaaaah... todos em harmonia!',                          points:20 },
    { id:6,  text:'Todos aplaudam 10 vezes em uníssono!',              sub:'Completamente sincronizados!',                          points:20 },
    { id:7,  text:'Desenhem no ar: o sol, a lua e uma estrela!',       sub:'Todos ao mesmo tempo!',                                  points:20 },
    { id:8,  text:'Cada criança diz uma palavra que começa por "C"!',  sub:'Criada por Deus — todas diferentes, sem repetir!',       points:30 },
    { id:9,  text:'Façam um som da natureza todos juntos!',            sub:'Vento, chuva, pássaros... escolham e façam!',            points:20 },
    { id:10, text:'Digam "Amén!" todos ao mesmo tempo!',               sub:'O moderador conta até 3 — todos sincronizados!',         points:20 },
  ],

  questions: [
    { id:1,  text:'Qual foi o último dia da criação?',               answer:'O 7º dia — Deus descansou.',                        points:10 },
    { id:2,  text:'O que criou Deus no Dia 1?',                      answer:'A luz, separando a luz das trevas.',                 points:10 },
    { id:3,  text:'O que criou Deus no Dia 2?',                      answer:'O firmamento — separou as águas.',                   points:10 },
    { id:4,  text:'O que criou Deus no Dia 3?',                      answer:'A terra seca, o mar e as plantas.',                  points:10 },
    { id:5,  text:'O que criou Deus no Dia 4?',                      answer:'O sol, a lua e as estrelas.',                        points:10 },
    { id:6,  text:'O que criou Deus no Dia 5?',                      answer:'Os peixes e os pássaros.',                           points:10 },
    { id:7,  text:'O que criou Deus no Dia 6?',                      answer:'Os animais terrestres e o ser humano.',              points:10 },
    { id:8,  text:'Como chamou Deus ao primeiro homem?',              answer:'Adão.',                                             points:10 },
    { id:9,  text:'Como chamou Deus à primeira mulher?',              answer:'Eva.',                                              points:10 },
    { id:10, text:'Em que jardim viviam Adão e Eva?',                 answer:'No Jardim do Éden.',                                points:10 },
    { id:11, text:'Quantos dias demorou Deus a criar o mundo?',       answer:'6 dias — no 7º descansou.',                         points:10 },
    { id:12, text:'O que viu Deus no fim de cada dia de criação?',    answer:'Que era bom.',                                      points:10 },
  ],
};

// ============================================================
// Storage
// ============================================================
const Storage = {
  KEY:          'coruche_game_data',
  HISTORY_KEY:  'coruche_game_history',

  getData() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
      const saved = JSON.parse(raw);
      saved.config     = Object.assign({}, DEFAULT_DATA.config, saved.config);
      saved.cells      = saved.cells      || DEFAULT_DATA.cells;
      saved.challenges = saved.challenges || DEFAULT_DATA.challenges;
      saved.questions  = saved.questions  || DEFAULT_DATA.questions;
      return saved;
    } catch { return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
  },

  saveData(data)  { localStorage.setItem(this.KEY, JSON.stringify(data)); },

  resetData() {
    localStorage.removeItem(this.KEY);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  },

  getHistory() {
    try { return JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]'); }
    catch { return []; }
  },

  addHistoryEntry(entry) {
    const h = this.getHistory();
    h.unshift({ ...entry, timestamp: new Date().toISOString() });
    if (h.length > 100) h.pop();
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(h));
  },

  clearHistory() { localStorage.removeItem(this.HISTORY_KEY); },
};