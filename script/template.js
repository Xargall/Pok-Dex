function getPokemonCardTemplate(i, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  return /*html*/ `
        <section class="card_section">
            <div class="card_head">
                <h3 id="pkm_name${i}"></h3>
                <p>#${String(source[i].id).padStart(3, "0")}</p>
            </div>
            <div class="card_body">
                <div class="body_left">
                    <div id="types${i}" class="types"></div>
                    <div class="poke_box" onclick="openDetails(${i}, ${fromSearch})">
                        <div class="pokeball">
                            <button  class="more_btn pokeball__button" aria-label="open_details"></button>
                        </div>   
                    </div>
                    
                </div>
                <div id="pokemonImg${i}" class="pkm_sprite"></div>
            </div>
        </section>
    `;
}

function getTypesTemplate(i, index, source = pokemonInfos) {
  const typeName = source[i].types[index].type.name;
  const capitalizedType = typeName.charAt(0).toUpperCase() + typeName.slice(1);
  return /*html*/ `
    <div class="${typeName} type_tag">${capitalizedType}</div>
  `;
}

function getDialogTemplate(i, fromSearch = false) {
  const source = fromSearch ? searchResults : pokemonInfos;
  return /*html*/ `
    <div onclick="bubbleProtection(event)">
        <div class="dialog_controls">
                    <button class="dialog_prev" onclick="switchPokemon(${i} - 1, ${fromSearch})" ${i === 0 || fromSearch ? "disabled" : ""}>‹</button>
                    <button onclick="event.stopPropagation(); showTab('info', ${i}, ${fromSearch})" class="tab_btn active" id="tab_info">Info</button>
                    <button onclick="event.stopPropagation(); showTab('evo', ${i}, ${fromSearch})" class="tab_btn" id="tab_evo">Evolution</button>
                    <button class="dialog_next" onclick="switchPokemon(${i} + 1, ${fromSearch})" ${i === pokemonInfos.length - 1 || fromSearch ? "disabled" : ""}>›</button>
</div>
        <section class="detail_view ${source[i].types[0].type.name}">
            <div class="detail_head ${source[i].types[0].type.name} ">
                <div class="dialog_headline">
                    <h2 id="dialog_name${i}"></h2>
                    <p>#${String(source[i].id).padStart(3, "0")}</p>
                </div>
                <div class="dialog_imgs">      
                    <div id="dialog_pokemonImg${i}" class="detail_sprite"></div>
                    <button class="cry_btn" onclick="playPokemonCry(${i}, ${fromSearch})"><img src="./assets/icons/Professor Oak.png" alt=""></button>
                </div>    
            </div>
            <div class="detail_body"> 
                <div class="detail_pkm">                                
                    <div id="dialog_types${i}" class="dialog_types"></div>
                </div>
                <div id="tab_content_info" class="tab_content">
                    <div class="description">
                        <article id="dialog_description${i}" class="detail_description"></article>
                        <div class="measures">
                            <div class="measures_style">
                                <p>Height</p>
                                <p id="height"></p>
                            </div>
                            <div class="measures_style">
                                <p>Weight</p>
                                <p id="weight"></p>
                        </div>
                    </div>
                    <div class="stat_chart">
                        <canvas class="stat_block stat_canvas"></canvas>    
                    </div>            
                </div>
            </div>
            <div id="tab_content_evo" class="tab_content d_none">
                <div class="evolution center_evo" id="evoChain"></div>
            </div>
            </div>
            
        </section>
    </div>    
    `;
}
