// ============================================
// STATE
// ============================================
let START = 1, STOP = START + 20;
let isLoading = false, isSearchMode = false, currentIndex = 0;
let allPokemonList = [], pokemonInfos = [], pokemonCharacteristics = [], filteredIndices = [];
let imageCache = {}, searchResults = [], searchDescriptions = [];

// ============================================
// INIT
// ============================================
async function init() {
  await fetchAllPokemonNames();
  await bulkLoadPokemon();
}

// ============================================
// FETCHING
// ============================================
async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("[fetch failed]:", url, e);
    return null;
  }
}

const loadPokemonInfo = (id) => safeFetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
const getPkmDescription = (id) => safeFetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
const getPkmDescriptionByUrl = (url) => safeFetch(url);

async function fetchAllPokemonNames() {
  const data = await safeFetch("https://pokeapi.co/api/v2/pokemon?limit=100000");
  allPokemonList = data?.results || [];
}

function getFrontPicture(pokeID) {
  return new Promise((resolve) => {
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeID}.png`;

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
      // Fallback auf den kleinen Default-Sprite
      const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeID}.png`;
      imageCache[pokeID] = fallbackUrl;  // Fallback auch cachen
      const fallback = new Image();
      fallback.src = fallbackUrl;
      resolve(fallback);
    };
  });
}

