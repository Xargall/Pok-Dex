let START = 1;
let STOP = START + 20;
let isLoading = false;

let pokemon = [];

let pokemonInfos = [];

let pokemonCharacteristics = [];

let imageCache = {};

async function init() {
  let url = "https://pokeapi.co/api/v2/pokemon/?offset=0&limit=151";
  let result = await fetch(url);
  let resultAsJSON = await result.json();
  pokemon = resultAsJSON.results;
  await bulkLoadPokemon();
  console.log(pokemonInfos);
  console.log(pokemonCharacteristics);
  console.log(imageCache);
}

async function bulkLoadPokemon() {
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
}

async function bulkLoadNextPokemon() {
  const renderFrom = pokemonInfos.length;
  if (isLoading) return;
  isLoading = true;
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
  isLoading = false;
}

async function loadPokemonInfo(pokeID) {
  let url = `https://pokeapi.co/api/v2/pokemon/${pokeID}/`;
  let result = await fetch(url);
  let resultAsJSON = await result.json();
  return resultAsJSON;
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
      imageCache[pokeID] = url; // Bild im Cache speichern
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
  renderDescription(i);
}

function renderPicture(i, pokeID) {
  const img = new Image();
  img.src = imageCache[pokeID];
  let imgContainer = document.getElementById(`pokemonImg${i}`);
  imgContainer.appendChild(img);
}

function renderName(i) {
  let pkmNameRef = document.getElementById(`pkm_name${i}`);
  const word = pokemon[i].name;
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

async function getPkmDescription(pokeID) {
  let url = `https://pokeapi.co/api/v2/pokemon-species/${pokeID}`;
  let characteristics = await fetch(url);
  let characteristicsAsJSON = await characteristics.json();
  return characteristicsAsJSON;
}

function renderDescription(i) {
  const descRef = document.getElementById(`description${i}`);
  descRef.innerHTML = "";
  let characteristicsDisplay =
    pokemonCharacteristics[i].flavor_text_entries[2].flavor_text;
  let newDescription = characteristicsDisplay.replace(/[\f\r\n\t]/g, " ");
  descRef.innerHTML = newDescription;
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
  const word = pokemon[i].name;
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

function renderDialogContent(i) {
  renderDialogPicture(i);
  renderDialogName(i);
  renderDialogTypes(i);
  renderDialogDescription(i);
}

function closeDetails() {
  const detailRef = document.getElementById("details");
  detailRef.close();
  detailRef.classList.remove("opened");
}
