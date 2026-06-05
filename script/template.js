function getPokemonCardTemplate(i) {
  return /*html*/ `
        <section class="card_section ${pokemonInfos[i].types[0].type.name}">
            <div class="card_head">
                <div id="types${i}" class="types"></div>
                <p>#${pokemonInfos[i].id}</p>
            </div>
            <div class="card_body">
                <div>
                    <h3 id="pkm_name${i}"></h3>
                    <div></div>
                    <button onclick="openDetails(${i})"></button>
                </div>
                <div id="pokemonImg${i}" class="pkm_sprite"></div>
            </div>
        </section>
    `;
}

function getTypesTemplate(i, index) {
  return /*html*/ `
    <div class="${pokemonInfos[i].types[index].type.name} type_tag">${pokemonInfos[i].types[index].type.name}</div>
`;
}