async function fetchEvoChain(pokeId) {
  if (pokeId > 10000) return null;
  const species = await safeFetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`);
  if (!species?.evolution_chain?.url) return null;
  const evoData = await safeFetch(species.evolution_chain.url);
  return evoData?.chain || null;
}

// ============================================
// BATCH LOADING
// ============================================
async function loadPokemonBatch(start, end) {
  if (isLoading) return;
  setMoreBtn(true);
  const renderFrom = pokemonInfos.length;
  const promises = [];
  for (let id = start; id < end; id++) {
    promises.push(Promise.all([loadPokemonInfo(id), getPkmDescription(id), getFrontPicture(id)]));
  }
  await fetchAndStore(promises);
  START += 20;
  STOP += 20;
  renderPokemonCard(renderFrom);
  if (!isSearchMode) setMoreBtn(false);
}

async function bulkLoadPokemon() {
  await loadPokemonBatch(1, 21);
}

async function bulkLoadNextPokemon() {
  await loadPokemonBatch(START, STOP);
}

async function fetchAndStore(promises) {
  const results = await Promise.all(promises);
  for (const [info, description] of results) {
    pokemonInfos.push(info);
    pokemonCharacteristics.push(description);
  }
  return results;
}

function setMoreBtn(loading) {
  isLoading = loading;
  document.querySelector(".load_more button").disabled = loading;
  document.getElementById("loader").classList.toggle("d_none", !loading);
}

// ============================================
// CARD + DIALOG RENDERING (shared helpers)
// ============================================
function renderPokemonCard(startIndex = 0) {
  const cardRef = document.getElementById("content");
  for (let i = startIndex; i < pokemonInfos.length; i++) {
    cardRef.innerHTML += getPokemonCardTemplate(i);
    renderCardContent(i);
  }
}

function renderCardContent(i, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  renderName(i, source, "pkm_");
  renderTypes(i, source);
  renderPicture(i, source);
}

function renderName(i, source = pokemonInfos, idPrefix = "") {
  const ref = document.getElementById(`${idPrefix}name${i}`);
  const word = source[i].name;
  ref.innerHTML = formatPokemonName(source[i].name);
  applyNameSizing(ref, word);
}

function applyNameSizing(ref, word) {
  ref.classList.remove("name_md", "name_sm");
  if (word.length > 14) ref.classList.add("name_sm");
  else if (word.length > 9) ref.classList.add("name_md");
}

function formatPokemonName(name) {
  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  return name.split("-").map(capitalizeFirst).join(" ");
}



function renderTypes(i, source = pokemonInfos, idPrefix = "") {
  const typeRef = document.getElementById(`${idPrefix}types${i}`);
  source[i].types.forEach((_, idx) => {
    typeRef.innerHTML += getTypesTemplate(i, idx, source);
  });
}

function renderPicture(i, source = pokemonInfos, idPrefix = "") {
  const pokeID = source[i].id;
  const container = document.getElementById(`${idPrefix}pokemonImg${i}`);
  if (!container) return;

  const img = new Image();
  img.alt = "";  // leerer alt-Text – kein broken-image Text im Layout
  img.src =
    imageCache[pokeID] ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeID}.png`;

  // Fallback auf kleineren Sprite wenn official-artwork fehlt
  img.onerror = () => {
    img.onerror = null;  // Loop verhindern
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeID}.png`;
  };

  container.appendChild(img);
}

function renderMeasure(id, value, unit) {
  document.getElementById(id).innerHTML = (value / 10).toFixed(1) + unit;
}

function renderDialogDescription(i, source = pokemonCharacteristics) {
  const descRef = document.getElementById(`dialog_description${i}`);
  descRef.innerHTML = "";
  const entries = source[i].flavor_text_entries;
  const entry = entries.find((e) => e.language.name === "en");
  if (!entry) return;
  descRef.innerHTML = entry.flavor_text.replace(/[\f\r\n\t]/g, " ");
}

function renderDialogContent(i, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  const sourceDesc = fromSearch ? searchDescriptions : pokemonCharacteristics;
  renderPicture(i, source, "dialog_");
  renderName(i, source, "dialog_");
  renderTypes(i, source, "dialog_");
  renderDialogDescription(i, sourceDesc);
  renderMeasure("height", source[i].height, "m");
  renderMeasure("weight", source[i].weight, "Kg");
  renderStatChart(i, source);
  renderEvolutionChain(i, source);
}

// ============================================
// MODAL
// ============================================
function openDetails(i, fromSearch = false) {
  currentIndex = i;
  isSearchMode = fromSearch;
  const detailRef = document.getElementById("details");
  detailRef.showModal();
  detailRef.classList.add("opened");
  detailRef.innerHTML = getDialogTemplate(i, fromSearch);
  renderDialogContent(i, fromSearch);
}

function switchPokemon(i, fromSearch = false) {
  currentIndex = i;
  const detailRef = document.getElementById("details");
  detailRef.innerHTML = getDialogTemplate(i, fromSearch);
  renderDialogContent(i, fromSearch);
}

function bubbleProtection(event) {
  event.stopPropagation();
}

function closeDetails() {
  const detailRef = document.getElementById("details");
  detailRef.close();
  detailRef.classList.remove("opened");
}

function showTab(tab, i, fromSearch = false) {
  const isFromSearch = fromSearch === true || fromSearch === "true";
  const source = isFromSearch ? searchResults : pokemonInfos;
  document.getElementById("tab_content_info").classList.toggle("d_none", tab !== "info");
  document.getElementById("tab_content_evo").classList.toggle("d_none", tab !== "evo");
  document.getElementById("evoChain").classList.toggle("d_none", tab !== "evo");
  document.getElementById("tab_info").classList.toggle("active", tab === "info");
  document.getElementById("tab_evo").classList.toggle("active", tab === "evo");
  document.getElementById("evoChain").classList.toggle("active", tab === "evo");
  if (tab === "evo") renderEvolutionChain(i, source);
}

function playPokemonCry(i, fromSearch = false) {
  const source = fromSearch === true || fromSearch === "true" ? searchResults : pokemonInfos;
  const url = source[i].cries.latest;
  const audio = new Audio(url);
  audio.volume = 0.2;
  audio.play();
}

// ============================================
// EVOLUTION CHAIN
// ============================================
async function renderEvolutionChain(i, source = pokemonInfos) {
  const pokeId = source[i].id;
  const chain = await fetchEvoChain(pokeId);
  const evoRef = document.getElementById("evoChain");
  evoRef.innerHTML = "";
  if (!chain) return (evoRef.innerHTML = "No Evolution data");

  const wrapper = document.createElement("div");
  wrapper.classList.add("evo_chain");

  let level = [{ species: chain.species, details: null, evolves_to: chain.evolves_to }];
  let first = true;

  while (level.length > 0) {
    if (!first) wrapper.appendChild(createConnector());
    first = false;

    const row = document.createElement("div");
    row.classList.add("evo_level");
    level.forEach((node) => row.appendChild(evoCard(node.species, node.details, pokeId)));
    wrapper.appendChild(row);

    level = level.flatMap((node) =>
      (node.evolves_to || []).map((evo) => ({
        species: evo.species,
        details: evo.evolution_details,
        evolves_to: evo.evolves_to,
      })),
    );
  }

  evoRef.appendChild(wrapper);
}

function evoCard(species, details, currentId) {
  const id = species.url.split("/").filter(Boolean).pop();
  const card = document.createElement("div");
  card.classList.add("evo_stage");
  if (String(id) === String(currentId)) card.classList.add("evo_current");

  const label = getEvoMethodLabel(details);
  if (label) {
    const method = document.createElement("span");
    method.classList.add("evo_method");
    method.textContent = label;
    card.appendChild(method);
  }

  card.appendChild(evoImg(species.url));

  const name = document.createElement("span");
  name.classList.add("evo_stage_name");
  name.textContent = species.name.charAt(0).toUpperCase() + species.name.slice(1);
  card.appendChild(name);

  return card;
}

function createConnector() {
  const div = document.createElement("div");
  div.classList.add("evo_connector");
  div.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
  return div;
}

function getEvoMethodLabel(details) {
  if (!details || details.length === 0) return "";
  const d = details[0];
  if (d.min_level) return `Lv. ${d.min_level}`;
  if (d.item) return d.item.name.replace(/-/g, " ");
  if (d.trigger?.name === "trade") return "Trade";
  if (d.min_happiness) return "Friendship";
  return d.trigger?.name ? d.trigger.name.replace(/-/g, " ") : "";
}

function evoImg(url) {
  const id = url.split("/").filter(Boolean).pop();
  const img = new Image();
  img.src =
    imageCache[id] ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  return img;
}

// ============================================
// STATS CHART
// ============================================
function renderStatChart(i, source = pokemonInfos) {
  const ctx = document.querySelector(".stat_canvas");
  Chart.getChart(ctx)?.destroy();

  const stats = source[i].stats;
  const names = stats.map((s) =>
    s.stat.name.replace("special-attack", "S.Attack").replace("special-defense", "S.Defense").toUpperCase(),
  );
  const values = stats.map((s) => s.base_stat);

  new Chart(ctx, {
    type: "radar",
    data: { labels: names, datasets: [{ label: "", data: values, borderWidth: 1 }] },
    options: {
      layout: { padding: { left: 35, right: 35, top: 10, bottom: 10 } },
      maintainAspectRatio: true,
      responsive: false,
      scales: {
        r: {
          beginAtZero: true,
          ticks: { stepSize: 50, backdropColor: "transparent", color: "#666", display: false },
          grid: { color: "rgba(0,0,0,0.15)" },
          angleLines: { color: "rgba(0,0,0,0.15)" },
          pointLabels: { color: "#333", font: { size: 9, weight: "bold", family: "Pixelify Sans" } },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

// ============================================
// SEARCH
// ============================================
function clearContent() {
  document.getElementById("content").innerHTML = "";
}

function resetSearch() {
  searchResults = [];
  searchDescriptions = [];
  filteredIndices = [];
  isLoading = false;
  document.getElementById("loader").classList.add("d_none");
  document.querySelector(".load_more button").disabled = false;
  document.querySelector("input").value = "";
  document.getElementById("search_hint").classList.remove("visible");
  clearContent();
  renderPokemonCard(0);
}

async function searchPokemon() {
  const input = document.querySelector("input").value.toLowerCase();
  const cardRef = document.getElementById("content");
  clearContent();

  if (input.length === 0) {
    document.getElementById("search_hint").classList.remove("visible");
    setMoreBtn(false);
    resetSearch();
    return;
  }

  const isNumber = !isNaN(input) && input.trim() !== "";
  if (!isNumber && input.length < 3) {
    document.getElementById("search_hint").classList.add("visible");
    setMoreBtn(true);
    return;
  }

  document.getElementById("search_hint").classList.remove("visible");
  document.getElementById("loader").classList.add("d_none");
  document.querySelector(".load_more button").disabled = true;

  if (!searchLocally(input, cardRef)) await searchGlobally(input, cardRef);
}

function searchLocally(input, cardRef) {
  const filtered = pokemonInfos.filter(
    (p) => p.name.includes(input) || String(p.id) === String(Number(input)),
  );
  if (filtered.length === 0) return false;
  filteredIndices = filtered.map((p) => pokemonInfos.indexOf(p));
  filtered.forEach((p) => {
    const index = pokemonInfos.indexOf(p);
    cardRef.innerHTML += getPokemonCardTemplate(index);
    renderCardContent(index);
  });
  return true;
}

async function searchGlobally(input, cardRef) {
  const matches = allPokemonList.filter(
    (p) => p.name.includes(input) || p.url.includes(`/pokemon/${Number(input)}/`),
  );
  if (matches.length === 0) {
    cardRef.innerHTML = `<p>No Pokémon found for "${input}"</p>`;
    return;
  }
  await fetchSearchData(matches);
  renderSearchCards(cardRef);
}

async function fetchSearchData(matches) {
  const results = (
    await Promise.all(
      matches.map(async (match) => {
        const info = await safeFetch(match.url);
        if (!info) return null;
        const description = await getPkmDescriptionByUrl(info.species.url);
        return description ? [info, description] : null;
      }),
    )
  ).filter(Boolean);
  searchResults = results.map(([info]) => info);
  searchDescriptions = results.map(([, description]) => description);
  await Promise.all(searchResults.map((info) => getFrontPicture(info.id)));
  isSearchMode = true;
}

function renderSearchCards(cardRef) {
  cardRef.innerHTML = "";
  searchResults.forEach((_, i) => {
    cardRef.innerHTML += getPokemonCardTemplate(i, true);
    renderCardContent(i, true);
  });
}

// ============================================
// HOLO CARD EFFECT – Maussteuerung (v3)
// Ersetzt den vorherigen Block in script.js
// ============================================

function initHoloEffect() {
  const content = document.getElementById("content");
  let rafId = null;

  content.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".card_section");
    if (!card) return;

    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotY = (x - 0.5) * 12;
      const rotX = -(y - 0.5) * 8;

      card.style.setProperty("--rx", `${rotY}deg`);
      card.style.setProperty("--ry", `${rotX}deg`);
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      card.style.setProperty("--posx", `${x * 100}%`);
      card.style.setProperty("--posy", `${y * 100}%`);
      card.style.setProperty("--o", "1");
    });
  });

  content.addEventListener("mouseout", (e) => {
    const card = e.target.closest(".card_section");
    if (card && !card.contains(e.relatedTarget)) {
      if (rafId) cancelAnimationFrame(rafId);
      resetCard(card);
    }
  });
}

function resetCard(card) {
  card.style.setProperty("--rx", "0deg");
  card.style.setProperty("--ry", "0deg");
  card.style.setProperty("--mx", "50%");
  card.style.setProperty("--my", "50%");
  card.style.setProperty("--posx", "50%");
  card.style.setProperty("--posy", "50%");
  card.style.setProperty("--o", "0");
}

document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => {
    if (document.querySelector(".card_section")) {
      initHoloEffect();
      observer.disconnect();
    }
  });
  observer.observe(document.getElementById("content"), { childList: true });
});