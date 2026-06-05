const BASE_URL = "https://pokeapi.co/api/v2/pokemon?limit=151&offset=0";
const pokeList = [];

function init() {
  fetchPokeApi();
}

async function fetchPokeApi() {
  const response = await fetch(BASE_URL)
    .then((response) => response.json())
    .then((data) => {
      let results = data.results;
      let promisesArray = results.map((result) => {
        return fetch(result.url).then((response) => response.json());
      });
      return Promise.all(promisesArray);
    })
    .then((data) =>
      this.setState({ pokemon: data }, () =>
        console.log("Main Pokemon State: ", this.state.pokemon),
      ),
    );
}
