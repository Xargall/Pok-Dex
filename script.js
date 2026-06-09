let START = 1;
let STOP = START + 20;
let isLoading = false;

let pokemonInfos = [];

let pokemonCharacteristics = [];

let pokemonCry = [];

let imageCache = {};

async function init() {
  await bulkLoadPokemon();
  console.log(pokemonInfos);
  console.log(pokemonCharacteristics);  
}

async function bulkLoadPokemon() {
  document.getElementById("loader").style.display = "flex";
  const promises = [];
  for (let pokeID = 1; pokeID <= 20; pokeID++) {
    promises.push(
      Promise.all([
        loadPokemonInfo(pokeID),
        getPkmDescription(pokeID),
        getFrontPicture(pokeID),
      ]),
    );
  }
  const results = await Promise.all(promises);
  for (const [info, description] of results) {
    pokemonInfos.push(info);
    pokemonCharacteristics.push(description);
  }
  START += 20;
  STOP += 20;
  renderPokemonCard();
  document.getElementById("loader").style.display = "none";
}

async function bulkLoadNextPokemon() {
  const renderFrom = pokemonInfos.length;
  if (isLoading) return;
  isLoading = true;
  document.getElementById("loader").style.display = "flex";
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
  const results = await Promise.all(promises);
  for (const [info, description] of results) {
    pokemonInfos.push(info);
    pokemonCharacteristics.push(description);
  }
  START += 20;
  STOP += 20;
  renderPokemonCard(renderFrom);
  document.getElementById("loader").style.display = "none";
  isLoading = false;
}

async function loadPokemonInfo(pokeID) {
  let url = `https://pokeapi.co/api/v2/pokemon/${pokeID}/`;
  let result = await fetch(url);
  let resultAsJSON = await result.json();
  return resultAsJSON;
}

async function getPkmDescription(pokeID) {
  let url = `https://pokeapi.co/api/v2/pokemon-species/${pokeID}`;
  let characteristics = await fetch(url);
  let characteristicsAsJSON = await characteristics.json();
  return characteristicsAsJSON;
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

function renderCardContent(i, pokeID) {
  renderPicture(i, pokeID);
  renderName(i);
  renderTypes(i);
}

function renderPicture(i, pokeID) {
  const img = new Image();
  img.src = imageCache[pokeID];
  let imgContainer = document.getElementById(`pokemonImg${i}`);
  imgContainer.appendChild(img);
}

function renderName(i) {
  let pkmNameRef = document.getElementById(`pkm_name${i}`);
  const word = pokemonInfos[i].name;
  const capitalizedName = word.charAt(0).toUpperCase() + word.slice(1);
  pkmNameRef.innerHTML = capitalizedName;
}

function renderTypes(i) {
  const typeRef = document.getElementById(`types${i}`);
  let typeArray = pokemonInfos[i].types;
  for (let index = 0; index < typeArray.length; index++) {
    typeRef.innerHTML += getTypesTemplate(i, index);
  }
}


function openDetails(i) {
  const detailRef = document.getElementById("details");
  detailRef.showModal();
  detailRef.classList.add("opened");
  detailRef.innerHTML = getDialogTemplate(i);
  renderDialogContent(i);
}

function renderDialogPicture(i) {
  const img = new Image();
  const pokeID = i + 1;
  img.src = imageCache[pokeID];
  let imgContainer = document.getElementById(`dialog_pokemonImg${i}`);
  imgContainer.appendChild(img);
}

function renderDialogName(i) {
  let pkmNameRef = document.getElementById(`dialog_name${i}`);
  const word = pokemonInfos[i].name;
  const capitalizedName = word.charAt(0).toUpperCase() + word.slice(1);
  pkmNameRef.innerHTML = capitalizedName;
}

function renderDialogTypes(i) {
  const typeRef = document.getElementById(`dialog_types${i}`);
  let typeArray = pokemonInfos[i].types;
  for (let index = 0; index < typeArray.length; index++) {
    typeRef.innerHTML += getTypesTemplate(i, index);
  }
}

function renderDialogDescription(i) {
  const descRef = document.getElementById(`dialog_description${i}`);
  descRef.innerHTML = "";
  let characteristicsDisplay =
    pokemonCharacteristics[i].flavor_text_entries[2].flavor_text;
  let newDescription = characteristicsDisplay.replace(/[\f\r\n\t]/g, " ");
  descRef.innerHTML = newDescription;
}

function renderHeight(i) {
  const heightRef = document.getElementById("height");
  const height = (pokemonInfos[i].height / 10).toFixed(1) + "m";
  heightRef.innerHTML = height;
}

function renderWeight(i) {
  const weightRef = document.getElementById("weight");
  const weight = (pokemonInfos[i].weight / 10).toFixed(1) + "Kg";
  weightRef.innerHTML = weight;
}

function renderTable(i) {
  const tableRef = document.getElementById("table");
  tableRef.innerHTML = getTableTemplate(i);
}

async function renderEvolutionChain(i) {
  let pokeId = i + 1;
  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`,);
  const species = await speciesRes.json();
  const evoRes = await fetch(species.evolution_chain.url);
  const chain = (await evoRes.json()).chain;
  const evoRef = document.getElementById("evoChain");
  evoRef.innerHTML = "";
  if (chain.evolves_to.length === 0) return (evoRef.innerHTML = "No Evolution");
  evoRef.appendChild(evoImg(chain.species.url));
  evoRef.innerHTML += " → ";
  evoRef.appendChild(evoImg(chain.evolves_to[0].species.url));
  if (chain.evolves_to[0].evolves_to.length > 0) {
    evoRef.innerHTML += " → ";
    evoRef.appendChild(evoImg(chain.evolves_to[0].evolves_to[0].species.url));
  }
}

function evoImg(url) {
  const id = url.split("/").filter(Boolean).pop();
  const img = new Image();
  img.src =
    imageCache[id] ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  return img;
}

function renderDialogContent(i) {
  renderDialogPicture(i);
  renderDialogName(i);
  renderDialogTypes(i);
  renderDialogDescription(i);
  renderHeight(i);
  renderWeight(i);
  renderTable(i);
  renderEvolutionChain(i);
}

function bubbleProtection(event) {
  event.stopPropagation();
}

function closeDetails() {
  const detailRef = document.getElementById("details");
  detailRef.close();
  detailRef.classList.remove("opened");
}

function searchPokemon() {
  const input = document.querySelector("input").value.toLowerCase();
  const cardRef = document.getElementById("content");
  cardRef.innerHTML = "";
  if (input.length === 0) return renderPokemonCard(0);
  const filtered = pokemonInfos.filter((p) => p.name.includes(input));
  filtered.forEach((p) => {
    const index = pokemonInfos.indexOf(p);
    cardRef.innerHTML += getPokemonCardTemplate(index);
    renderCardContent(index, p.id);
  });
}

function playPokemonCry(i) {
  const url = pokemonInfos[i].cries.latest;
  const audio = new Audio(url);
  audio.play();
}
