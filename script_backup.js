/**
 * ======================
 * POKEDEX - Main Script
 * ======================
 */

// ============================================
// 1. CONSTANTS
// ============================================
const BATCH_SIZE = 20;
const MAX_POKEMON = 1025;
const AUDIO_VOLUME = 0.2;
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

// ============================================
// 2. GLOBAL STATE
// ============================================
let START = 1;
let STOP = START + BATCH_SIZE;
let isLoading = false;
let isSearchMode = false;
let currentIndex = 0;

let allPokemonList = [];
let pokemonInfos = [];
let pokemonCharacteristics = [];
let pokemonCry = [];
let filteredIndices = [];
let imageCache = {};

// Search state
let searchResults = [];
let searchDescriptions = [];

// ============================================
// 3. HELPER FUNCTIONS
// ============================================

/**
 * Logs fetch errors consistently
 */
function logFetchError(context, error, pokeID = null) {
  const idInfo = pokeID ? ` #${pokeID}` : '';
  console.error(`[${context}${idInfo}]:`, error);
}

/**
 * Safely handles fetch response
 */
async function safeFetch(url, context, pokeID = null) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      logFetchError(context, `HTTP ${response.status}`, pokeID);
      return null;
    }
    return await response.json();
  } catch (error) {
    logFetchError(context, error, pokeID);
    return null;
  }
}

/**
 * Extracts English flavor text from species data
 */
function getEnglishDescription(speciesData) {
  if (!speciesData?.flavor_text_entries) return null;
  const entry = speciesData.flavor_text_entries
    .find((e) => e.language.name === 'en');
  return entry ? entry.flavor_text.replace(/[\f\r\n\t]/g, ' ') : null;
}

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Builds PokéAPI URL for a given endpoint
 */
function pokeApiUrl(endpoint, idOrPath) {
  return `${POKEAPI_BASE}/${endpoint}/${idOrPath}/`;
}

/**
 * Builds sprite URL for a given Pokémon ID
 */
function spriteUrl(pokeID) {
  return `${SPRITES_BASE}/${pokeID}.png`;
}

// ============================================
// 4. INITIALIZATION
// ============================================

async function init() {
  await fetchAllPokemonNames();
  await bulkLoadPokemon();
}

// ============================================
// 5. DATA FETCHING
// ============================================

async function fetchAllPokemonNames() {
  const data = await safeFetch(
    `${POKEAPI_BASE}/pokemon?limit=${MAX_POKEMON}`,
    'fetchAllPokemonNames'
  );
  allPokemonList = data?.results || [];
}

async function loadPokemonInfo(pokeID) {
  return safeFetch(
    pokeApiUrl('pokemon', pokeID),
    'loadPokemonInfo',
    pokeID
  );
}

async function getPkmDescription(pokeID) {
  return safeFetch(
    pokeApiUrl('pokemon-species', pokeID),
    'getPkmDescription',
    pokeID
  );
}

async function getPkmDescriptionByUrl(url) {
  return safeFetch(url, 'getPkmDescriptionByUrl');
}

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
    img.onload = () => {
      imageCache[pokeID] = url;
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`Failed to load sprite for Pokémon #${pokeID}`);
      reject(new Error(`Sprite load failed for #${pokeID}`));
    };
  });
}

async function fetchEvoChain(pokeId) {
  if (pokeId > 10000) return null;
  
  const species = await safeFetch(
    pokeApiUrl('pokemon-species', pokeId),
    'fetchEvoChain',
    pokeId
  );
  
  if (!species?.evolution_chain?.url) return null;
  
  const evoData = await safeFetch(
    species.evolution_chain.url,
    'fetchEvoChain.evoRes',
    pokeId
  );
  
  return evoData?.chain || null;
}

