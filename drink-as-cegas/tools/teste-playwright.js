// Teste do Drink às Cegas: duas abas no modo local (?local=1) + BOT + larguras 360/430/480.
// Uso: na raiz do repositório, `python -m http.server 8811` e depois `node drink-as-cegas/tools/teste-playwright.js [pasta-das-fotos]`
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8811/drink-as-cegas/';
const OUT = process.argv[2] || '.';
const ok = (c, m) => { if (!c) { console.error('FALHOU:', m); process.exitCode = 1; } else console.log('ok -', m); };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const mk = async name => {
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(name + ': ' + m.text()); });
    p.on('pageerror', e => errors.push(name + ': ' + e.message));
    await p.goto(BASE + '?local=1');
    return p;
  };
  const A = await mk('A'), B = await mk('B');
  const shot = (p, f) => p.screenshot({ path: `${OUT}/${f}`, fullPage: true });

  // apelido: filtro
  await A.fill('#nick', 'B0STA'); await A.click('#nick-ok');
  ok((await A.textContent('#nick-err')).includes('não é permitido'), 'filtro de apelido barra B0STA');
  ok(await A.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 2000 }).then(() => true, () => false), 'tela cheia no primeiro botão');
  await shot(A, '01-apelido.png');
  await A.fill('#nick', 'ANA'); await A.click('#nick-ok');
  ok(await A.isVisible('#s-avatar'), 'apelido ANA leva ao avatar');
  await A.click('.tab[data-tab="h"]'); await A.click('#av-opts .opt >> nth=3');
  await shot(A, '02-avatar.png');
  await A.click('#av-ok');
  await B.fill('#nick', 'BETO'); await B.click('#nick-ok'); await B.click('#av-opts .opt >> nth=4'); await B.click('#av-ok');
  await A.waitForFunction(() => __dc.state().net === 'ok');
  const codeA = (await A.evaluate(() => __dc.state().code));
  ok(/^[A-Z0-9]{4}$/.test(codeA), 'código do A: ' + codeA);
  await shot(A, '03-codigos.png');

  // erros do campo de código
  await B.fill('#code-in', 'ZZ'); await B.click('#call');
  ok((await B.textContent('#code-err')).includes('4 letras'), 'código curto é recusado');
  await B.fill('#code-in', 'ZZZZ'); await B.click('#call');
  await B.waitForFunction(() => document.querySelector('#code-err').textContent.length > 0, null, { timeout: 4000 });
  ok((await B.textContent('#code-err')).includes('não encontrado'), 'código inexistente avisa');

  // B chama A
  await A.evaluate(() => __dc.seed(7));
  await B.fill('#code-in', codeA.toLowerCase()); await B.click('#call');
  await A.waitForSelector('#s-match.on'); await B.waitForSelector('#s-match.on');
  ok(true, 'os dois entram na tela de partida encontrada');
  const roleA = await A.evaluate(() => __dc.role()), roleB = await B.evaluate(() => __dc.role());
  ok(roleA !== roleB, `papéis diferentes (A=${roleA}, B=${roleB})`);
  await shot(A, '04-partida-' + roleA + '.png');
  await A.click('#ready'); await B.click('#ready');
  await A.waitForFunction(() => __dc.state().phase === 'count');
  await A.evaluate(() => __dc.step(3.1));
  await B.waitForSelector('#s-play.on');
  ok(await A.isVisible('#s-play'), 'partida começou nos dois');
  const guide = roleA === 'guide' ? A : B, mixer = roleA === 'guide' ? B : A, host = A;
  const recipe = await guide.evaluate(() => __dc.recipe());
  ok(await guide.isVisible('#guide-view') && !(await guide.isVisible('#tiles')), 'guia vê a receita e não vê ícones');
  ok(await mixer.isVisible('#tiles') && !(await mixer.isVisible('#guide-view')), 'misturador vê ícones e não vê a receita');
  const tileText = await mixer.textContent('#tiles');
  ok(!/Lim|Gelo|Rum|Vodka|Cacha/i.test(tileText + await mixer.innerHTML('#tiles').then(h => h.replace(/aria-label="ícone misterioso \d+"/g, ''))), 'ícones do misturador não dizem o nome');

  // misturador põe a receita + 1 erro, depois tira o erro
  const ids = Object.entries(recipe.items).flatMap(([id, q]) => Array(q).fill(id));
  for (const id of ids.slice(0, -1)) { await mixer.evaluate(i => __dc.tap(i), id); await host.evaluate(() => __dc.step(0.5)); }
  const wrongId = await mixer.evaluate(items => (window.CONFIG.ingredients.find(i => !(i.id in items)) || {}).id, recipe.items);
  await mixer.evaluate(i => __dc.tap(i), wrongId); await host.evaluate(() => __dc.step(0.3));
  await guide.waitForFunction(n => __dc.state().glass.length === n, ids.length);
  // sommelier: a última fala é o nome do ingrediente e aparece igual nos dois
  const lastName = await A.evaluate(id => CONFIG.ingredients.find(i => i.id === id).name, wrongId);
  const tkA = await A.evaluate(() => __dc.talk()), tkB = await B.evaluate(() => __dc.talk());
  ok(tkA.text.includes(lastName) && tkA.text === tkB.text && tkA.n === tkB.n, `sommelier fala "${tkA.text}" nos dois`);
  await shot(guide, '05-guia-instante.png');
  // física: deixa assentar e confere que os sólidos ficaram dentro da taça
  await host.evaluate(() => __dc.step(2)); await (host === guide ? mixer : guide).evaluate(() => __dc.step(2));
  const fxG = await guide.evaluate(() => __dc.fx()), fxM = await mixer.evaluate(() => __dc.fx());
  const nSolid = await guide.evaluate(() => __dc.state().glass.filter(id => !CONFIG.ingredients.find(i => i.id === id).liquid).length);
  if (fxG.inGlass !== nSolid) console.log(await guide.evaluate(() => JSON.stringify({ g: [FX.geo.x0, FX.geo.x1, FX.geo.top, FX.geo.bot, FX.geo.H], b: FX.items.map(i => i.body ? [i.id, Math.round(i.body.position.x), Math.round(i.body.position.y), +i.body.velocity.y.toFixed(2), i.body.isSleeping, i.body.isStatic] : [i.id, i.gone]), w: FX.walls.map(w => [Math.round(w.bounds.min.x), Math.round(w.bounds.min.y), Math.round(w.bounds.max.x), Math.round(w.bounds.max.y)]), all: Matter.Composite.allBodies(FX.engine.world).length, grav: FX.engine.gravity })));
  ok(fxG.on && fxG.bodies === nSolid && fxG.inGlass === nSolid, `física no guia: ${fxG.inGlass}/${nSolid} sólidos dentro da taça, ${fxG.landed} líquidos assentados`);
  ok(fxM.inGlass === nSolid, `física no misturador: ${fxM.inGlass}/${nSolid} sólidos dentro da taça`);
  await shot(guide, '05-guia.png'); await shot(mixer, '06b-misturador-assentado.png');
  if (fxM.inGlass !== nSolid) console.log(await mixer.evaluate(() => JSON.stringify({ g: FX.geo && [FX.geo.x0, FX.geo.x1, FX.geo.top, FX.geo.bot], b: FX.items.filter(i => i.body).map(i => [i.id, Math.round(i.body.position.x), Math.round(i.body.position.y)]) }))); await shot(mixer, '06-misturador.png');
  await mixer.click('#undo'); await host.evaluate(() => __dc.step(0.3));
  await guide.waitForFunction(n => __dc.state().glass.length === n, ids.length - 1);
  await guide.evaluate(() => __dc.step(0.1)); await mixer.evaluate(() => __dc.step(0.1));
  ok((await guide.evaluate(() => __dc.fx().items)) === ids.length - 1, 'tirar o último remove o item da física');
  await mixer.evaluate(i => __dc.tap(i), ids[ids.length - 1]); await host.evaluate(() => __dc.step(0.3));
  await guide.waitForFunction(n => __dc.state().glass.length === n, ids.length);
  const tA = await A.textContent('#timer'), tB = await B.textContent('#timer');
  ok(tA === tB, `relógio igual nos dois (${tA} / ${tB})`);
  await guide.click('#serve');
  await A.waitForSelector('#s-result.on'); await B.waitForSelector('#s-result.on');
  const rA = await A.evaluate(() => __dc.state().result), rB = await B.evaluate(() => __dc.state().result);
  ok(rA.grade === 10 && rA.perfect && rB.grade === 10, `drink perfeito = nota 10 (${rA.grade}, ${rA.points} pts)`);
  ok(JSON.stringify(rA) === JSON.stringify(rB), 'resultado idêntico nos dois');
  await shot(A, '07-resultado.png');

  // revanche: papéis trocam; tempo esgota com taça incompleta
  await A.click('#again'); await B.click('#again');
  await A.waitForSelector('#s-match.on'); await B.waitForSelector('#s-match.on');
  ok((await A.evaluate(() => __dc.role())) !== roleA, 'jogar de novo troca os papéis');
  await A.click('#ready'); await B.click('#ready');
  await A.waitForFunction(() => __dc.state().phase === 'count'); await A.evaluate(() => __dc.step(3.1));
  await B.waitForSelector('#s-play.on');
  const mixer2 = (await A.evaluate(() => __dc.role())) === 'mixer' ? A : B;
  const rec2 = await A.evaluate(() => __dc.recipe());
  const first = Object.keys(rec2.items)[0];
  await mixer2.evaluate(i => __dc.tap(i), first); await A.evaluate(() => __dc.step(0.2));
  await A.evaluate(() => __dc.step(46));
  await A.waitForSelector('#s-result.on'); await B.waitForSelector('#s-result.on');
  const r2 = await B.evaluate(() => __dc.state().result);
  ok(r2.leftMs === 0 && r2.grade < 10, `tempo esgotado encerra a partida (nota ${r2.grade})`);
  await shot(B, '08-resultado-tempo.png');

  // sair: o outro volta para os códigos
  await B.click('#res-leave');
  await A.waitForSelector('#s-lobby.on', { timeout: 3000 });
  ok(true, 'quem fica volta para a tela de códigos quando o parceiro sai');

  // larguras: sem rolagem horizontal em todas as telas
  for (const w of [360, 430, 480]) {
    for (const p of [A, B]) { await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(100); await p.setViewportSize({ width: w, height: 740 }); }
    for (const scr of ['nick', 'avatar', 'lobby', 'match', 'play', 'result']) {
      const over = await A.evaluate(scr => { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + scr)); return document.documentElement.scrollWidth - innerWidth; }, scr);
      ok(over <= 0, `${w}px ${scr}: sem rolagem horizontal (${over})`);
    }
    await A.evaluate(() => { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 's-lobby')); });
  }
  await A.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await A.waitForTimeout(100); await A.setViewportSize({ width: 360, height: 740 });

  // BOT (?local=1&bot=1): uma pessoa sozinha joga contra o parceiro simulado
  const P = await ctx.newPage();
  P.on('pageerror', e => errors.push('BOT: ' + e.message));
  P.on('console', m => { if (m.type() === 'error') errors.push('BOT: ' + m.text()); });
  await P.goto(BASE + '?local=1&bot=1');
  await P.evaluate(() => __dc.setPlayer('SOLO'));
  await P.waitForFunction(() => __dc.state().net === 'ok');
  await P.fill('#code-in', 'BOT'); await P.click('#call');
  await P.waitForSelector('#s-match.on');
  await P.click('#ready'); await P.waitForFunction(() => __dc.state().phase === 'count');
  await P.evaluate(() => __dc.step(3.1));
  await P.waitForSelector('#s-play.on');
  const roleP = await P.evaluate(() => __dc.role());
  for (let i = 0; i < 110; i++) { if (i === 6 && roleP === "mixer") await shot(P, "09-bot-guia-falando.png"); await P.evaluate(() => __dc.step(0.5)); await P.waitForTimeout(10); if ((await P.evaluate(() => __dc.state().phase)) === 'end') break; }
  await P.waitForSelector('#s-result.on', { timeout: 5000 });
  ok(true, `partida contra o BOT termina (você = ${roleP}, nota ${(await P.evaluate(() => __dc.state().result.grade))})`);

  ok(errors.length === 0, 'console limpo' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
