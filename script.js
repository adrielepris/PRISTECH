// Utils
function secondsToTimestamp(s) {
  if (!s || isNaN(s)) return "";
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = Math.floor(s%60);
  return (h>0 ? `${h}:` : "") + `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}
function formatDate(s) {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString('pt-BR', {year:'numeric', month:'short', day:'2-digit'});
}
// Elements
const grid = document.getElementById('videoGrid');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const yearSpan = document.getElementById('year');
const modal = document.getElementById('playerModal');
const modalTitle = document.getElementById('modalTitle');
const video = document.getElementById('videoPlayer');
const videoDescription = document.getElementById('videoDescription');
const cardTemplate = document.getElementById('cardTemplate');
yearSpan.textContent = new Date().getFullYear();
// State
let videos = [];
let filtered = [];
async function loadVideos() {
  try {
    const res = await fetch('videos.json', {cache:'no-store'});
    if (!res.ok) throw new Error('Falha ao carregar videos.json');
    videos = await res.json();
    buildCategories();
    applyFilters();
  } catch (e) {
    grid.innerHTML = `<p style="color:#fca5a5">Erro: ${e.message}. Verifique o arquivo <strong>videos.json</strong>.</p>`;
  }
}
function buildCategories() {
  const cats = Array.from(new Set(videos.map(v => v.category).filter(Boolean))).sort();
  categorySelect.innerHTML = `<option value="">Todas as categorias</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join("");
}
function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categorySelect.value;
  filtered = videos.filter(v => {
    const hay = (v.title + " " + (v.description||"") + " " + (v.keywords||[]).join(" ")).toLowerCase();
    const okQ = !q || hay.includes(q);
    const okC = !cat || v.category === cat;
    return okQ && okC;
  });
  sortList();
  renderGrid();
}
function sortList() {
  const mode = sortSelect.value;
  filtered.sort((a,b) => {
    if (mode === 'recent') return new Date(b.updated||0) - new Date(a.updated||0);
    if (mode === 'az') return a.title.localeCompare(b.title);
    if (mode === 'za') return b.title.localeCompare(a.title);
    if (mode === 'longest') return (b.durationSec||0) - (a.durationSec||0);
    if (mode === 'shortest') return (a.durationSec||0) - (b.durationSec||0);
    return 0;
  });
}
function renderGrid() {
  grid.innerHTML = "";
  if (filtered.length === 0) {
    grid.innerHTML = `<p style="color:#a8b3c7">Nenhum vídeo encontrado.</p>`;
    return;
  }
  const frag = document.createDocumentFragment();
  filtered.forEach(v => {
    const node = cardTemplate.content.cloneNode(true);
    const poster = node.querySelector('.poster');
    const dur = node.querySelector('.duration');
    const title = node.querySelector('.title');
    const desc = node.querySelector('.desc');
    const cat = node.querySelector('.category');
    const upd = node.querySelector('.updated');
    const openBtns = node.querySelectorAll('[data-action="open"]');
    const dl = node.querySelector('[data-action="download"]');
    poster.src = v.poster || 'assets/posters/exemplo1.jpg';
    poster.alt = v.title;
    dur.textContent = secondsToTimestamp(v.durationSec);
    title.textContent = v.title;
    desc.textContent = v.description || "";
    cat.textContent = v.category || "Geral";
    upd.textContent = v.updated ? `Atualizado ${formatDate(v.updated)}` : "";
    openBtns.forEach(b => b.addEventListener('click', () => openVideo(v)));
    dl.href = v.src;
    dl.setAttribute('download', v.src.split('/').pop());
    frag.appendChild(node);
  });
  grid.appendChild(frag);
}
function openVideo(v) {
  modalTitle.textContent = v.title;
  video.src = v.src + "#t=0.1";
  video.poster = v.poster || "";
  videoDescription.textContent = v.description || "";
  if (!modal.open) modal.showModal();
  video.focus();
}
modal.addEventListener('close', () => {
  video.pause();
  video.removeAttribute('src');
  video.load();
});
// Events
searchInput.addEventListener('input', applyFilters);
categorySelect.addEventListener('change', applyFilters);
sortSelect.addEventListener('change', () => { sortList(); renderGrid(); });
// Init
loadVideos();