async function bulkLoadPokemon() {
  if (isLoading) return;
  setMoreBtn(true);
  
  const promises = [];
  for (let pokeID = 1; pokeID <= BATCH_SIZE; pokeID++) {
    promises.push(
      Promise.all([
        loadPokemonInfo(pokeID),
        getPkmDescription(pokeID),
        getFrontPicture(pokeID),
      ])
    );
  }
  
  await fetchAndStore(promises);
  START += BATCH_SIZE;
  STOP += BATCH_SIZE;
  renderPokemonCard();
  if (!isSearchMode) setMoreBtn(false);
}

async function bulkLoadNextPokemon() {
  if (isLoading) return;
  setMoreBtn(true);
  
  const renderFrom = pokemonInfos.length;
  const promises = [];
  
  for (let pokeID = START; pokeID < STOP; pokeID++) {
    promises.push(
      Promise.all([
        loadPokemonInfo(pokeID),
        getPkmDescription(pokeID),
        getFrontPicture(pokeID),
      ])
    );
  }
  
  await fetchAndStore(promises);
  START += BATCH_SIZE;
  STOP += BATCH_SIZE;
  renderPokemonCard(renderFrom);
  if (!isSearchMode) setMoreBtn(false);
}

async function fetchAndStore(promises) {
  const results = await Promise.all(promises);
  
  for (const [info, description, image] of results) {
    pokemonInfos.push(info || null);
    pokemonCharacteristics.push(description);
    
    if (image && info && !imageCache[info.id]) {
      imageCache[info.id] = image.src;
    }
  }
  
  return results;
}

// ============================================
// 6. LOADING STATE
// ============================================

function setMoreBtn(loading) {
  isLoading = loading;
  document.querySelector('.load_more button').disabled = loading;
  document.getElementById('loader').classList.toggle('d_none', !loading);
}

// ============================================
// 7. RENDERING FUNCTIONS
// ============================================

function renderPokemonCard(startIndex = 0) {
  const cardRef = document.getElementById('content');
  for (let i = startIndex; i < pokemonInfos.length; i++) {
    const pokeID = i + 1;
    cardRef.innerHTML += getPokemonCardTemplate(i);
    renderCardContent(i, pokeID);
  }
}

function renderCardContent(i, pokeID, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  renderName(i, source);
  renderTypes(i, source);
  renderPicture(i, pokeID);
}

function renderPicture(i, pokeID) {
  const img = new Image();
  img.src = imageCache[pokeID];
  img.alt = pokemonInfos[i]?.name || 'Pokemon';
  document.getElementById(`pokemonImg${i}`).appendChild(img);
}

function renderName(i, source = pokemonInfos) {
  const pkmNameRef = document.getElementById(`pkm_name${i}`);
  pkmNameRef.innerHTML = capitalizeFirst(source[i]?.name || '');
}

function renderTypes(i, source = pokemonInfos) {
  const typeRef = document.getElementById(`types${i}`);
  const typeArray = source[i]?.types || [];
  
  for (let index = 0; index < typeArray.length; index++) {
    typeRef.innerHTML += getTypesTemplate(i, index, source);
  }
}

function renderDialogPicture(i, source = pokemonInfos) {
  const img = new Image();
  const pokeID = source[i]?.id;
  img.src = imageCache[pokeID];
  document.getElementById(`dialog_pokemonImg${i}`).appendChild(img);
}

function renderDialogName(i, source = pokemonInfos) {
  const pkmNameRef = document.getElementById(`dialog_name${i}`);
  pkmNameRef.innerHTML = capitalizeFirst(source[i]?.name || '');
}

function renderDialogTypes(i, source = pokemonInfos) {
  const typeRef = document.getElementById(`dialog_types${i}`);
  const typeArray = source[i]?.types || [];
  
  for (let index = 0; index < typeArray.length; index++) {
    typeRef.innerHTML += getTypesTemplate(i, index, source);
  }
}

function renderDialogDescription(i, source = pokemonInfos) {
  const descRef = document.getElementById(`dialog_description${i}`);
  const speciesData = source?.[i];
  const description = getEnglishDescription(speciesData);
  
  descRef.innerHTML = description ||
    (speciesData ? 'No English description available.' : 'No description available.');
}

