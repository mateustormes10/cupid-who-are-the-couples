const STORAGE_KEY = 'dtd_lang';

const DICTS = {
  en: {
    'app.title': 'Cupid: Who are the couples?',
    'app.subtitle': 'Cupid • Bonding • Chaos',
    'menu.play': 'Play',
    'menu.chooseLevel': 'Pick a short stage and create compatible bonds… or not.',
    'menu.options': 'Options',
    'menu.volume': 'Volume',
    'menu.mute': 'Mute (M)',
    'menu.unmute': 'Unmute (M)',
    'menu.credits': 'Credits',
    'menu.hintMouse': 'Mouse: aim + click to shoot',
    'menu.hintKeys': 'ESC: pause • R: restart • F3: debug',
    'menu.footer': 'Offline • Singleplayer • Cameo: Gobbo',
    'menu.language': 'Language',
    'menu.achievements': 'Achievements',
    'ach.locked': 'Locked',
    'ach.unlocked': 'Unlocked',

    'credits.title': 'Credits',
    'credits.dev': 'Developer: {name}',
    'credits.devLabel': 'Developer:',
    'credits.body': '',
    'credits.note': 'Note: this project downloads nothing at runtime. Everything runs offline.',

    'pause.title': 'Paused',
    'pause.resume': 'Resume (ESC)',
    'pause.restart': 'Restart (R)',
    'pause.menu': 'Menu',

    'end.victory': 'Victory!',
    'end.defeat': 'Defeat!',
    'end.next': 'Next stage',
    'end.retry': 'Retry (R)',
    'end.menu': 'Menu',
    'end.bestFirst': 'First local record for this stage!',
    'end.bestFmt': 'Best: {total} pts • {stars}★',
    'end.summaryFmt': '{reason}\nTotal: {total} pts • Accuracy: {acc}% • Shots: {shots} • Misbinds: {misbinds}\n{best}',

    'hud.level': 'Stage: {name}',
    'hud.score': 'Score: {score}',
    'hud.combo': 'Combo: x{combo}',
    'hud.arrows': 'Arrows: {left}/{max}',
    'hud.arrowsSolo': 'Arrows: {left}',
    'hud.chaos': 'Chaos: {pct}%',

    'toast.noArrows': 'No arrows left. Press (R) to restart.',
    'toast.godMission': 'God: Mission — bond {goal} compatible {couples}.',

    'event.awaiting': 'First target tagged (5s): wait for the second tap…',
    'event.timeout': 'Time is up. The target got sad (penalty).',
    'event.boundSuccess': 'Bond created! Compatibility {pct}% — aww.',
    'event.boundRejected': 'Rejected. Compatibility {pct}% — bad idea.',
    'event.missSecond': 'Second shot missed… destiny is confused.',
    'event.missIdleA': 'Whoosh!',
    'event.missIdleB': 'Nothing hit.',
    'event.missIdleC': 'Cupid blinked and missed.',
    'event.misbind': 'Misbind! {a} is now linked with {b}… this will go wrong.',
    'event.objectLove': 'Unexpected: {npc} fell in love with a {obj}.',
    'event.gobboMushroom': 'Gobbo fell in love with a mushroom. Mycological romance!',
    'event.rockEyes': 'The rock grew eyes and decided to follow someone. Normal.',
    'event.redlight': 'Redlight flashed: “Relationship detected outside protocol!”',
    'event.metic': 'Metic opened a spreadsheet: “This… should not be possible.”',

    'npc.hint.music': 'Hint: music brings hearts closer.',
    'npc.hint.calm': 'Hint: staying calm helps things work out.',
    'npc.hint.night': 'Hint: at night, everything feels more romantic.',
    'npc.hint.sports': 'Hint: couples who train together stay together.',
    'npc.hint.reading': 'Hint: a good conversation is priceless.',
    'npc.hint.art': 'Hint: art and emotion go well together.',
    'npc.hint.rules': "Hint: love doesn't always follow rules... but respect helps.",
    'npc.hint.likeTrait': 'Hint: look for people with something in common.',
    'npc.hint.ref': 'Hint: {name} responds well to that.',
    'npc.hint.refGeneric': 'Hint: they respond well to that.',
    'npc.gobbo.mushroom': 'Mushrooms... romantic... maybe.',
    'npc.metic.prob': 'Probability of mutual affection: {pct}%.',

    'reason.chaos': 'Chaos meter exploded. Love turned into entropy.',
    'reason.allPairs': 'All pairs were united (more or less).',
    'reason.noArrows': 'Out of arrows before bonding the pairs.',

    'brief.title': 'Mission briefing',
    'brief.line1': 'Mission: bond {goal} compatible {couples}.',
    'brief.line2': 'How it works: 1st shot tags (5s). 2nd shot attempts a bond.',
    'brief.line3': 'Clues: complementary color + proximity + dialogue hints.',
    'brief.line4': 'Miss? You can misbind with objects and raise Chaos.',
    'brief.line5': 'Controls: Mouse shoots • WASD moves • ESC pauses • R restarts.',

    'level.park': 'Park',
    'level.medieval': 'Medieval village',
    'level.modern': 'Modern city',
    'level.festival': 'Festival',
    'level.final': 'Final: Total chaos',

    'obj.rock': 'Rock',
    'obj.mushroom': 'Mushroom',
    'obj.crate': 'Crate',
    'label.cupid': 'Cupid',
    'unit.couple1': 'couple',
    'unit.coupleN': 'couples'
  },

  es: {
    'app.title': 'Cupido: ¿Quiénes son las parejas?',
    'app.subtitle': 'Cupido • Vínculos • Caos',
    'menu.play': 'Jugar',
    'menu.chooseLevel': 'Elige una fase corta y crea vínculos compatibles… o no.',
    'menu.options': 'Opciones',
    'menu.volume': 'Volumen',
    'menu.mute': 'Silenciar (M)',
    'menu.unmute': 'Activar sonido (M)',
    'menu.credits': 'Créditos',
    'menu.hintMouse': 'Ratón: apuntar + clic para disparar',
    'menu.hintKeys': 'ESC: pausar • R: reiniciar • F3: debug',
    'menu.footer': 'Offline • Un jugador • Cameo: Gobbo',
    'menu.language': 'Idioma',
    'menu.achievements': 'Logros',
    'ach.locked': 'Bloqueado',
    'ach.unlocked': 'Desbloqueado',

    'credits.title': 'Créditos',
    'credits.dev': 'Desarrollador: {name}',
    'credits.devLabel': 'Desarrollador:',
    'credits.body': '',
    'credits.note': 'Nota: este proyecto no descarga nada en tiempo de ejecución. Todo funciona offline.',

    'pause.title': 'Pausado',
    'pause.resume': 'Continuar (ESC)',
    'pause.restart': 'Reiniciar (R)',
    'pause.menu': 'Menú',

    'end.victory': '¡Victoria!',
    'end.defeat': '¡Derrota!',
    'end.next': 'Siguiente fase',
    'end.retry': 'Reintentar (R)',
    'end.menu': 'Menú',
    'end.bestFirst': '¡Primer récord local de esta fase!',
    'end.bestFmt': 'Mejor: {total} pts • {stars}★',
    'end.summaryFmt': '{reason}\nTotal: {total} pts • Precisión: {acc}% • Disparos: {shots} • Misbinds: {misbinds}\n{best}',

    'hud.level': 'Fase: {name}',
    'hud.score': 'Puntos: {score}',
    'hud.combo': 'Combo: x{combo}',
    'hud.arrows': 'Flechas: {left}/{max}',
    'hud.arrowsSolo': 'Flechas: {left}',
    'hud.chaos': 'Chaos: {pct}%',

    'toast.noArrows': 'No quedan flechas. Pulsa (R) para reiniciar.',
    'toast.godMission': 'God: Misión — une {goal} {couples} compatible(s).',

    'event.awaiting': 'Primer objetivo marcado (5s): espera el segundo tap…',
    'event.timeout': 'Se acabó el tiempo. El objetivo se entristeció (penalización).',
    'event.boundSuccess': '¡Vínculo creado! Compatibilidad {pct}% — qué lindo.',
    'event.boundRejected': 'Rechazado. Compatibilidad {pct}% — mala idea.',
    'event.missSecond': 'El segundo disparo falló… el destino se confundió.',
    'event.missIdleA': '¡Whoosh!',
    'event.missIdleB': 'Nada fue alcanzado.',
    'event.missIdleC': 'Cupido parpadeó y falló.',
    'event.misbind': '¡Misbind! {a} ahora está vinculado con {b}… esto saldrá mal.',
    'event.objectLove': 'Inesperado: {npc} se enamoró de un(a) {obj}.',
    'event.gobboMushroom': 'Gobbo se enamoró de un hongo. ¡Romance micológico!',
    'event.rockEyes': 'La roca le salieron ojos y decidió seguir a alguien. Normal.',
    'event.redlight': 'Redlight parpadeó: “¡Relación detectada fuera del protocolo!”',
    'event.metic': 'Metic abrió una hoja de cálculo: “Esto… no debería ser posible.”',

    'npc.hint.music': 'Pista: la música acerca los corazones.',
    'npc.hint.calm': 'Pista: mantener la calma ayuda a que funcione.',
    'npc.hint.night': 'Pista: de noche, todo se siente más romántico.',
    'npc.hint.sports': 'Pista: quien entrena junto, se queda junto.',
    'npc.hint.reading': 'Pista: una buena conversación vale oro.',
    'npc.hint.art': 'Pista: arte y emoción combinan bien.',
    'npc.hint.rules': 'Pista: el amor no siempre sigue reglas... pero el respeto ayuda.',
    'npc.hint.likeTrait': 'Pista: busca personas con algo en común.',
    'npc.hint.ref': 'Pista: a {name} le gusta eso.',
    'npc.hint.refGeneric': 'Pista: a esa persona le gusta eso.',
    'npc.gobbo.mushroom': 'Hongos... románticos... tal vez.',
    'npc.metic.prob': 'Probabilidad de afecto mutuo: {pct}%.',

    'reason.chaos': 'El medidor de caos explotó. El amor se volvió entropía.',
    'reason.allPairs': 'Todas las parejas fueron unidas (más o menos).',
    'reason.noArrows': 'Se acabaron las flechas antes de unir las parejas.',

    'brief.title': 'Briefing de misión',
    'brief.line1': 'Misión: une {goal} {couples} compatible(s).',
    'brief.line2': 'Cómo funciona: 1er disparo marca (5s). 2º intenta el vínculo.',
    'brief.line3': 'Pistas: color complementario + proximidad + diálogos.',
    'brief.line4': '¿Fallaste? Puedes misbind con objetos y subir el Caos.',
    'brief.line5': 'Controles: Ratón dispara • WASD mueve • ESC pausa • R reinicia.',

    'level.park': 'Parque',
    'level.medieval': 'Aldea medieval',
    'level.modern': 'Ciudad moderna',
    'level.festival': 'Festival',
    'level.final': 'Final: Caos total',

    'obj.rock': 'Roca',
    'obj.mushroom': 'Hongo',
    'obj.crate': 'Caja',
    'label.cupid': 'Cupid',
    'unit.couple1': 'pareja',
    'unit.coupleN': 'parejas'
  },

  pt: {
    'app.title': 'Cupido: Quem são os casais?',
    'app.subtitle': 'Cupido • Vínculos • Caos',
    'menu.play': 'Jogar',
    'menu.chooseLevel': 'Escolha uma fase curta e crie vínculos compatíveis… ou não.',
    'menu.options': 'Opções',
    'menu.volume': 'Volume',
    'menu.mute': 'Mute (M)',
    'menu.unmute': 'Unmute (M)',
    'menu.credits': 'Créditos',
    'menu.hintMouse': 'Mouse: mirar + clique para atirar',
    'menu.hintKeys': 'ESC: pausar • R: reiniciar • F3: debug',
    'menu.footer': 'Offline • Singleplayer • Cameo: Gobbo',
    'menu.language': 'Idioma',
    'menu.achievements': 'Conquistas',
    'ach.locked': 'Bloqueado',
    'ach.unlocked': 'Desbloqueado',

    'credits.title': 'Créditos',
    'credits.dev': 'Desenvolvedor: {name}',
    'credits.devLabel': 'Desenvolvedor:',
    'credits.body': '',
    'credits.note': 'Observação: este projeto não baixa nada da internet em runtime. Tudo roda offline.',

    'pause.title': 'Pausado',
    'pause.resume': 'Retomar (ESC)',
    'pause.restart': 'Reiniciar (R)',
    'pause.menu': 'Menu',

    'end.victory': 'Vitória!',
    'end.defeat': 'Derrota!',
    'end.next': 'Próxima fase',
    'end.retry': 'Tentar de novo (R)',
    'end.menu': 'Menu',
    'end.bestFirst': 'Primeiro registro local desta fase!',
    'end.bestFmt': 'Melhor: {total} pts • {stars}★',
    'end.summaryFmt': '{reason}\nTotal: {total} pts • Precisão: {acc}% • Tiros: {shots} • Misbinds: {misbinds}\n{best}',

    'hud.level': 'Fase: {name}',
    'hud.score': 'Pontos: {score}',
    'hud.combo': 'Combo: x{combo}',
    'hud.arrows': 'Flechas: {left}/{max}',
    'hud.arrowsSolo': 'Flechas: {left}',
    'hud.chaos': 'Chaos: {pct}%',

    'toast.noArrows': 'Sem flechas restantes. (R) para reiniciar.',
    'toast.godMission': 'God: Missão — una {goal} {couples} compatível(eis).',

    'event.awaiting': 'Primeiro alvo marcado (5s): aguarde o segundo tap…',
    'event.timeout': 'Tempo acabou. O alvo ficou tristinho (penalidade).',
    'event.boundSuccess': 'Vínculo criado! Compatibilidade {pct}% — fofo!',
    'event.boundRejected': 'Rejeitado. Compatibilidade {pct}% — era uma má ideia.',
    'event.missSecond': 'Segundo tiro errou… o destino ficou confuso.',
    'event.missIdleA': 'Whoosh!',
    'event.missIdleB': 'Nada atingido.',
    'event.missIdleC': 'Cupido piscou e errou.',
    'event.misbind': 'Misbind! {a} agora está ligado(a) com {b}… isso vai dar ruim.',
    'event.objectLove': 'Inesperado: {npc} se apaixonou por um(a) {obj}.',
    'event.gobboMushroom': 'Gobbo se apaixonou por um cogumelo. Romance micológico!',
    'event.rockEyes': 'A pedra ganhou olhos e decidiu seguir alguém. Normal.',
    'event.redlight': 'Redlight piscou vermelho: “Relacionamento detectado fora do protocolo!”',
    'event.metic': 'Metic abriu uma planilha: “Isso… não deveria ser possível.”',

    'npc.hint.music': 'Dica: música aproxima corações.',
    'npc.hint.calm': 'Dica: calma ajuda a fazer dar certo.',
    'npc.hint.night': 'Dica: à noite, tudo parece mais romântico.',
    'npc.hint.sports': 'Dica: quem treina junto, fica junto.',
    'npc.hint.reading': 'Dica: uma boa conversa vale ouro.',
    'npc.hint.art': 'Dica: arte e emoção combinam.',
    'npc.hint.rules': 'Dica: nem todo amor segue regras... mas respeitar ajuda.',
    'npc.hint.likeTrait': 'Dica: procure pessoas com algo em comum.',
    'npc.hint.ref': 'Dica: {name} reage bem a isso.',
    'npc.hint.refGeneric': 'Dica: essa pessoa reage bem a isso.',
    'npc.gobbo.mushroom': 'Cogumelos... românticos... talvez.',
    'npc.metic.prob': 'Probabilidade de afeto mútuo: {pct}%.',

    'reason.chaos': 'Chaos meter estourou. O amor virou entropia.',
    'reason.allPairs': 'Todos os pares (mais ou menos) foram unidos.',
    'reason.noArrows': 'Acabaram as flechas antes de unir os pares.',

    'brief.title': 'Briefing da missão',
    'brief.line1': 'Missão: una {goal} {couples} compatível(eis).',
    'brief.line2': 'Como funciona: 1º tiro marca (5s). 2º tiro tenta unir.',
    'brief.line3': 'Dicas: cor complementar + proximidade + diálogos.',
    'brief.line4': 'Errou? Pode misbind com objetos e aumentar o Chaos.',
    'brief.line5': 'Controles: Mouse atira • WASD move • ESC pausa • R reinicia.',

    'level.park': 'Parque',
    'level.medieval': 'Vila medieval',
    'level.modern': 'Cidade moderna',
    'level.festival': 'Festival',
    'level.final': 'Final: Caos total',

    'obj.rock': 'Pedra',
    'obj.mushroom': 'Cogumelo',
    'obj.crate': 'Caixote',
    'label.cupid': 'Cupid',
    'unit.couple1': 'casal',
    'unit.coupleN': 'casais'
  }
};

let _lang = 'en';

export function getLang() {
  return _lang;
}

export function setLang(lang) {
  const next = DICTS[lang] ? lang : 'en';
  _lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
}

export function initLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && DICTS[stored]) _lang = stored;
  } catch {
    // ignore
  }
}

export function t(key, vars = {}) {
  const dict = DICTS[_lang] ?? DICTS.en;
  const base = dict[key] ?? DICTS.en[key] ?? key;
  return String(base).replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? '' : String(v);
  });
}
