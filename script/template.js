function getPokemonCardTemplate(i) {
  return /*html*/ `
        <section class="card_section">
            <div class="card_head">
                <h3 id="pkm_name${i}"></h3>
                <p>#${String(pokemonInfos[i].id).padStart(3, "0")}</p>
            </div>
            <div class="card_body">
                <div class="body_left">
                    <div id="types${i}" class="types"></div>
                    <div class="poke_box" onclick="openDetails(${i})">
                        <div class="pokeball">
                            <button  class="more_btn pokeball__button"></button>
                        </div>   
                    </div>
                    
                </div>
                <div id="pokemonImg${i}" class="pkm_sprite"></div>
            </div>
        </section>
    `;
}

function getTypesTemplate(i, index) {
  return /*html*/ `
    <div class="${pokemonInfos[i].types[index].type.name} type_tag">${pokemonInfos[i].types[index].type.name.charAt(0).toUpperCase() + pokemonInfos[i].types[index].type.name.slice(1)}</div>
`;
}

function getDialogTemplate(i) {
  return /*html*/ `
        <section class="detail_view ${pokemonInfos[i].types[0].type.name}" onclick="bubbleProtection(event)">
            <div class="detail_head ${pokemonInfos[i].types[0].type.name} ">
                <div class="dialog_headline">
                    <h2 id="dialog_name${i}"></h2>
                    <p>#${String(pokemonInfos[i].id).padStart(3, "0")}</p>
                </div>
                <div class="dialog_imgs">      
                    <div id="dialog_pokemonImg${i}" class="detail_sprite"></div>
                    <button class="cry_btn" onclick="playPokemonCry(${i})"><img src="../assets/icons/Professor Oak.png" alt=""></button>
                </div>    
            </div>
            <div class="detail_body"> 
                <div class="detail_pkm">                                
                    <div id="dialog_types${i}" class="dialog_types"></div>
                </div>
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
                        <canvas class="stat_block" id="myChart${i}">
                        </canvas>    
                    </div>            
                </div>
                <div class="evolution" id="evoChain"></div>
            </div>
            
        </section>
    `;
}


