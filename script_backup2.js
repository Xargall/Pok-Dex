let START = 1;
let STOP = START + 20;
let isLoading = false;
let isSearchMode = false;
let currentIndex = 0;

let allPokemonList = [];

let pokemonInfos = [];

let pokemonCharacteristics = [];

let pokemonCry = [];

let filteredIndices = [];

let imageCache = {};

async function init() {
  await fetchAllPokemonNames();
  await bulkLoadPokemon();
}

async function bulkLoadPokemon() {
  const promises = [];
  if (isLoading) return;
  setMoreBtn(true);
  for (let pokeID = 1; pokeID <= 20; pokeID++) {
    promises.push(
      Promise.all([
        loadPokemonInfo(pokeID),
        getPkmDescription(pokeID),
        getFrontPicture(pokeID),
      ]),
    );
  }
  await fetchAndStore(promises);
  START += 20;
  STOP += 20;
  renderPokemonCard();
  if (!isSearchMode) setMoreBtn(false);
}

async function fetchAllPokemonNames() {
  const response = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=100000",
  );
  const data = await response.json();
  allPokemonList = data.results;
}

async function bulkLoadNextPokemon() {
  const renderFrom = pokemonInfos.length;
  if (isLoading) return;
  setMoreBtn(true);
  const promises = [];
  for (let pokeID = START; pokeID < STOP; pokeID++) {
    promises.push(
      Promise.all([
        loadPokemonInfo(pokeID),
        getPkmDescription(pokeID),
        getFrontPicture(pokeID),
      ]),
    );
  }
  await fetchAndStore(promises);
  START += 20;
  STOP += 20;
  renderPokemonCard(renderFrom);
  if (!isSearchMode) setMoreBtn(false);
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

async function loadPokemonInfo(pokeID) {
  let url = `https://pokeapi.co/api/v2/pokemon/${pokeID}/`;
  let result = await fetch(url);
  let resultAsJSON = await result.json();
  return resultAsJSON;
}

async function getPkmDescription(pokeID) {
  const url = `https://pokeapi.co/api/v2/pokemon-species/${pokeID}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return await response.json();
}

async function getPkmDescriptionByUrl(url) {
  const response = await fetch(url);
  if (!response.ok) return null;
  return await response.json();
}

function getFrontPicture(pokeID) {
  return new Promise((resolve, reject) => {
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
    img.onerror = reject;
  });
}

function renderPokemonCard(startIndex = 0) {
  const cardRef = document.getElementById("content");
  for (let i = startIndex; i < pokemonInfos.length; i++) {
    const pokeID = i + 1;
    cardRef.innerHTML += getPokemonCardTemplate(i);
    renderCardContent(i, pokeID);
  }
}

function renderCardContent(i, pokeID, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  renderName(i, source, pkm_);
  renderTypes(i, source, pkm_);
  renderPicture(i, pokeID);
}

function renderPicture(i, pokeID) {
  const img = new Image();
  img.src = imageCache[pokeID];
  img.alt = pokemonInfos[i].name;
  let imgContainer = document.getElementById(`pokemonImg${i}`);
  imgContainer.appendChild(img);
}

function renderName(i, source = pokemonInfos, prefix = "") {
  const ref = document.getElementById(`${prefix}name${i}`);
  const word = source[i].name;
  ref.innerHTML = word.charAt(0).toUpperCase() + word.slice(1);
}

function renderTypes(i, source = pokemonInfos, prefix = "") {
  const typeRef = document.getElementById(`${prefix}types${i}`);
  source[i].types.forEach((_, idx) => {
    typeRef.innerHTML += getTypesTemplate(i, idx, source);
  });
}

function openDetails(i, fromSearch = false) {
  currentIndex = i;
  isSearchMode = fromSearch;
  const detailRef = document.getElementById("details");
  detailRef.showModal();
  detailRef.classList.add("opened");
  detailRef.innerHTML = getDialogTemplate(i, fromSearch);
  renderDialogContent(i, fromSearch);
}

function renderDialogPicture(i, source = pokemonInfos) {
  const img = new Image();
  const pokeID = source[i].id;
  img.src = imageCache[pokeID];
  let imgContainer = document.getElementById(`dialog_pokemonImg${i}`);
  imgContainer.appendChild(img);
}

function renderDialogDescription(i, source = pokemonInfos) {
  const descRef = document.getElementById(`dialog_description${i}`);
  descRef.innerHTML = "";
  const entries = source[i].flavor_text_entries;
  const entry = entries.find((e) => e.language.name === "en");
  if (!entry) return;
  descRef.innerHTML = entry.flavor_text.replace(/[\f\r\n\t]/g, " ");
}

function renderHeight(i, source = pokemonInfos) {
  const heightRef = document.getElementById("height");
  const height = (source[i].height / 10).toFixed(1) + "m";
  heightRef.innerHTML = height;
}

function renderWeight(i, source = pokemonInfos) {
  const weightRef = document.getElementById("weight");
  const weight = (source[i].weight / 10).toFixed(1) + "Kg";
  weightRef.innerHTML = weight;
}

async function renderEvolutionChain(i, source = pokemonInfos) {
  const pokeId = source[i].id;
  const chain = await fetchEvoChain(pokeId);
  const evoRef = document.getElementById("evoChain");
  evoRef.innerHTML = "";
  if (!chain) return (evoRef.innerHTML = "No Evolution data");

  const wrapper = document.createElement("div");
  wrapper.classList.add("evo_chain");

  let level = [
    { species: chain.species, details: null, evolves_to: chain.evolves_to },
  ];
  let first = true;

  while (level.length > 0) {
    if (!first) wrapper.appendChild(createConnector());
    first = false;

    const row = document.createElement("div");
    row.classList.add("evo_level");
    level.forEach((node) =>
      row.appendChild(evoCard(node.species, node.details, pokeId)),
    );
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

async function fetchEvoChain(pokeId) {
  if (pokeId > 10000) return null;
  const speciesRes = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${pokeId}`,
  );
  if (!speciesRes.ok) return null;
  const species = await speciesRes.json();
  const evoRes = await fetch(species.evolution_chain.url);
  return (await evoRes.json()).chain;
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
  name.textContent =
    species.name.charAt(0).toUpperCase() + species.name.slice(1);
  card.appendChild(name);

  return card;
}

