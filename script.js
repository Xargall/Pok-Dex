let START = 1;
let STOP = START + 20;

let pokemon = [];

let pokemonInfos = [];

let imageCache = {};

async function init() {
  let url = "https://pokeapi.co/api/v2/pokemon/?offset=0&limit=20";
  let result = await fetch(url);
  let resultAsJSON = await result.json();
  pokemon = resultAsJSON.results;
  bulkLoadPokemon();
  console.log(pokemonInfos);
}

async function bulkLoadPokemon() {
  for (let pokeID = 1; pokeID <= 20; pokeID++) {
    const currentPokemon = await loadPokemonInfo(pokeID);
    pokemonInfos.push(currentPokemon);
    const imgs = await getFrontPicture(pokeID);
  }
  renderPokemonCard();
}

async function bulkLoadNextPokemon() {
  for (let id = START; id < STOP; id++) {
    const currentPokemon = await loadPokemonInfo(id);
    pokemonInfos.push(currentPokemon);
  }

  START += 20; // 1.  21.     41
  STOP += 20; // 21.  41      61
}

async function loadPokemonInfo(pokeID) {
  let url = `https://pokeapi.co/api/v2/pokemon/${pokeID}/`;
  let result = await fetch(url);
  let resultAsJSON = await result.json();
  return resultAsJSON;
}

function getFrontPicture(pokeID) {
  return new Promise((resolve, reject) => {
    // Wenn das Bild bereits im Cache ist, sofort zurückgeben
    if (imageCache[pokeID]) {
      resolve(imageCache[pokeID]);
      return;
    }
    const img = new Image();
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokeID}.gif`;
    img.onload = () => {
      imageCache[pokeID] = img; // Bild im Cache speichern
      resolve(img);
    };
    img.onerror = reject;
  });
}

function getPokemonImageUrl(pokeID) {
  if (!imageCache[pokeID]) {
    imageCache[pokeID] =
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdows//${pokeID}.png`;
  }
  return imageCache[pokeID];
}

async function renderPokemonCard() {
  const cardRef = document.getElementById("content");

  cardRef.innerHTML = "";
  for (let i = 0; i < pokemon.length; i++) {
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

async function renderPicture(i, pokeID) {
  let pokemonImage = await getFrontPicture(pokeID);
  let imgContainer = document.getElementById(`pokemonImg${i}`);
  imgContainer.appendChild(pokemonImage);
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

function openDetails(i) {
  const detailRef = document.getElementById("details");
  detailRef.showModal();
  detailRef.classList.add("opened");
}

function closeDetails() {
  const detailRef = document.getElementById("details");
  detailRef.close();
  detailRef.classList.remove("opened");
}