function renderHeight(i, source = pokemonInfos) {
  const heightRef = document.getElementById('height');
  const height = (source[i]?.height / 10).toFixed(1) + 'm';
  heightRef.innerHTML = height;
}

function renderWeight(i, source = pokemonInfos) {
  const weightRef = document.getElementById('weight');
  const weight = (source[i]?.weight / 10).toFixed(1) + 'Kg';
  weightRef.innerHTML = weight;
}

async function renderEvolutionChain(i, source = pokemonInfos) {
  const pokeId = source[i]?.id;
  const chain = await fetchEvoChain(pokeId);
  const evoRef = document.getElementById('evoChain');
  
  evoRef.innerHTML = '';
  if (!chain) {
    evoRef.innerHTML = 'No Evolution data';
    return;
  }
  
  chain.evolves_to.forEach((evo) => {
    evoRef.appendChild(buildEvoRow(chain, evo));
  });
}

function buildEvoRow(chain, evo) {
  const row = document.createElement('div');
  row.classList.add('evo_row');
  row.appendChild(evoImg(chain.species.url));
  row.appendChild(createArrow());
  row.appendChild(evoImg(evo.species.url));
  
  evo.evolves_to.forEach((evo2) => {
    row.appendChild(createArrow());
    row.appendChild(evoImg(evo2.species.url));
  });
  
  return row;
}

function createArrow() {
  const span = document.createElement('span');
  span.textContent = ' → ';
  return span;
}

function evoImg(url) {
  const id = url.split('/').filter(Boolean).pop();
  const img = new Image();
  img.src = imageCache[id] || spriteUrl(id);
  return img;
}

