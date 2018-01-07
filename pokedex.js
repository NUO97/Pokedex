/*
    Assignment #5 Pokedex
    Name: Nuo Chen
    Section: AF
    Date: 05/07/2017
    This javascript file implements the view for a pokedex and two pokemon 
    cards. Each Pokedex entry (referenced by the sprite image) will link directly 
    to a Pokemon card, which is a card of information for a single Pokemon 
    species, containing a larger image of the Pokemon, its type and weakness 
    information, its set of moves, health point data, and a short description.

*/

(function() {
    
    "use strict";
    
    var found = ["Bulbasaur", "Charmander", "Squirtle"];
    
    var currentPokemon = null;
    var gameID = null;
    var playerID = null;
    
    // Declared those url as global variable for easier access
    var pokedexService = "https://webster.cs.washington.edu/pokedex/pokedex.php";
    var gameService = "https://webster.cs.washington.edu/pokedex/game.php";
    var URL = "https://webster.cs.washington.edu/pokedex/";
    
    var $ = function(id) { return document.getElementById(id); };
    var qs = function(selector) { return document.querySelector(selector); };
    
    window.onload = function() {
        populatePokedex();
        $("start-btn").onclick = playGame;
        
        var allMoves = document.querySelectorAll("#my-card .moves button");
        
        for (var i = 0; i < allMoves.length; i++) {
            allMoves[i].onclick = playAMove;
        }
        $("flee-btn").onclick = playAMove;
        $("endgame").onclick = endGame;
        
    };
    
    // This function populates the initial pokedex
    function populatePokedex() {
        var getPokedex = new AjaxGetPromise(pokedexService + "?pokedex=all");
        getPokedex
            .then(renderPokemon); 
    }
    
    // This function takes in a parameter that contains all the pokemon names 
    // as well as the name of its image file separated by a colon. For example 
    // "Abra:abra.png". This function will populate the pokedex container with 
    // images of the pokemon sprites. Initially, there will be three found 
    // pokemons: Bulbasaur, Charmander and squirtle. The found pokemons can be
    // clicked and the pokemon card will show detailed information about the pokemon.
    // The unfound pokemons are displayed as shadows and cannot be clicked.
    function renderPokemon(response) {
        
        var pokemons = response.split("\n");
        for (var i = 0; i < pokemons.length; i++) {
            var pair = pokemons[i].split(":");
            var name = pair[0];
            var source = pair[1];
            
            var newPokemon = document.createElement("img");
            newPokemon.classList.add("sprite");
            
            if (!found.includes(name)) {
                newPokemon.classList.add("unfound");
            } else {
                newPokemon.onclick = pokemonDetail;
            }
            $("pokedex-view").appendChild(newPokemon);
            newPokemon.id = name;
            newPokemon.src = URL + "sprites/" + source;
            newPokemon.alt = name;
        }
        
        
    }
    
    // This function implements the detailed pokemon card so that when a found
    // pokemon inside the pokedex is clicked, the card will be populated with
    // detailed information about that pokemon. Once a pokemon is clicked, we are 
    // able to choose that pokemon to battle!
    function pokemonDetail() {
        var name = this.id;
        currentPokemon = name.toLowerCase(); 
        var getDetail = new AjaxGetPromise(pokedexService + "?pokemon=" + name.toLowerCase()); 
        
        getDetail
            .then(JSON.parse)
            .then(function(response) {
                pokemonCard("#my-card", response);
            });
            
        $("start-btn").classList.remove("hidden");
        
    }

    // This function changes the mode from pokedex view to battle view, it initiates
    // a pokemon battle and the player will get to play against a random pokemon!
    function playGame() {
        battleMode();
        var myPokemon = { 'startgame':'true', 'mypokemon':currentPokemon};
        var getGameData = new AjaxPostPromise(gameService, myPokemon);
        getGameData
            .then(JSON.parse)
            .then(startGame);
    }
    
    // This function takes in a parameter that is returned by a server call, 
    // and populates the opponent's (in this case an AI) pokemon card with 
    // detailed information about your opponent's pokemon. 
    function startGame(response) {
        gameID = response.guid;
        playerID = response.pid;
        pokemonCard("#their-card", response.p2);
    }
    
    // This function takes in two parameters that indicate which card to populate 
    // and what pokemon information to populate in the given card. The function 
    // will populate the given card with the given information. 
    function pokemonCard(card, response) {
        
        qs(card + " .name").innerHTML = response.name;
        qs(card + " .pokepic").src = URL + response.images.photo; 
        qs(card + " .type").src = URL + response.images.typeIcon;
        qs(card + " .weakness").src = URL + response.images.weaknessIcon;
        qs(card + " .hp").innerHTML = response.hp + "HP";
        qs(card + " .info").innerHTML = response.info.description;
        var moves = response.moves;
        var buttons = document.querySelectorAll(card + " .moves button");
        
        for (var i = 0; i < buttons.length; i++) {
            
            if(moves[i]) {
                buttons[i].classList.remove("hidden");
                buttons[i].children[0].innerHTML = moves[i].name;
                if (moves[i].dp) {
                    buttons[i].children[1].innerHTML = moves[i].dp + "DP";
                } else {
                    buttons[i].children[1].innerHTML = "";
                }
                buttons[i].children[2].src = URL + "icons/" + moves[i].type + ".jpg";
            } else {
                buttons[i].classList.add("hidden");
            }
        }     
    }
    
    // This function will update the game status once the player played a move,
    // A loading gif of a pikachu will show up between the move and the result.
    function playAMove() {
        
        $("loading").classList.remove("hidden");
        var moveName = "";
        if (this.innerHTML == "Flee the Battle!") {
            moveName = "flee";
        } else {
            moveName = this.children[0].innerHTML.replace(" ", "").toLowerCase();
        }
        var myMove = { 'guid':gameID, 'pid':playerID, 'movename':moveName};
        var moveResults = new AjaxPostPromise(gameService, myMove);
        moveResults
            .then(JSON.parse)
            .then(updateStatus);
    }
    
    // This function takes in a parameter that contains all the information returned
    // from a server call, this function will update the game status with information
    // of the results of the player/opponent's move. This function also updates 
    // pokemon's HP, and buff status. If either pokemon's HP becomes zero, the game
    // ends. 
    function updateStatus(response) {
        
        $("loading").classList.add("hidden");
        $("p1-turn-results").classList.remove("hidden");
        $("p2-turn-results").classList.remove("hidden");
    
        $("p1-turn-results").innerHTML = "Player 1 played " + response.results["p1-move"] + " and " + response.results["p1-result"] + "!";
        $("p2-turn-results").innerHTML = "Player 2 played " + response.results["p2-move"] + " and " + response.results["p2-result"] + "!";
        
        qs("#my-card .hp").innerHTML = response.p1["current-hp"] + "HP";
        qs("#their-card .hp").innerHTML = response.p2["current-hp"] + "HP";
        
        var p1PercentHP = response.p1["current-hp"] / response.p1.hp;
        var p2PercentHP = response.p2["current-hp"] / response.p2.hp;
        
        qs("#my-card .health-bar").style.width = p1PercentHP * 100 + "%";
        qs("#their-card .health-bar").style.width = p2PercentHP * 100 + "%";
        
        checkHealth("#my-card", p1PercentHP);
        checkHealth("#their-card", p2PercentHP);
        
        var p1Buffs = response.p1.buffs;
        var p1Debuffs = response.p1.debuffs;
        var p2Buffs = response.p2.buffs;
        var p2Debuffs = response.p2.debuffs;
        
        // Clear the buff div each time before displaying buffs
        qs("#my-card .buffs").innerHTML = "";
        qs("#their-card .buffs").innerHTML = "";
        
        displayBuff("#my-card", "buff", p1Buffs);
        displayBuff("#my-card", "debuff", p1Debuffs);
        displayBuff("#their-card", "buff", p2Buffs);
        displayBuff("#their-card", "debuff", p2Debuffs);
        
        // Display winning or losing
        if (response.p1["current-hp"] == 0) {
            gameLost();
            if (response.results["p1-move"] == "flee") {
                $("p2-turn-results").innerHTML = "";
            }
        } else if (response.p2["current-hp"] == 0) {
            gameWon();
        }
    }
    
    // This function will show the critical health status (make the health bar turn red
    // when the HP percentage is less than or equal to 20%). If the HP percent is over
    // 20%, the health bar will remain green. 
    function checkHealth(card, percent) {
        if (percent * 100 <= 20) {
            qs(card + " .health-bar").classList.add("low-health");
        } else {
            qs(card + " .health-bar").classList.remove("low-health");
        }
    }
    
    // This function takes in three parameters, the player, type of buffs and a
    // list of all buffs on a pokemon. The function will display the buffs of a pokemon
    // after each player's move. 
    function displayBuff(player, type, list) {
        
        for (var i = 0; i < list.length; i++) {
            var newBuff = document.createElement("div");
            newBuff.classList.add(list[i]);
            newBuff.classList.add(type);
            qs(player + " .buffs").appendChild(newBuff);
        }
    }
    
    // This function is called if the player lost the game
    function gameLost() {
        $("title").innerHTML = "You Lost!";
        $("endgame").classList.remove("hidden");
        
    }
    
    // This function is called if the player wins the game, if the player wins
    // a battle against an unfound pokemon, that pokemon will also be added to
    // the found list.
    function gameWon() {
        $("title").innerHTML = "You Won!";
        $("endgame").classList.remove("hidden");   
        $("p2-turn-results").innerHTML = "";
        
        var opponentPokemon = qs("#their-card .name").innerHTML;
        
        if (!found.includes(opponentPokemon)) {
            found.push(opponentPokemon);
            
            $(opponentPokemon).classList.remove("unfound");
            $(opponentPokemon).onclick = pokemonDetail;
            
        }
        
    }
    
    // This function is executed when the game ends, it reverts the page back
    // to the original status.
    function endGame() {
        pokedexMode();
        qs("#my-card .health-bar").style.width = "100%";
        qs("#their-card .health-bar").style.width = "100%";
        
        qs("#my-card .health-bar").classList.remove("low-health");
        qs("#their-card .health-bar").classList.remove("low-health");
        
        $("p1-turn-results").innerHTML = "";
        $("p2-turn-results").innerHTML = "";
        qs("#my-card .buffs").innerHTML = "";
        qs("#their-card .buffs").innerHTML = "";
    }
    
    // This function changes the view from battle mode to pokedex mode
    function pokedexMode() {
    
        $("title").innerHTML = "Your Pokedex";
        $("pokedex-view").classList.remove("hidden");
        $("their-card").classList.add("hidden");
        $("results-container").classList.add("hidden");
    
        qs(".hp-info").classList.add("hidden");
        qs("#my-card .buffs").classList.add("hidden");
        
        $("start-btn").classList.remove("hidden");
        $("flee-btn").classList.add("hidden");
        $("endgame").classList.add("hidden");
        
    }
    
    // This function changes the view from pokedex mode to battle mode
    function battleMode() {
        $("title").innerHTML = "Pokemon Battle Mode!";
        
        $("pokedex-view").classList.add("hidden");
        $("their-card").classList.remove("hidden");
        $("results-container").classList.remove("hidden");
    
        qs(".hp-info").classList.remove("hidden");
        qs("#my-card .buffs").classList.remove("hidden");
        qs("#their-card .buffs").classList.remove("hidden");
        
        $("start-btn").classList.add("hidden");
        $("flee-btn").classList.remove("hidden");

    }
    
})(); //End Module