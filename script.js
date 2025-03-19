document.addEventListener('DOMContentLoaded', () => {
    const pokemonContainer = document.querySelector('.pokemon-container');
    const sidebarItems = document.querySelectorAll('.pokemonSideBar li');
    let currentFilter = null;
    let loading = false;
    let currentPokemonId = 1;
    const pokemonsPerLoad = 20;
    const maxPokemon = 1025;

    async function fetchPokemonData(id) {
        try {
            const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const pokemonData = await pokemonResponse.json();
            
            const speciesResponse = await fetch(pokemonData.species.url);
            const speciesData = await speciesResponse.json();
            
            return {
                name: pokemonData.name,
                number: pokemonData.id,
                image: pokemonData.sprites.other['official-artwork'].front_default,
                types: pokemonData.types.map(type => type.type.name),
                species: speciesData.genera.find(g => g.language.name === "en").genus,
                height: pokemonData.height / 10, // Convert to meters
                weight: pokemonData.weight / 10, // Convert to kg
                abilities: pokemonData.abilities.map(ability => ability.ability.name),
                stats: pokemonData.stats.map(stat => ({
                    name: stat.stat.name,
                    value: stat.base_stat
                })),
                moves: pokemonData.moves.map(move => move.move.name)
            };
        } catch (error) {
            console.error('Error fetching Pokemon:', error);
            return null;
        }
    }

    function showPokemonDetails(pokemon) {
        const modal = document.getElementById('pokemonModal');
        const modalContent = document.getElementById('modalContent');
        
        const statsHTML = pokemon.stats.map(stat => 
            `<div class="stat-bar">
                <span class="stat-name">${stat.name}: ${stat.value}</span>
                <div class="stat-bar-fill" style="width: ${(stat.value / 255) * 100}%"></div>
            </div>`
        ).join('');

        modalContent.innerHTML = `
            <img src="${pokemon.image}" alt="${pokemon.name}">
            <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
            <p class="pokemon-number">#${pokemon.number}</p>
            <p class="pokemon-types">Types: ${pokemon.types.join(' / ')}</p>
            <p class="pokemon-species">${pokemon.species}</p>
            <div class="pokemon-details">
                <p>Height: ${pokemon.height}m</p>
                <p>Weight: ${pokemon.weight}kg</p>
                <p>Abilities: ${pokemon.abilities.join(', ')}</p>
            </div>
            <div class="pokemon-stats">
                <h3>Base Stats</h3>
                ${statsHTML}
            </div>
            <div class="pokemon-moves">
                <h3>Moves</h3>
                <div class="moves-list">
                    ${pokemon.moves.slice(0, 8).join(', ')}...
                </div>
            </div>
        `;
        
        modal.style.display = "block";
        
        const closeBtn = document.getElementsByClassName("close")[0];
        closeBtn.onclick = () => modal.style.display = "none";
        
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }

    async function loadMorePokemon() {
        if (loading || currentPokemonId > maxPokemon) return;
        
        loading = true;
        const endId = Math.min(currentPokemonId + pokemonsPerLoad, maxPokemon);
        
        try {
            for (let i = currentPokemonId; i <= endId; i++) {
                const pokemonData = await fetchPokemonData(i);
                if (pokemonData) {
                    const card = createPokemonCard(pokemonData);
                    pokemonContainer.appendChild(card);
                }
            }
            currentPokemonId = endId + 1;
        } catch (error) {
            console.error('Error loading Pokemon:', error);
        } finally {
            loading = false;
        }
    }

    function handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 800 && !currentFilter) {
            loadMorePokemon();
        }
    }

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                handleScroll();
                scrollTimeout = null;
            }, 100);
        }
    });

    loadMorePokemon();

    function createPokemonCard(pokemon) {
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <img class="pokemon-image" src="${pokemon.image}" alt="${pokemon.name}">
            <div class="pokemon-info">
                <h3 class="pokemon-name">${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>
                <p class="pokemon-number">#${pokemon.number}</p>
                <p class="pokemon-types">${pokemon.types.join(' / ')}</p>
                <p class="pokemon-species">${pokemon.species}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            const modal = document.getElementById('pokemonModal');
            const modalContent = document.getElementById('modalContent');
            
            const statsHTML = pokemon.stats.map(stat => 
                `<div class="stat-bar">
                    <span class="stat-name">${stat.name}: ${stat.value}</span>
                    <div class="stat-bar-fill" style="width: ${(stat.value / 255) * 100}%"></div>
                </div>`
            ).join('');
    
            modalContent.innerHTML = `
                <img src="${pokemon.image}" alt="${pokemon.name}">
                <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
                <p class="pokemon-number">#${pokemon.number}</p>
                <p class="pokemon-types">Types: ${pokemon.types.join(' / ')}</p>
                <p class="pokemon-species">${pokemon.species}</p>
                <div class="pokemon-details">
                    <p>Height: ${pokemon.height}m</p>
                    <p>Weight: ${pokemon.weight}kg</p>
                    <p>Abilities: ${pokemon.abilities.join(', ')}</p>
                </div>
                <div class="pokemon-stats">
                    <h3>Base Stats</h3>
                    ${statsHTML}
                </div>
                <div class="pokemon-moves">
                    <h3>Moves</h3>
                    <div class="moves-list">
                        ${pokemon.moves.slice(0, 8).join(', ')}...
                    </div>
                </div>
            `;
            
            modal.style.display = "block";
            
            const closeBtn = document.getElementsByClassName("close")[0];
            closeBtn.onclick = () => modal.style.display = "none";
            
            window.onclick = (event) => {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            }
        });
        
        return card;
    }

    async function filterPokemonByType(type) {
        pokemonContainer.innerHTML = '';
        loading = true;
        
        try {
            const typeMap = {
                'Fire': 'fire',
                'Water': 'water',
                'Grass': 'grass',
                'Electric': 'electric',
                'Ice': 'ice',
                'Fighting': 'fighting',
                'Poison': 'poison',
                'Ground': 'ground',
                'Flying': 'flying',
                'Psychic': 'psychic',
                'Bug': 'bug',
                'Rock': 'rock',
                'Ghost': 'ghost',
                'Dragon': 'dragon',
                'Dark': 'dark',
                'Steel': 'steel',
                'Fairy': 'fairy'
            };
    
            const englishType = typeMap[type] || type.toLowerCase();
            const typeResponse = await fetch(`https://pokeapi.co/api/v2/type/${englishType}`);
            const typeData = await typeResponse.json();
            
            for (const pokemon of typeData.pokemon) {
                const id = pokemon.pokemon.url.split('/')[6];
                const pokemonData = await fetchPokemonData(id);
                if (pokemonData) {
                    const card = createPokemonCard(pokemonData);
                    pokemonContainer.appendChild(card);
                }
            }
        } catch (error) {
            console.error('Error filtering Pokemon:', error);
        } finally {
            loading = false;
        }
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', async () => {
            const type = item.textContent;
            
            if (currentFilter === type) {
                currentFilter = null;
                item.classList.remove('active');
                pokemonContainer.innerHTML = '';
                currentPokemonId = 1;
                loading = false;
                await loadMorePokemon();
            } else {
                sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentFilter = type;
                filterPokemonByType(type);
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const pokemonInput = document.getElementById('pokemonInput');
    
    pokemonInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            const pokemonName = card.querySelector('.pokemon-name').textContent.toLowerCase();
            const pokemonNumber = card.querySelector('.pokemon-number').textContent;
            
            if (pokemonName.includes(searchTerm) || pokemonNumber.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.pokemonSideBar');
    const content = document.querySelector('.content');
    const pokemonContainer = document.querySelector('.pokemon-container');

    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('hidden');
        content.classList.toggle('full-width');
        pokemonContainer.classList.toggle('full-width');
    });
});