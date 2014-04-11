// load the things we need
var mongoose = require('mongoose');
var moniker = require('moniker');
var Q = require('q');
var Tile = require('../models/tile');

// Tile features are defined in terms of the cardinal directions they use
// Roads and cities potentially connect cardinal directions (N S E W)
// Fields potentially connect secondary-intercardinal directions (NNW NNE ENE ESE SSE SSW WSW WNW)

// NW NNW N NNE NE
// WNW         ENE
// W      *      E
// WSW         ESE
// SW SSW S SSE SE

// define the schema for our game model
var gamestateSchema = mongoose.Schema({
    name: String,
    players: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        points: Number,
        remainingMeeples: Number,
        active: Boolean
    }],
    unusedTiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tile' }],
    activeTile: {
        tile: { type: mongoose.Schema.Types.ObjectId, ref: 'Tile' },
        validPlacements: [{
			x: Number,
			y: Number,
			rotations: [Number]
		}],
		discardedTiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tile' }]
    },
    placedTiles: [{
        tile: { type: mongoose.Schema.Types.ObjectId, ref: 'Tile' },
        rotation: Number, // number of times tile is rotated clockwise
        meeples: [{
            player: mongoose.Schema.Types.ObjectId, // references players
            placement: {
                locationType: String, // 'road', 'city', 'farm', or 'cloister'
                index: Number // which element of tiles[].roads/cities/farms (external schema)
            }
        }],
        northTile: mongoose.Schema.Types.ObjectId, // references placedTiles
        southTile: mongoose.Schema.Types.ObjectId,
        westTile: mongoose.Schema.Types.ObjectId,
        eastTile: mongoose.Schema.Types.ObjectId,
        x: Number,
        y: Number
    }]
});

gamestateSchema.methods.userIsInGame = function(user) {
	var gamestate = this;
	var userID = user;
	if(typeof user !== 'string') {
		userID = user._id.toHexString();
	}
	var inGame = false;
	for(var i = 0; i < gamestate.players.length; i++) {
		var id = gamestate.players[i].user._id || gamestate.players[i].user;
		inGame = inGame || id.equals(userID);
	}
	return inGame;
};

gamestateSchema.methods.userIsActive = function(user) {
	var gamestate = this;
	var userID = user;
	if(typeof user !== 'string') {
		userID = user._id.toHexString();
	}
	var active = false;
	for(var i = 0; i < gamestate.players.length; i++) {
		var id = gamestate.players[i].user._id || gamestate.players[i].user;
		active = active || (id.equals(userID) && gamestate.players[i].active);
	}
	return active;
};

