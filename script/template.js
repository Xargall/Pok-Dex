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
                    <div id="description${i}"></div>
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

function getDialogTemplate(i) {
  return /*html*/ `
        <section class="detail_view">
            <div class="detail_head">
                <div id="dialog_pokemonImg${i}" class="pkm_sprite"></div>
                <button></button>
            </div>
            <div class="detail_pkm">
                <p>#${pokemonInfos[i].id}</p>
                <h2 id="dialog_name${i}"></h2>
                <div id="dialog_types${i}" class="types"></div>
            </div>
            <div class="description">
                <article id="dialog_description${i}"></article>
                <div class="measures">
                    <div>
                        <p>Height</p>
                        <p id="height"></p>
                    </div>
                    <div>
                        <p>Weight</p>
                        <p id="weight"></p>
                    </div>
                </div>
            </div>
            <div class="stat_block">
                <table id="table">
                </table>
            </div>
            <div class="evolution" id="evoChain"></div>
        </section>
    `;
}

function getTableTemplate(i) {
  return /*html*/ `
        <tr>
            <td>HP</td>
            <td>${pokemonInfos[i].stats[0].base_stat}</td>
        </tr>
        <tr>
            <td>Attack</td>
            <td>${pokemonInfos[i].stats[1].base_stat}</td>
        </tr>
        <tr>
            <td>Defense</td>
            <td>${pokemonInfos[i].stats[2].base_stat}</td>
        </tr>
        <tr>
            <td>S-Attack</td>
            <td>${pokemonInfos[i].stats[3].base_stat}</td>
        </tr>
        <tr>
            <td>S-Defense</td>
            <td>${pokemonInfos[i].stats[4].base_stat}</td>
        </tr>
        <tr>
            <td>Speed</td>
            <td>${pokemonInfos[i].stats[5].base_stat}</td>
        </tr>
    `;
}
