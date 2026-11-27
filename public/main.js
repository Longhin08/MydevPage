const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- nome em letras separadas ---------- */
let letterIndex = 0;
$$('.word').forEach((word) => {
  word.replaceChildren(...[...word.textContent.trim()].map((char) => {
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = char;
    span.style.setProperty('--i', letterIndex++);
    return span;
  }));
});

/* ---------- cabo desenhado no tamanho real ---------- */
/* Esticar o SVG distorce o tracejado; por isso as coordenadas são recalculadas. */
const cable = $('.cable');
const cablePaths = [...cable.querySelectorAll('path')];
const cableShape = cablePaths[0].getAttribute('d');
new ResizeObserver(() => {
  const { width, height } = cable.getBoundingClientRect();
  let isX = false;
  const d = cableShape.replace(/-?\d+/g, (n) => {
    isX = !isX;
    return (n * (isX ? width / 1440 : height / 170)).toFixed(1);
  });
  cable.setAttribute('viewBox', `0 0 ${width} ${height}`);
  cablePaths.forEach((path) => path.setAttribute('d', d));
}).observe(cable);

/* ---------- profundidade da foto seguindo o mouse ---------- */
const portrait = $('#portrait');
$('.hero').addEventListener('pointermove', (e) => {
  if (reduced.matches || e.pointerType !== 'mouse') return;
  portrait.style.setProperty('--px', (e.clientX / innerWidth - 0.5).toFixed(3));
  portrait.style.setProperty('--py', (e.clientY / innerHeight - 0.5).toFixed(3));
});

/* ---------- captura de tela que se endireita ao rolar ---------- */
const shot = $('.shot img');
function tiltShot() {
  const top = shot.parentElement.getBoundingClientRect().top;
  const progress = Math.min(1, Math.max(0, top / innerHeight - 0.1));
  shot.style.setProperty('--tilt', reduced.matches ? '0deg' : `${(progress * 22).toFixed(1)}deg`);
}
addEventListener('scroll', tiltShot, { passive: true });
tiltShot();

/* ---------- telas do NAM Chain Capture ---------- */
const shots = $$('.switcher button');
shots.forEach((button) => button.addEventListener('click', () => {
  shots.forEach((other) => other.setAttribute('aria-pressed', other === button));
  const { src, w, h, alt, caption } = button.dataset;
  const img = $('#frame-img');
  Object.assign(img, { src, alt, width: Number(w), height: Number(h) });
  $('#frame').href = src;
  $('#frame-caption').textContent = caption;
  if (!reduced.matches) img.animate([{ opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1 }], { duration: 350, easing: 'ease-out' });
}));

/* ---------- pedido do Good Hamburger ---------- */
const ticket = $('#ticket');
let lastDiscount = 0;

/* Mesma regra do DiscountService da API */
function discountFor(sandwich, side, drink) {
  if (!sandwich) return 0;
  if (side && drink) return 20;
  if (drink) return 15;
  if (side) return 10;
  return 0;
}

function updateTicket() {
  const items = [...ticket.querySelectorAll('input:checked')];
  const has = (name) => items.some((input) => input.name === name);
  const percent = discountFor(has('sandwichId'), has('sideDishId'), has('drinkId'));
  const value = $('#discount-value');
  value.textContent = `${percent}%`;
  $('#discount-text').textContent = items.length ? 'de desconto' : 'Escolha pelo menos um item.';
  if (percent !== lastDiscount) {
    value.classList.remove('bump');
    void value.offsetWidth;
    value.classList.add('bump');
    lastDiscount = percent;
  }
  const body = Object.fromEntries(items.map((input) => [input.name, input.value]));
  $('#payload').textContent = items.length
    ? `POST /api/orders\n${JSON.stringify(body, null, 2)}`
    : 'O pedido precisa de pelo menos um item.';
}
ticket.addEventListener('change', updateTicket);
ticket.addEventListener('submit', (e) => e.preventDefault());
updateTicket();

/* ---------- CRUD do ScreenSound: rotas, corpos e respostas como no código da API ---------- */
const crud = {
  artistas: {
    create: [['POST /Artistas'], { nome: 'string', bio: 'string' }, 'Responde 201 Created com o artista criado.'],
    read: [['GET /Artistas', 'GET /Artistas/{nome}'], null, 'Lista os artistas com suas músicas ou busca um pelo nome. A busca responde 404 se ele não existir.'],
    update: [['PUT /Artistas/{id}'], { id: 1, nome: 'string', bio: 'string' }, 'Atualiza nome e bio. Responde 200 OK, ou 404 se o id não existir.'],
    delete: [['DELETE /Artistas/{id}'], null, 'Responde 200 OK com uma confirmação, ou 404 se o id não existir.'],
  },
  musicas: {
    create: [['POST /Musicas'], { nome: 'string', artistaId: 1, anoLancamento: 2000, generos: [{ nome: 'string', descricao: 'string' }] }, 'Responde 201 Created. Gêneros que já existem são reaproveitados.'],
    read: [['GET /Musicas', 'GET /Musicas/{nome}'], null, 'Lista as músicas ou busca uma pelo nome. A busca responde 404 se ela não existir.'],
    update: [['PUT /Musicas'], { id: 1, nome: 'string', artistaId: 1, anoLancamento: 2000 }, 'Atualiza nome e ano de lançamento. Responde 200 OK, ou 404 se o id não existir.'],
    delete: [['DELETE /Musicas/{id}'], null, 'Responde 200 OK com uma confirmação, ou 404 se o id não existir.'],
  },
  generos: {
    create: [['POST /Generos'], { nome: 'string', descricao: 'string' }, 'Salva o novo gênero e responde 200 OK.'],
    read: [['GET /Generos', 'GET /Generos/{nome}'], null, 'Lista os gêneros ou busca um pelo nome. A busca responde 404 se ele não existir.'],
    update: [[], null, 'Gêneros ainda não têm rota de atualização.'],
    delete: [['DELETE /Generos/{id}'], null, 'Responde 204 No Content, ou 404 se o id não existir.'],
  },
};
const selected = { res: 'artistas', op: 'create' };

function showCrud() {
  const [routes, body, response] = crud[selected.res][selected.op];
  const text = [...routes, ...(body ? [JSON.stringify(body, null, 2)] : [])].join('\n');
  $('#crud-request').textContent = text || 'Sem rota';
  $('#crud-response').textContent = response;
  if (!reduced.matches) $('#crud-result').animate([{ opacity: 0, translate: '20px 0' }, { opacity: 1, translate: '0 0' }], { duration: 300, easing: 'ease-out' });
}

$$('#crud button').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.res ? 'res' : 'op';
  selected[key] = button.dataset[key];
  [...button.parentElement.children].forEach((other) => other.setAttribute('aria-pressed', other === button));
  showCrud();
}));

/* ---------- copiar comando ---------- */
$('#copy').addEventListener('click', async (e) => {
  const button = e.currentTarget;
  try {
    await navigator.clipboard.writeText($('#cmd').textContent);
    button.textContent = 'Comando copiado';
  } catch {
    getSelection().selectAllChildren($('#cmd'));
    button.textContent = 'Selecionado: use Ctrl+C';
  }
  setTimeout(() => { button.textContent = 'Copiar comando'; }, 2500);
});