gamestateSchema.methods.drawTile = function(callback) {
	this.populate('unusedTiles placedTiles.tile', function(err, gamestate) {
		// move one random tile from unused to active
		var potentialPlacements = [], discardedTiles = [];
		var currentTile, activeTile;
		while(potentialPlacements.length === 0 && gamestate.unusedTiles.length > 0) {
			activeTile = gamestate.unusedTiles.splice(Math.floor(Math.random()*gamestate.unusedTiles.length), 1)[0];
			// find out all the places we can place it
			for(var i = 0; i < gamestate.placedTiles.length; i++) {
				currentTile = gamestate.placedTiles[i];
				// check north edge
				if(!currentTile.northTile) {
					if(currentTile.tile.northEdge === activeTile.northEdge) {
						potentialPlacements.push({ x: currentTile.x, y: currentTile.y - 1, sourceTile: currentTile, rotation: 2 });
					}
					if(currentTile.tile.northEdge === activeTile.eastEdge) {
						potentialPlacements.push({ x: currentTile.x, y: currentTile.y - 1, sourceTile: currentTile, rotation: 1 });
					}
					if(currentTile.tile.northEdge === activeTile.southEdge) {
						potentialPlacements.push({ x: currentTile.x, y: currentTile.y - 1, sourceTile: currentTile, rotation: 0 });
					}
					if(currentTile.tile.northEdge === activeTile.westEdge) {
						potentialPlacements.push({ x: currentTile.x, y: currentTile.y - 1, sourceTile: currentTile, rotation: 3 });
					}
				}
				if(!currentTile.eastTile) {
					if(currentTile.tile.eastEdge === activeTile.northEdge) {
						potentialPlacements.push({ x: currentTile.x + 1, y: currentTile.y, sourceTile: currentTile, rotation: 3 });
					}
					if(currentTile.tile.eastEdge === activeTile.eastEdge) {
						potentialPlacements.push({ x: currentTile.x + 1, y: currentTile.y, sourceTile: currentTile, rotation: 2 });
					}
					if(currentTile.tile.eastEdge === activeTile.southEdge) {
						potentialPlacements.push({ x: currentTile.x + 1, y: currentTile.y, sourceTile: currentTile, rotation: 1 });
					}
					if(currentTile.tile.eastEdge === activeTile.westEdge) {
						potentialPlacements.push({ x: currentTile.x + 1, y: currentTile.y, sourceTile: currentTile, rotation: 0 });
					}
				}
				if(!currentTile.southTile) {
					if(currentTile.tile.southEdge === activeTile.northEdge) {
						potentialPlacements.push({ x: currentTile.x, y: currentTile.y + 1, sourceTile: currentTile, rotation: 0 });
					}
					if(currentTile.tile.southEdge === activeTile.eastEdge) {
						potentialPlacements.push({ x: currentTile.x, y: currentTile.y + 1, sourceTile: currentTile, rotation: 3 });
					}
					if(currentTile.tile.southEdge === activeTile.southEdge) {
						potentialPlacements.push({ x: currentTile.x, y: currentTile.y + 1, sourceTile: currentTile, rotation: 2 });
					}
					if(currentTile.tile.southEdge === activeTile.westEdge) {
						potentialPlacements.push({ x: currentTile.x, y: currentTile.y + 1, sourceTile: currentTile, rotation: 1 });
					}
				}
				if(!currentTile.westTile) {
					if(currentTile.tile.westEdge === activeTile.northEdge) {
						potentialPlacements.push({ x: currentTile.x - 1, y: currentTile.y, sourceTile: currentTile, rotation: 1 });
					}
					if(currentTile.tile.westEdge === activeTile.eastEdge) {
						potentialPlacements.push({ x: currentTile.x - 1, y: currentTile.y, sourceTile: currentTile, rotation: 0 });
					}
					if(currentTile.tile.westEdge === activeTile.southEdge) {
						potentialPlacements.push({ x: currentTile.x - 1, y: currentTile.y, sourceTile: currentTile, rotation: 3 });
					}
					if(currentTile.tile.westEdge === activeTile.westEdge) {
						potentialPlacements.push({ x: currentTile.x - 1, y: currentTile.y, sourceTile: currentTile, rotation: 2 });
					}
				}
			}
			// remove placements which conflict with already placed tiles
			for(i = 0; i < gamestate.placedTiles.length; i++) {
				currentTile = gamestate.placedTiles[i];
				potentialPlacements = potentialPlacements.filter(function(placement) {
					var valid = true;
					if(currentTile !== placement.sourceTile) {
						if(currentTile.x === placement.x) {
							if(currentTile.y === placement.y - 1) {
								if(placement.rotation === 0) {
									valid = currentTile.southEdge === activeTile.northEdge;
								} else if(placement.rotation === 1) {
									valid = currentTile.southEdge === activeTile.westEdge;
								} else if(placement.rotation === 2) {
									valid = currentTile.southEdge === activeTile.southEdge;
								} else if(placement.rotation === 3) {
									valid = currentTile.southEdge === activeTile.eastEdge;
								}
							} else if(currentTile.y === placement.y + 1) {
								if(placement.rotation === 0) {
									valid = currentTile.northEdge === activeTile.southEdge;
								} else if(placement.rotation === 1) {
									valid = currentTile.northEdge === activeTile.eastEdge;
								} else if(placement.rotation === 2) {
									valid = currentTile.northEdge === activeTile.northEdge;
								} else if(placement.rotation === 3) {
									valid = currentTile.northEdge === activeTile.westEdge;
								}
							}
						}
						if(currentTile.y === placement.y) {
							if(currentTile.x === placement.x - 1) {
								if(placement.rotation === 0) {
									valid = currentTile.eastEdge === activeTile.westEdge;
								} else if(placement.rotation === 1) {
									valid = currentTile.eastEdge === activeTile.southEdge;
								} else if(placement.rotation === 2) {
									valid = currentTile.eastEdge === activeTile.eastEdge;
								} else if(placement.rotation === 3) {
									valid = currentTile.eastEdge === activeTile.northEdge;
								}
							} else if(currentTile.x === placement.x + 1) {
								if(placement.rotation === 0) {
									valid = currentTile.westEdge === activeTile.eastEdge;
								} else if(placement.rotation === 1) {
									valid = currentTile.westEdge === activeTile.northEdge;
								} else if(placement.rotation === 2) {
									valid = currentTile.westEdge === activeTile.westEdge;
								} else if(placement.rotation === 3) {
									valid = currentTile.westEdge === activeTile.southEdge;
								}
							}
						}
					}
					return valid;
				});
			}
			if(potentialPlacements.length === 0) {
				discardedTiles.push(activeTile);
			}
		}
		gamestate.activeTile.tile = activeTile;
		gamestate.activeTile.discarded = discardedTiles;
		// remove duplicates while storing an array of potential rotations for each position
		var groupedPlacements = {};
		potentialPlacements.forEach(function(item) {
			var key = item.x + ',' + item.y;
			if(groupedPlacements[key]) {
				if(groupedPlacements[key].rotations.indexOf(item.rotation) === -1) {
					groupedPlacements[key].rotations.push(item.rotation);
				}
			} else {
				groupedPlacements[key] = item;
				groupedPlacements[key].rotations = [item.rotation];
			}
		});
		// place each grouped item into the valid placements for the active tile
		gamestate.activeTile.validPlacements = [];
		for (var key in groupedPlacements) {
			gamestate.activeTile.validPlacements.push(groupedPlacements[key]);
		}
		gamestate.save(function(err, gamestate) {
			if(callback && typeof(callback) === 'function') {
				callback(err, gamestate);
			}
		});
	});
};

