/**
 * ======================
 * POKEDEX - Main Script (Refactored ~400 lines)
 * ======================
 */

// ============================================
// 1. CONSTANTS & STATE
// ============================================
const BATCH_SIZE = 20, MAX_POKEMON = 1025, AUDIO_VOLUME = 0.2;
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

let START = 1, STOP = START + BATCH_SIZE, isLoading = false, isSearchMode = false, currentIndex = 0;
let allPokemonList = [], pokemonInfos = [], pokemonCharacteristics = [], filteredIndices = [];
let imageCache = {}, searchResults = [], searchDescriptions = [];

// ============================================
// 2. HELPERS
// ============================================

const logFetchError = (c, e, id = '') => console.error(`[${c}${id ? ` #${id}` : ''}]:`, e);

const safeFetch = async (url, ctx, id = null) => {
  try {
    const res = await fetch(url);
    if (!res.ok) { logFetchError(ctx, `HTTP ${res.status}`, id); return null; }
    return res.json();
  } catch (e) { logFetchError(ctx, e, id); return null; }
};

const getEnglishDescription = data => {
  if (!data?.flavor_text_entries) return null;
  const entry = data.flavor_text_entries.find(e => e.language.name === 'en');
  return entry ? entry.flavor_text.replace(/[\f\r\n\t]/g, ' ') : null;
};

const capitalizeFirst = str => str.charAt(0).toUpperCase() + str.slice(1);
const pokeApiUrl = (ep, id) => `${POKEAPI_BASE}/${ep}/${id}/`;
const spriteUrl = id => `${SPRITES_BASE}/${id}.png`;

// ============================================
// 3. INIT
// ============================================

async function init() {
  await fetchAllPokemonNames();
  await bulkLoadPokemon();
}

// ============================================
// 4. DATA FETCHING
// ============================================

async function fetchAllPokemonNames() {
  const data = await safeFetch(`${POKEAPI_BASE}/pokemon?limit=${MAX_POKEMON}`, 'fetchAllPokemonNames');
  allPokemonList = data?.results || [];
}

const loadPokemonInfo = id => safeFetch(pokeApiUrl('pokemon', id), 'loadPokemonInfo', id);
const getPkmDescription = id => safeFetch(pokeApiUrl('pokemon-species', id), 'getPkmDescription', id);
const getPkmDescriptionByUrl = url => safeFetch(url, 'getPkmDescriptionByUrl');

function getFrontPicture(pokeID) {
  return new Promise((resolve, reject) => {
    const url = spriteUrl(pokeID);
    if (imageCache[pokeID]) {
      const img = new Image();
      img.src = imageCache[pokeID];
      resolve(img);
      return;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => { imageCache[pokeID] = url; resolve(img); };
    img.onerror = () => { console.warn(`Failed to load sprite for #${pokeID}`); reject(new Error(`Sprite load failed for #${pokeID}`)); };
  });
}

async function fetchEvoChain(pokeId) {
  if (pokeId > 10000) return null;
  const species = await safeFetch(pokeApiUrl('pokemon-species', pokeId), 'fetchEvoChain', pokeId);
  if (!species?.evolution_chain?.url) return null;
  const evoData = await safeFetch(species.evolution_chain.url, 'fetchEvoChain.evoRes', pokeId);
  return evoData?.chain || null;
}

async function loadBatch(start, end) {
  const promises = [];
  for (let id = start; id < end; id++) {
    promises.push(Promise.all([loadPokemonInfo(id), getPkmDescription(id), getFrontPicture(id)]));
  }
  await fetchAndStore(promises);
}

async function fetchAndStore(promises) {
  const results = await Promise.all(promises);
  for (const [info, description, image] of results) {
    pokemonInfos.push(info || null);
    pokemonCharacteristics.push(description);
    if (image && info && !imageCache[info.id]) imageCache[info.id] = image.src;
  }
  return results;
}

async function bulkLoadPokemon() {
  if (isLoading) return;
  setMoreBtn(true);
  await loadBatch(1, BATCH_SIZE);
  START += BATCH_SIZE; STOP += BATCH_SIZE;
  renderPokemonCard();
  if (!isSearchMode) setMoreBtn(false);
}

async function bulkLoadNextPokemon() {
  if (isLoading) return;
  setMoreBtn(true);
  const renderFrom = pokemonInfos.length;
  await loadBatch(START, STOP);
  START += BATCH_SIZE; STOP += BATCH_SIZE;
  renderPokemonCard(renderFrom);
  if (!isSearchMode) setMoreBtn(false);
}

// ============================================
// 5. LOADING & UI STATE
// ============================================

function setMoreBtn(loading) {
  isLoading = loading;
  document.querySelector('.load_more button').disabled = loading;
  document.getElementById('loader').classList.toggle('d_none', !loading);
}

// ============================================
// 6. RENDERING
// ============================================

function renderPokemonCard(startIndex = 0) {
  const cardRef = document.getElementById('content');
  for (let i = startIndex; i < pokemonInfos.length; i++) {
    cardRef.innerHTML += getPokemonCardTemplate(i);
    renderCardContent(i, i + 1);
  }
}

function renderCardContent(i, pokeID, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  const p = source[i];
  document.getElementById(`pkm_name${i}`).innerHTML = capitalizeFirst(p?.name || '');
  renderTypes(i, source, '');
  renderImage(`pokemonImg${i}`, pokeID, p);
}

function renderTypes(i, source, prefix = '') {
  const typeRef = document.getElementById(`${prefix}types${i}`);
  if (!typeRef) return;
  const types = source[i]?.types || [];
  typeRef.innerHTML = types.map((t, idx) => getTypesTemplate(i, idx, source)).join('');
}

function renderImage(id, pokeID, pokemon) {
  const container = document.getElementById(id);
  if (!container) return;
  const img = new Image();
  img.src = imageCache[pokeID] || spriteUrl(pokeID);
  img.alt = pokemon?.name || 'Pokemon';
  container.appendChild(img);
}

function renderDialogContent(i, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  const sourceDesc = fromSearch ? searchDescriptions : pokemonCharacteristics;
  const p = source[i];

  renderImage(`dialog_pokemonImg${i}`, p?.id, p);
  document.getElementById(`dialog_name${i}`).innerHTML = capitalizeFirst(p?.name || '');
  renderTypes(i, source, 'dialog_');

  const descRef = document.getElementById(`dialog_description${i}`);
  const description = getEnglishDescription(sourceDesc[i]);
  descRef.innerHTML = description || (sourceDesc[i] ? 'No English description available.' : 'No description available.');

  document.getElementById('height').innerHTML = (p?.height / 10).toFixed(1) + 'm';
  document.getElementById('weight').innerHTML = (p?.weight / 10).toFixed(1) + 'Kg';
  renderStatChart(i);
  renderEvolutionChain(i, source);
}

function renderStatChart(i) {
  const ctx = document.querySelector('.stat_canvas');
  Chart.getChart(ctx)?.destroy();
  const source = isSearchMode ? searchResults : pokemonInfos;
  const stats = source[i]?.stats || [];
  const names = stats.map(s => s.stat.name.replace('special-attack', 'S.Attack').replace('special-defense', 'S.Defense').toUpperCase());
  const values = stats.map(s => s.base_stat);

  new Chart(ctx, {
    type: 'radar',
    data: { labels: names, datasets: [{ label: '', data: values, borderWidth: 1 }] },
    options: {
      layout: { padding: { left: 35, right: 35, top: 10, bottom: 10 } },
      maintainAspectRatio: true, responsive: false,
      scales: {
        r: {
          beginAtZero: true,
          ticks: { stepSize: 50, backdropColor: 'transparent', color: '#666', display: false },
          grid: { color: 'rgba(0,0,0,0.15)' },
          angleLines: { color: 'rgba(0,0,0,0.15)' },
          pointLabels: { color: '#333', font: { size: 9, weight: 'bold', family: 'Pixelify Sans' } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

async function renderEvolutionChain(i, source) {
  const evoRef = document.getElementById('evoChain');
  evoRef.innerHTML = '';
  const chain = await fetchEvoChain(source[i]?.id);
  if (!chain) { evoRef.innerHTML = 'No Evolution data'; return; }

  const row = document.createElement('div');
  row.classList.add('evo_row');
  row.appendChild(createEvoImg(chain.species.url));

  const addEvo = (evo) => {
    row.appendChild(document.createTextNode(' \u2192 '));
    row.appendChild(createEvoImg(evo.species.url));
    evo.evolves_to.forEach(addEvo);
  };

  chain.evolves_to.forEach(addEvo);
  evoRef.appendChild(row);
}

function createEvoImg(url) {
  const id = url.split('/').filter(Boolean).pop();
  const img = new Image();
  img.src = imageCache[id] || spriteUrl(id);
  return img;
}

// ============================================
// 7. MODAL FUNCTIONS
// ============================================

function openDetails(i, fromSearch = false) {
  currentIndex = i; isSearchMode = fromSearch;
  const detailRef = document.getElementById('details');
  detailRef.showModal();
  detailRef.classList.add('opened');
  detailRef.innerHTML = getDialogTemplate(i, fromSearch);
  renderDialogContent(i, fromSearch);
}

function switchPokemon(i, fromSearch = false) {
  currentIndex = i;
  const detailRef = document.getElementById('details');
  detailRef.innerHTML = getDialogTemplate(i, fromSearch);
  renderDialogContent(i, fromSearch);
}

function bubbleProtection(event) { event.stopPropagation(); }

function closeDetails() {
  const detailRef = document.getElementById('details');
  detailRef.close();
  detailRef.classList.remove('opened');
}

function showTab(tab, i, fromSearch = false) {
  const isFromSearch = fromSearch === true || fromSearch === 'true';
  const source = isFromSearch ? searchResults : pokemonInfos;

  document.getElementById('tab_content_info').classList.toggle('d_none', tab !== 'info');
  document.getElementById('tab_content_evo').classList.toggle('d_none', tab !== 'evo');
  document.getElementById('evoChain').classList.toggle('d_none', tab !== 'evo');
  document.getElementById('tab_info').classList.toggle('active', tab === 'info');
  document.getElementById('tab_evo').classList.toggle('active', tab === 'evo');

  if (tab === 'evo') renderEvolutionChain(i, source);
}

function playPokemonCry(i, fromSearch = false) {
  const source = (fromSearch === true || fromSearch === 'true') ? searchResults : pokemonInfos;
  const url = source[i]?.cries?.latest;
  if (url) { const audio = new Audio(url); audio.volume = AUDIO_VOLUME; audio.play(); }
}

// ============================================
// 8. SEARCH
// ============================================

function clearContent() { document.getElementById('content').innerHTML = ''; }

function resetSearch() {
  searchResults = []; searchDescriptions = []; filteredIndices = []; isLoading = false;
  document.getElementById('loader').classList.add('d_none');
  document.querySelector('.load_more button').disabled = false;
  document.querySelector('input').value = '';
  document.getElementById('search_hint').classList.remove('visible');
  clearContent(); renderPokemonCard(0);
}

async function fetchSearchData(matches) {
  const results = await Promise.all(matches.map(async match => {
    const info = await safeFetch(match.url, 'fetchSearchData');
    if (!info) return [null, null];
    const description = await getPkmDescriptionByUrl(info.species.url);
    return [info, description];
  }));
  searchResults = results.map(([info]) => info).filter(Boolean);
  searchDescriptions = results.map(([, desc]) => desc);
  await Promise.all(searchResults.map(info => getFrontPicture(info.id)));
  isSearchMode = true;
}

function renderSearchCards(cardRef) {
  cardRef.innerHTML = '';
  searchResults.forEach((_, i) => {
    cardRef.innerHTML += getPokemonCardTemplate(i, true);
    renderCardContent(i, searchResults[i].id, true);
  });
}

async function searchPokemon() {
  const input = document.querySelector('input').value.toLowerCase();
  clearContent();

  if (input.length === 0) {
    document.getElementById('search_hint').classList.remove('visible');
    setMoreBtn(false); resetSearch();
    return;
  }

  const isNumber = !isNaN(input) && input.trim() !== '';
  if (!isNumber && input.length < 3) {
    document.getElementById('search_hint').classList.add('visible');
    setMoreBtn(true);
    return;
  }

  document.getElementById('search_hint').classList.remove('visible');
  document.getElementById('loader').classList.add('d_none');
  document.querySelector('.load_more button').disabled = true;

  const cardRef = document.getElementById('content');
  const filtered = pokemonInfos.filter(p => p?.name?.includes(input) || String(p?.id) === String(Number(input)));

  if (filtered.length > 0) {
    filteredIndices = filtered.map(p => pokemonInfos.indexOf(p));
    filtered.forEach(p => {
      const index = pokemonInfos.indexOf(p);
      cardRef.innerHTML += getPokemonCardTemplate(index);
      renderCardContent(index, p.id);
    });
  } else {
    const matches = allPokemonList.filter(p => p.name.includes(input) || p.url.includes(`/pokemon/${Number(input)}/`));
    if (matches.length === 0) {
      cardRef.innerHTML = `<p>No Pok\u00E9mon found for "${input}"</p>`;
      return;
    }
    await fetchSearchData(matches);
    renderSearchCards(cardRef);
  }
}