function renderStatChart(i) {
  const ctx = document.querySelector('.stat_canvas');
  Chart.getChart(ctx)?.destroy();

  const stats = pokemonInfos[i]?.stats || [];
  const names = stats.map((s) =>
    s.stat.name
      .replace('special-attack', 'S.Attack')
      .replace('special-defense', 'S.Defense')
      .toUpperCase()
  );
  const values = stats.map((s) => s.base_stat);

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: names,
      datasets: [{ label: '', data: values, borderWidth: 1 }],
    },
    options: {
      layout: { padding: { left: 35, right: 35, top: 10, bottom: 10 } },
      maintainAspectRatio: true,
      responsive: false,
      scales: {
        r: {
          beginAtZero: true,
          ticks: { stepSize: 50, backdropColor: 'transparent', color: '#666', display: false },
          grid: { color: 'rgba(0,0,0,0.15)' },
          angleLines: { color: 'rgba(0,0,0,0.15)' },
          pointLabels: { color: '#333', font: { size: 9, weight: 'bold', family: 'Pixelify Sans' } },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function renderDialogContent(i, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  const sourceDesc = fromSearch ? searchDescriptions : pokemonCharacteristics;
  
  renderDialogPicture(i, source);
  renderDialogName(i, source);
  renderDialogTypes(i, source);
  renderDialogDescription(i, sourceDesc);
  renderHeight(i, source);
  renderWeight(i, source);
  renderStatChart(i, source);
  renderEvolutionChain(i, source);
}

// ============================================
// 8. MODAL FUNCTIONS
// ============================================

function openDetails(i, fromSearch = false) {
  currentIndex = i;
  isSearchMode = fromSearch;
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

function bubbleProtection(event) {
  event.stopPropagation();
}

function closeDetails() {
  const detailRef = document.getElementById('details');
  detailRef.close();
  detailRef.classList.remove('opened');
}

function showTab(tab, i, fromSearch = false) {
  const isFromSearch = fromSearch === true || fromSearch === 'true';
  const source = isFromSearch ? searchResults : pokemonInfos;
  
  document.getElementById('tab_content_info')
    .classList.toggle('d_none', tab !== 'info');
  document.getElementById('tab_content_evo')
    .classList.toggle('d_none', tab !== 'evo');
  document.getElementById('evoChain')
    .classList.toggle('d_none', tab !== 'evo');
  document.getElementById('tab_info')
    .classList.toggle('active', tab === 'info');
  document.getElementById('tab_evo')
    .classList.toggle('active', tab === 'evo');
  
  if (tab === 'evo') renderEvolutionChain(i, source);
}

function playPokemonCry(i, fromSearch = false) {
  const source = fromSearch === true || fromSearch === 'true' 
    ? searchResults 
    : pokemonInfos;
  const url = source[i]?.cries?.latest;
  
  if (url) {
    const audio = new Audio(url);
    audio.volume = AUDIO_VOLUME;
    audio.play();
  }
}

// ============================================
// 9. SEARCH FUNCTIONS
// ============================================

function clearContent() {
  document.getElementById('content').innerHTML = '';
}

async function searchPokemon() {
  const input = document.querySelector('input').value.toLowerCase();
  clearContent();

  if (input.length === 0) return handleEmptyInput();
  if (isInvalidInput(input)) return handleInvalidInput();
  handleValidInput(input);
}

function handleEmptyInput() {
  document.getElementById('search_hint').classList.remove('visible');
  setMoreBtn(false);
  resetSearch();
}

function isInvalidInput(input) {
  const isNumber = !isNaN(input) && input.trim() !== '';
  return !isNumber && input.length < 3;
}

function handleInvalidInput() {
  document.getElementById('search_hint').classList.add('visible');
  setMoreBtn(true);
}

async function handleValidInput(input) {
  document.getElementById('search_hint').classList.remove('visible');
  document.getElementById('loader').classList.add('d_none');
  document.querySelector('.load_more button').disabled = true;
  
  const cardRef = document.getElementById('content');
  if (!searchLocally(input, cardRef)) {
    await searchGlobally(input, cardRef);
  }
}

function resetSearch() {
  searchResults = [];
  searchDescriptions = [];
  filteredIndices = [];
  isLoading = false;
  document.getElementById('loader').classList.add('d_none');
  document.querySelector('.load_more button').disabled = false;
  document.querySelector('input').value = '';
  document.getElementById('search_hint').classList.remove('visible');
  clearContent();
  renderPokemonCard(0);
}

function searchLocally(input, cardRef) {
  const filtered = pokemonInfos.filter(
    (p) => p.name.includes(input) || String(p.id) === String(Number(input))
  );
  
  if (filtered.length === 0) return false;
  
  filteredIndices = filtered.map((p) => pokemonInfos.indexOf(p));
  filtered.forEach((p) => {
    const index = pokemonInfos.indexOf(p);
    cardRef.innerHTML += getPokemonCardTemplate(index);
    renderCardContent(index, p.id);
  });
  
  return true;
}

async function searchGlobally(input, cardRef) {
  const matches = allPokemonList.filter(
    (p) => p.name.includes(input) || p.url.includes(`/pokemon/${Number(input)}/`)
  );
  
  if (matches.length === 0) {
    cardRef.innerHTML = `<p>No Pokémon found for "${input}"</p>`;
    return;
  }
  
  await fetchAndRenderSearchResult(matches, cardRef);
}

async function fetchAndRenderSearchResult(matches, cardRef) {
  await fetchSearchData(matches);
  renderSearchCards(cardRef);
}

async function fetchSearchData(matches) {
  const results = await Promise.all(
    matches.map(async (match) => {
      const info = await safeFetch(match.url, 'fetchSearchData');
      if (!info) return [null, null];
      
      const description = await getPkmDescriptionByUrl(info.species.url);
      return [info, description];
    })
  );
  
  searchResults = results.map(([info]) => info).filter(Boolean);
  searchDescriptions = results.map(([, description]) => description);
  await Promise.all(searchResults.map((info) => getFrontPicture(info.id)));
  isSearchMode = true;
}

function renderSearchCards(cardRef) {
  cardRef.innerHTML = '';
  searchResults.forEach((_, i) => {
    cardRef.innerHTML += getPokemonCardTemplate(i, true);
    renderCardContent(i, searchResults[i].id, true);
  });
}