function createConnector() {
  const div = document.createElement("div");
  div.classList.add("evo_connector");
  div.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
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

function showTab(tab, i, fromSearch = false) {
  const isFromSearch = fromSearch === true || fromSearch === "true";
  const source = isFromSearch ? searchResults : pokemonInfos;
  document
    .getElementById("tab_content_info")
    .classList.toggle("d_none", tab !== "info");
  document
    .getElementById("tab_content_evo")
    .classList.toggle("d_none", tab !== "evo");
  document.getElementById("evoChain").classList.toggle("d_none", tab !== "evo");
  document
    .getElementById("tab_info")
    .classList.toggle("active", tab === "info");
  document.getElementById("tab_evo").classList.toggle("active", tab === "evo");
  document.getElementById("evoChain").classList.toggle("active", tab === "evo");
  if (tab === "evo") renderEvolutionChain(i, source);
}

function playPokemonCry(i, fromSearch = false) {
  const source =
    fromSearch === true || fromSearch === "true" ? searchResults : pokemonInfos;
  const url = source[i].cries.latest;
  const audio = new Audio(url);
  audio.volume = 0.2;
  audio.play();
}

function renderDialogContent(i, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  const sourceDesc = fromSearch ? searchDescriptions : pokemonCharacteristics;
  renderDialogPicture(i, source);
  renderName(i, source, dialog_);
  renderTypes(i, source, dialog_);
  renderDialogDescription(i, sourceDesc);
  renderHeight(i, source);
  renderWeight(i, source);
  renderStatChart(i, source);
  renderEvolutionChain(i, source);
}

function bubbleProtection(event) {
  event.stopPropagation();
}

function closeDetails() {
  const detailRef = document.getElementById("details");
  detailRef.close();
  detailRef.classList.remove("opened");
}

async function searchPokemon() {
  const input = document.querySelector("input").value.toLowerCase();
  const cardRef = document.getElementById("content");
  clearContent();

  if (input.length === 0) return handleEmptyInput();
  if (isInvalidInput(input)) return handleInvalidInput();

  handleValidInput(cardRef, input);
}

function handleEmptyInput() {
  document.getElementById("search_hint").classList.remove("visible");
  setMoreBtn(false);
  resetSearch();
}

function isInvalidInput(input) {
  const isNumber = !isNaN(input) && input.trim() !== "";
  return !isNumber && input.length < 3;
}

function handleInvalidInput() {
  document.getElementById("search_hint").classList.add("visible");
  setMoreBtn(true);
}

async function handleValidInput(cardRef, input) {
  document.getElementById("search_hint").classList.remove("visible");
  document.getElementById("loader").classList.add("d_none");
  document.querySelector(".load_more button").disabled = true;
  if (!searchLocally(input, cardRef)) await searchGlobally(input, cardRef);
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

function searchLocally(input, cardRef) {
  const filtered = pokemonInfos.filter(
    (p) => p.name.includes(input) || String(p.id) === String(Number(input)),
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
    (p) =>
      p.name.includes(input) || p.url.includes(`/pokemon/${Number(input)}/`),
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
  const results = (
    await Promise.all(
      matches.map((match) =>
        fetch(match.url)
          .then((r) => r.json())
          .then((info) =>
            Promise.all([
              Promise.resolve(info),
              getPkmDescriptionByUrl(info.species.url),
            ]),
          ),
      ),
    )
  ).filter(([, description]) => description !== null);
  searchResults = results.map(([info]) => info);
  searchDescriptions = results.map(([, description]) => description);
  await Promise.all(searchResults.map((info) => getFrontPicture(info.id)));
  isSearchMode = true;
}

function renderSearchCards(cardRef) {
  cardRef.innerHTML = "";
  searchResults.forEach((_, i) => {
    cardRef.innerHTML += getPokemonCardTemplate(i, true);
    renderCardContent(i, searchResults[i].id, true);
  });
}

function renderStatChart(i) {
  const ctx = document.querySelector(".stat_canvas");
  Chart.getChart(ctx)?.destroy();

  const names = pokemonInfos[i].stats.map((s) =>
    s.stat.name
      .replace("special-attack", "S.Attack")
      .replace("special-defense", "S.Defense")
      .toUpperCase(),
  );
  const stats = pokemonInfos[i].stats.map((s) => s.base_stat);
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: names,
      datasets: [
        {
          label: "",
          data: stats,
          borderWidth: 1,
        },
      ],
    },
    options: {
      layout: {
        padding: {
          left: 35,
          right: 35,
          top: 10,
          bottom: 10,
        },
      },
      maintainAspectRatio: true,
      responsive: false,
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            stepSize: 50,
            backdropColor: "transparent",
            color: "#666",
            display: false,
          },
          grid: {
            color: "rgba(0,0,0,0.15)",
          },
          angleLines: {
            color: "rgba(0,0,0,0.15)",
          },
          pointLabels: {
            color: "#333",
            font: { size: 9, weight: "bold", family: "Pixelify Sans" },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function switchPokemon(i, fromSearch = false) {
  const isFromSearch = fromSearch === true || fromSearch === "true";
  currentIndex = i;
  const detailRef = document.getElementById("details");
  detailRef.innerHTML = getDialogTemplate(i, fromSearch);
  renderDialogContent(i, fromSearch);
}

function clearContent() {
  const loader = document.getElementById("loader");
  const cardRef = document.getElementById("content");
  cardRef.innerHTML = "";
}