gamestateSchema.methods.initializeNewGame = function(initialUser, callback) {
	var newGame = this;
    newGame.players = [{ user: initialUser._id }]; // with the current user as the only player
    newGame.name = moniker.choose();
    initialUser.activeGames.unshift(newGame._id); // add the game to the users active games
    // grab the starting tile and make it the only placed tile
    var startTilePlaced = Tile.findOne({ startingTile: true, expansion: 'base-game' }).exec(function(err, startTile) {
		newGame.placedTiles.unshift({
			tile: startTile._id,
			rotation: 0,
			x: 0,
			y: 0
        });
    });
    // grab the rest of the tiles and put them in the unplaced list
    var unusedTilesLoaded = Tile.find({ expansion: 'base-game' }).exec(function(err, allTiles) {
		// load all the unused tiles as per their counts, minus one if we placed it as a starting tile
		for(var i = 0; i < allTiles.length; i++) {
			for(var j = 0; j < (allTiles[i].startingTile ? allTiles[i].count - 1 : allTiles[i].count); j++) {
				newGame.unusedTiles.push(allTiles[i]._id);
			}
		}
	});
    Q.all([startTilePlaced, unusedTilesLoaded]).then(function() {
        newGame.save(function(err) {
            if(err) {
				console.log('new game save err: ' + err);
			}
            initialUser.save(function(err) {
                if(err) {
					console.log('user save err: ' + err);
				}
				if(callback && typeof(callback) === 'function') {
					callback(err, newGame);
				}
            });
        });
    });
};

gamestateSchema.methods.startGame = function(callback) {
	var gamestate = this;
	//TODO: check if game has been started already
	// pick a random player to start
	var chosenPlayer = Math.floor(Math.random()*gamestate.players.length);
	for(var i = 0; i < gamestate.players.length; i++) {
		gamestate.players[i].points = 0;
		gamestate.players[i].remainingMeeples = 7;
		gamestate.players[i].active = (i === chosenPlayer);
	}
	gamestate.save(function (err, gamestate) {
		if(err) {
			console.log('start game save err: ' + err);
		}
		gamestate.drawTile(callback);
	});
};

// create the model for game information and expose it to our app
module.exports = mongoose.model('Gamestate', gamestateSchema);