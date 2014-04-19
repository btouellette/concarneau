/* jslint smarttabs:true */
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
        active: Boolean,
        color: String
    }],
    unusedTiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tile' }],
    activeTile: {
        tile: { type: mongoose.Schema.Types.ObjectId, ref: 'Tile' },
        validPlacements: [{
			x: Number,
			y: Number,
			rotations: [{
				rotation: Number,
				meeples: [{ 
					locationType: String, // 'road', 'city', 'farm', or 'cloister'
					index: Number // which element of tiles[].roads/cities/farms (external schema)
				}]
			}]
		}],
		discardedTiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tile' }]
    },
    placedTiles: [{
        tile: { type: mongoose.Schema.Types.ObjectId, ref: 'Tile' },
        rotation: Number, // number of times tile is rotated clockwise
        meeples: [{
            playerIndex: Number, // references players
            placement: {
                locationType: String, // 'road', 'city', 'farm', or 'cloister'
                index: Number // which element of tiles[].roads/cities/farms (external schema)
            }
        }],
        northTileIndex: Number, // references placedTiles
        southTileIndex: Number,
        westTileIndex: Number,
        eastTileIndex: Number,
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
	// console.log('drawing new tile');
	this.populate('unusedTiles placedTiles.tile', function(err, gamestate) {
		//TODO: if we're out of tiles detect and score/complete game
		// move one random tile from unused to active
		var potentialPlacements = [], discardedTiles = [];
		var currentTile, rotatedTile, activeTile;
		var rotatedPlacements;
		var rotatedTiles = gamestate.placedTiles.map(function(mappedTile) {
			return mappedTile.rotation === 0 ? 
				{
					northEdge: mappedTile.tile.northEdge,
					eastEdge: mappedTile.tile.eastEdge,
					southEdge: mappedTile.tile.southEdge,
					westEdge: mappedTile.tile.westEdge
				} 
				: mappedTile.rotation === 1 ?
				{
					northEdge: mappedTile.tile.westEdge,
					eastEdge: mappedTile.tile.northEdge,
					southEdge: mappedTile.tile.eastEdge,
					westEdge: mappedTile.tile.southEdge
				} 
				: mappedTile.rotation === 2 ?
				{
					northEdge: mappedTile.tile.southEdge,
					eastEdge: mappedTile.tile.westEdge,
					southEdge: mappedTile.tile.northEdge,
					westEdge: mappedTile.tile.eastEdge
				} 
				:
				{
					northEdge: mappedTile.tile.eastEdge,
					eastEdge: mappedTile.tile.southEdge,
					southEdge: mappedTile.tile.westEdge,
					westEdge: mappedTile.tile.northEdge
				};
		});
		while(potentialPlacements.length === 0 && gamestate.unusedTiles.length > 0) {
			activeTile = gamestate.unusedTiles.splice(Math.floor(Math.random()*gamestate.unusedTiles.length), 1)[0];
			// find out all the places we can place it
			for(var i = 0; i < gamestate.placedTiles.length; i++) {
				currentTile = gamestate.placedTiles[i];
				rotatedTile = rotatedTiles[i];
				if(currentTile.northTileIndex === undefined) {
					if(rotatedTile.northEdge === activeTile.northEdge) {
						potentialPlacements.push({ 
							x: currentTile.x, 
							y: currentTile.y - 1, 
							rotation: 2, 
							sourceIndex: i, 
							directionToSource: 'S', 
							directionFromSource: 'N' 
						});
					}
					if(rotatedTile.northEdge === activeTile.eastEdge) {
						potentialPlacements.push({ 
							x: currentTile.x, 
							y: currentTile.y - 1, 
							rotation: 1, 
							sourceIndex: i, 
							directionToSource: 'S', 
							directionFromSource: 'N' 
						});
					}
					if(rotatedTile.northEdge === activeTile.southEdge) {
						potentialPlacements.push({ 
							x: currentTile.x, 
							y: currentTile.y - 1, 
							rotation: 0, 
							sourceIndex: i, 
							directionToSource: 'S', 
							directionFromSource: 'N' 
						});
					}
					if(rotatedTile.northEdge === activeTile.westEdge) {
						potentialPlacements.push({ 
							x: currentTile.x, 
							y: currentTile.y - 1, 
							rotation: 3, 
							sourceIndex: i, 
							directionToSource: 'S', 
							directionFromSource: 'N' 
						});
					}
				}
				if(currentTile.eastTileIndex === undefined) {
					if(rotatedTile.eastEdge === activeTile.northEdge) {
						potentialPlacements.push({ 
							x: currentTile.x + 1, 
							y: currentTile.y, 
							rotation: 3, 
							sourceIndex: i, 
							directionToSource: 'W', 
							directionFromSource: 'E' 
						});
					}
					if(rotatedTile.eastEdge === activeTile.eastEdge) {
						potentialPlacements.push({ 
							x: currentTile.x + 1, 
							y: currentTile.y, 
							rotation: 2, 
							sourceIndex: i, 
							directionToSource: 'W', 
							directionFromSource: 'E' 
						});
					}
					if(rotatedTile.eastEdge === activeTile.southEdge) {
						potentialPlacements.push({ 
							x: currentTile.x + 1, 
							y: currentTile.y, 
							rotation: 1, 
							sourceIndex: i, 
							directionToSource: 'W', 
							directionFromSource: 'E' 
						});
					}
					if(rotatedTile.eastEdge === activeTile.westEdge) {
						potentialPlacements.push({ 
							x: currentTile.x + 1, 
							y: currentTile.y, 
							rotation: 0, 
							sourceIndex: i, 
							directionToSource: 'W', 
							directionFromSource: 'E' 
						});
					}
				}
				if(currentTile.southTileIndex === undefined) {
					if(rotatedTile.southEdge === activeTile.northEdge) {
						potentialPlacements.push({ 
							x: currentTile.x, 
							y: currentTile.y + 1, 
							rotation: 0, 
							sourceIndex: i, 
							directionToSource: 'N', 
							directionFromSource: 'S' 
						});
					}
					if(rotatedTile.southEdge === activeTile.eastEdge) {
						potentialPlacements.push({ 
							x: currentTile.x, 
							y: currentTile.y + 1, 
							rotation: 3, 
							sourceIndex: i, 
							directionToSource: 'N', 
							directionFromSource: 'S' 
						});
					}
					if(rotatedTile.southEdge === activeTile.southEdge) {
						potentialPlacements.push({ 
							x: currentTile.x, 
							y: currentTile.y + 1, 
							rotation: 2, 
							sourceIndex: i, 
							directionToSource: 'N', 
							directionFromSource: 'S' 
						});
					}
					if(rotatedTile.southEdge === activeTile.westEdge) {
						potentialPlacements.push({ 
							x: currentTile.x, 
							y: currentTile.y + 1, 
							rotation: 1, 
							sourceIndex: i, 
							directionToSource: 'N', 
							directionFromSource: 'S' 
						});
					}
				}
				if(currentTile.westTileIndex === undefined) {
					if(rotatedTile.westEdge === activeTile.northEdge) {
						potentialPlacements.push({ 
							x: currentTile.x - 1, 
							y: currentTile.y, 
							rotation: 1, 
							sourceIndex: i, 
							directionToSource: 'E', 
							directionFromSource: 'W' 
						});
					}
					if(rotatedTile.westEdge === activeTile.eastEdge) {
						potentialPlacements.push({ 
							x: currentTile.x - 1, 
							y: currentTile.y, 
							rotation: 0, 
							sourceIndex: i, 
							directionToSource: 'E', 
							directionFromSource: 'W' 
						});
					}
					if(rotatedTile.westEdge === activeTile.southEdge) {
						potentialPlacements.push({ 
							x: currentTile.x - 1, 
							y: currentTile.y, 
							rotation: 3, 
							sourceIndex: i, 
							directionToSource: 'E', 
							directionFromSource: 'W' 
						});
					}
					if(rotatedTile.westEdge === activeTile.westEdge) {
						potentialPlacements.push({ 
							x: currentTile.x - 1, 
							y: currentTile.y, 
							rotation: 2, 
							sourceIndex: i, 
							directionToSource: 'E', 
							directionFromSource: 'W' 
						});
					}
				}
			}
			rotatedPlacements = potentialPlacements.map(function(currentPlacement) {
				return currentPlacement.rotation === 0 ? 
					{
						northEdge: activeTile.northEdge,
						eastEdge: activeTile.eastEdge,
						southEdge: activeTile.southEdge,
						westEdge: activeTile.westEdge
					} 
					: currentPlacement.rotation === 1 ?
					{
						northEdge: activeTile.westEdge,
						eastEdge: activeTile.northEdge,
						southEdge: activeTile.eastEdge,
						westEdge: activeTile.southEdge
					} 
					: currentPlacement.rotation === 2 ?
					{
						northEdge: activeTile.southEdge,
						eastEdge: activeTile.westEdge,
						southEdge: activeTile.northEdge,
						westEdge: activeTile.eastEdge
					} 
					:
					{
						northEdge: activeTile.eastEdge,
						eastEdge: activeTile.southEdge,
						southEdge: activeTile.westEdge,
						westEdge: activeTile.northEdge
					};
			});
			var invalidPlacementIndices = [];
			// remove placements which conflict with already placed tiles
			for(var k = 0; k < gamestate.placedTiles.length; k++) {
				currentTile = gamestate.placedTiles[k];
				rotatedTile = rotatedTiles[k];
				for(var j = 0; j < potentialPlacements.length; j++) {
					var placement = potentialPlacements[j];
					var rotatedPlacement = rotatedPlacements[j];
					if((currentTile.x === placement.x && currentTile.y - 1 === placement.y && rotatedTile.northEdge !== rotatedPlacement.southEdge) ||
					   (currentTile.x === placement.x && currentTile.y + 1 === placement.y && rotatedTile.southEdge !== rotatedPlacement.northEdge) ||
					   (currentTile.y === placement.y && currentTile.x - 1 === placement.x && rotatedTile.westEdge !== rotatedPlacement.eastEdge) ||
					   (currentTile.y === placement.y && currentTile.x + 1 === placement.x && rotatedTile.eastEdge !== rotatedPlacement.westEdge)) {
						invalidPlacementIndices.push(j);
					}
				}
			}
			potentialPlacements = potentialPlacements.filter(function(placement, index) {
				return invalidPlacementIndices.indexOf(index) === -1;
			});
			rotatedPlacements = rotatedPlacements.filter(function(placement, index) {
				return invalidPlacementIndices.indexOf(index) === -1;
			});
			if(potentialPlacements.length === 0) {
				console.log('=======discarded tile=====');
				discardedTiles.push(activeTile);
			}
		}
		// calculate valid meeple placements for each valid tile placement
		for(var index = 0; index < potentialPlacements.length; index++) {
			var currentPlacement = potentialPlacements[index];
			var adjacentTile = gamestate.placedTiles[currentPlacement.sourceIndex];
			// console.log('calculating meeple placements: ' + currentPlacement.x + ',' + currentPlacement.y);
			currentPlacement.meeples = [];
			// meeple placement is valid if for all directions in a (rotated) feature
			// direction isn't pointed to the adjacent tile OR adjacent tile feature isn't owned
			var directions = ['N','E','S','W'];
			// check cities
			var valid;
			for(var index2 = 0; index2 < activeTile.cities.length; index2++) {
				valid = true;
				var rotatedCityDirections = activeTile.cities[index2].directions.map(function(direction) {
					return directions[(directions.indexOf(direction) + currentPlacement.rotation) % 4];
				});
				if(rotatedCityDirections.indexOf(currentPlacement.directionToSource) !== -1) {
					valid = !isFeatureOwned(adjacentTile, 'city', getFeatureIndex(adjacentTile, 'city', currentPlacement.directionFromSource), gamestate);
				}
				if(valid) {
					// add to placement
					currentPlacement.meeples.push({
						locationType: 'city',
						index: index2
					});
				}
			}
			// check roads
			for(var index3 = 0; index3 < activeTile.roads.length; index3++) {
				valid = true;
				var rotatedRoadDirections = activeTile.roads[index3].directions.map(function(direction) {
					return directions[(directions.indexOf(direction) + currentPlacement.rotation) % 4];
				});
				if(rotatedRoadDirections.indexOf(currentPlacement.directionToSource) !== -1) {
					valid = !isFeatureOwned(adjacentTile, 'road', getFeatureIndex(adjacentTile, 'road', currentPlacement.directionFromSource), gamestate);
				}
				if(valid) {
					// add to placement
					currentPlacement.meeples.push({
						locationType: 'road',
						index: index3
					});
				}
			}
			// check farms
			var farmDirections = ['NNE','ENE','ESE','SSE','SSW','WSW','WNW','NNW'];
			for(var index4 = 0; index4 < activeTile.farms.length; index4++) {
				// console.log('checking farm: ' + index4 + ' ' + JSON.stringify(activeTile.farms[index4]));
				valid = true;
				var rotatedFarmDirections = activeTile.farms[index4].directions.map(function(direction) {
					return farmDirections[(farmDirections.indexOf(direction) + currentPlacement.rotation * 2) % 8];
				});
				if(currentPlacement.directionToSource === 'N') {
					// console.log('looking ' + currentPlacement.directionToSource);
					if(rotatedFarmDirections.indexOf('NNW') !== -1) {
						valid = valid && !isFeatureOwned(adjacentTile, 'farm', getFeatureIndex(adjacentTile, 'farm', 'SSW'), gamestate);
						// console.log('NNW ' + valid);
					}
					if(rotatedFarmDirections.indexOf('NNE') !== -1) {
						valid = valid && !isFeatureOwned(adjacentTile, 'farm', getFeatureIndex(adjacentTile, 'farm', 'SSE'), gamestate);
						// console.log('NNE ' + valid);
					}
				} else if(currentPlacement.directionToSource === 'E') {
					// console.log('looking ' + currentPlacement.directionToSource);
					if(rotatedFarmDirections.indexOf('ENE') !== -1) {
						valid = valid && !isFeatureOwned(adjacentTile, 'farm', getFeatureIndex(adjacentTile, 'farm', 'WNW'), gamestate);
						// console.log('ENE ' + valid);
					}
					if(rotatedFarmDirections.indexOf('ESE') !== -1) {
						valid = valid && !isFeatureOwned(adjacentTile, 'farm', getFeatureIndex(adjacentTile, 'farm', 'WSW'), gamestate);
						// console.log('ESE ' + valid);
					}
				} else if(currentPlacement.directionToSource === 'S') {
					// console.log('looking ' + currentPlacement.directionToSource);
					if(rotatedFarmDirections.indexOf('SSW') !== -1) {
						valid = valid && !isFeatureOwned(adjacentTile, 'farm', getFeatureIndex(adjacentTile, 'farm', 'NNW'), gamestate);
						// console.log('SSW ' + valid);
					}
					if(rotatedFarmDirections.indexOf('SSE') !== -1) {
						valid = valid && !isFeatureOwned(adjacentTile, 'farm', getFeatureIndex(adjacentTile, 'farm', 'NNE'), gamestate);
						// console.log('SSE ' + valid);
					}
				} else if(currentPlacement.directionToSource === 'W') {
					// console.log('looking ' + currentPlacement.directionToSource);
					if(rotatedFarmDirections.indexOf('WNW') !== -1) {
						valid = valid && !isFeatureOwned(adjacentTile, 'farm', getFeatureIndex(adjacentTile, 'farm', 'ENE'), gamestate);
						// console.log('WNW ' + valid);
					}
					if(rotatedFarmDirections.indexOf('WSW') !== -1) {
						valid = valid && !isFeatureOwned(adjacentTile, 'farm', getFeatureIndex(adjacentTile, 'farm', 'ESE'), gamestate);
						// console.log('WSW ' + valid);
					}
				}
				if(valid) {
					// add to placement
					currentPlacement.meeples.push({
						locationType: 'farm',
						index: index4
					});
				}
			}
			// if there is a cloister on the active tile it will always be valid for any rotation
			if(activeTile.cloister) {
				currentPlacement.meeples.push({
					locationType: 'cloister',
					index: 1
				});
			}
		}
		gamestate.activeTile.tile = activeTile;
		gamestate.activeTile.discarded = discardedTiles;
		// console.log('ungrouped placements =>' + JSON.stringify(potentialPlacements));
		// console.log('==========================');
		// remove duplicates while storing an array of potential rotations and meeple placements for each position
		var groupedPlacements = {};
		potentialPlacements.forEach(function(item) {
			var key = item.x + ',' + item.y;
			if(groupedPlacements[key]) {
				var matched = false;
				for(var i = 0; i < groupedPlacements[key].rotations.length; i++) {
					var currentRotation = groupedPlacements[key].rotations[i];
					// if this rotation has already been placed 
					if(currentRotation.rotation === item.rotation) {
						matched = true;
						// only keep meeple placements that are valid in both tile placements
						currentRotation.meeples = currentRotation.meeples.filter(function(meeple) {
							for(var k = 0; k < item.meeples.length; k++) {
								if(item.meeples[k].locationType === meeple.locationType &&
								   item.meeples[k].index === meeple.index) {
									return true;
								}
							}
							return false;
						});
						break;
					}
				}
				// if it hasn't been placed add it
				if(!matched) {
					groupedPlacements[key].rotations.push({
						rotation: item.rotation,
						meeples: item.meeples
					});
				}
			} else {
				groupedPlacements[key] = {
					x: item.x,
					y: item.y,
					rotations: [{
						rotation: item.rotation,
						meeples: item.meeples
					}]
				};
			}
		});
		// place each grouped item into the valid placements for the active tile
		gamestate.activeTile.validPlacements = [];
		for (var key in groupedPlacements) {
			gamestate.activeTile.validPlacements.push(groupedPlacements[key]);
		}
		gamestate.save(function(err, gamestate) {
            if(err) {
				console.log('draw tile save err: ' + err);
			}
			gamestate.populate('activeTile.tile', callback);
		});
	});
};

function isFeatureOwned(placedTile, featureType, featureIndex, gamestate) {
	// console.log('====');
	if(featureType === 'cloister') {
		var owned = false;
		for(var i = 0; i < placedTile.meeples.length; i++) {
			if(placedTile.meeples[i].placement.locationType === 'cloister') {
				owned = true;
			}
		}
		return owned;
	} else if(featureType === 'road' || featureType === 'city' || featureType === 'farm') {
		return (function checkForMeeples(currentTile, featureType, featureIndex, checkedTiles) {
			// console.log('checking-> t:' + JSON.stringify(currentTile));
			// console.log('checking-> f:' + featureType + ':' + featureIndex);
			if(!checkedTiles) {
				checkedTiles = {};
			}
			if(checkedTiles[currentTile] &&
			   checkedTiles[currentTile].indexOf(featureType + ':' + featureIndex) !== -1) {
				return false;
			}
			if(!checkedTiles[currentTile]) {
				checkedTiles[currentTile] = [];
			}
			checkedTiles[currentTile].push(featureType + ':' + featureIndex);
			// console.log('checking this tile');
			// first check on the current tile
			for(var i = 0; i < currentTile.meeples.length; i++) {
				if(currentTile.meeples[i].placement.locationType === featureType && 
				   currentTile.meeples[i].placement.index === featureIndex) {
					return true;
				}
			}
			// console.log('checking neighbors');
			// then check the adjacent tiles
			var connectedTile;
			var pluralType = featureType === 'city' ? 'cities' : featureType + 's';
			var rotation = currentTile.rotation;
			var directions = featureType === 'farm' ?  ['NNE','ENE','ESE','SSE','SSW','WSW','WNW','NNW'] : ['N','E','S','W'];
			var rotatedDirections = currentTile.tile[pluralType][featureIndex].directions.map(function(direction) {
				return directions[(directions.indexOf(direction) + rotation * (featureType === 'farm' ? 2 : 1)) % directions.length];
			});
			var flippedDirection, indices, directionIndex;
			if(currentTile.northTileIndex !== undefined) {
				// console.log('checking N');
				indices = [rotatedDirections.indexOf('N'), rotatedDirections.indexOf('NNW'), rotatedDirections.indexOf('NNE')];
				// check the feature for north edges
				for(var i1 = 0; i1 < 3; i1++) {
					directionIndex = indices[i1];
					if(directionIndex !== -1) {
						// for any that were found check their connecting features
						connectedTile = gamestate.placedTiles[currentTile.northTileIndex];
						flippedDirection = rotatedDirections[directionIndex].replace(/N/g,'S');
						if(checkForMeeples(connectedTile, featureType, getFeatureIndex(connectedTile, featureType, flippedDirection), checkedTiles)) {
							return true;
						}
					}
				}
			}
			if(currentTile.eastTileIndex !== undefined) {
				// console.log('checking E');
				indices = [rotatedDirections.indexOf('E'), rotatedDirections.indexOf('ENE'), rotatedDirections.indexOf('ESE')];
				// check the feature for east edges
				for(var i2 = 0; i2 < 3; i2++) {
					directionIndex = indices[i2];
					if(directionIndex !== -1) {
						// for any that were found check their connecting features
						connectedTile = gamestate.placedTiles[currentTile.eastTileIndex];
						flippedDirection = rotatedDirections[directionIndex].replace(/E/g,'W');
						if(checkForMeeples(connectedTile, featureType, getFeatureIndex(connectedTile, featureType, flippedDirection), checkedTiles)) {
							return true;
						}
					}
				}
			}
			if(currentTile.southTileIndex !== undefined) {
				// console.log('checking S');
				indices = [rotatedDirections.indexOf('S'), rotatedDirections.indexOf('SSW'), rotatedDirections.indexOf('SSE')];
				// check the feature for south edges
				for(var i3 = 0; i3 < 3; i3++) {
					directionIndex = indices[i3];
					if(directionIndex !== -1) {
						// for any that were found check their connecting features
						connectedTile = gamestate.placedTiles[currentTile.southTileIndex];
						flippedDirection = rotatedDirections[directionIndex].replace(/S/g,'N');
						if(checkForMeeples(connectedTile, featureType, getFeatureIndex(connectedTile, featureType, flippedDirection), checkedTiles)) {
							return true;
						}
					}
				}
			}
			if(currentTile.westTileIndex !== undefined) {
				// console.log('checking W');
				indices = [rotatedDirections.indexOf('W'), rotatedDirections.indexOf('WNW'), rotatedDirections.indexOf('WSW')];
				// check the feature for west edges
				for(var i4 = 0; i4 < 3; i4++) {
					directionIndex = indices[i4];
					if(directionIndex !== -1) {
						// for any that were found check their connecting features
						connectedTile = gamestate.placedTiles[currentTile.westTileIndex];
						flippedDirection = rotatedDirections[directionIndex].replace(/W/g,'E');
						if(checkForMeeples(connectedTile, featureType, getFeatureIndex(connectedTile, featureType, flippedDirection), checkedTiles)) {
							return true;
						}
					}
				}
			}
			return false;
		})(placedTile, featureType, featureIndex);
	}
}

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
	var gameAlreadyStarted = false;
	// choose a random player to start
	var startingPlayer = Math.floor(Math.random()*gamestate.players.length);
	var colors = ['blue', 'green', 'purple', 'red', 'yellow'];
	for(var i = 0; i < gamestate.players.length; i++) {
		gameAlreadyStarted = gameAlreadyStarted || gamestate.players[i].active;
		gamestate.players[i].points = 0;
		gamestate.players[i].remainingMeeples = 7;
		gamestate.players[i].active = (i === startingPlayer);
		// choose a random remaining color for this player
		gamestate.players[i].color = colors.splice(Math.floor(Math.random()*colors.length), 1)[0];
	}
	if(!gameAlreadyStarted) {
		gamestate.drawTile(callback);
	}
};

gamestateSchema.methods.placeTile = function(move, callback) {
	var gamestate = this;
	var validPlacement = false;
	// get the active player
	var activePlayer, activePlayerIndex;
	for(var i1 = 0; i1 < gamestate.players.length; i1++) {
		if(gamestate.players[i1].active) {
			activePlayer = gamestate.players[i1];
			activePlayerIndex = i1;
			break;
		}
	}
	// validate tile and meeple placement
	for(var i2 = 0; i2 < gamestate.activeTile.validPlacements.length; i2++) {
		var placement = gamestate.activeTile.validPlacements[i2];
		if(placement.x === move.placement.x && 
		   placement.y === move.placement.y) {
			for(var i3 = 0; i3 < placement.rotations.length; i3++) {
				if(placement.rotations[i3].rotation === move.rotation) {
					if(!move.meeple) {
						validPlacement = true;
					} else if(activePlayer.remainingMeeples > 0) {
						for(var i4 = 0; i4 < placement.rotations[i3].meeples.length; i4++) {
							if(placement.rotations[i3].meeples[i4].locationType === move.meeple.type &&
							   placement.rotations[i3].meeples[i4].index === move.meeple.index) {
								validPlacement = true;
								break;
							}
						}
					}
					break;
				}
			}
			break;
		}
	}
	if(validPlacement) {
		// add tile creating proper north/south/east/west links to the existing placed tiles
		var newTile = {
			_id: mongoose.Types.ObjectId(),
			tile: gamestate.activeTile.tile,
			rotation: move.rotation,
			x: move.placement.x,
			y: move.placement.y
		};
		if(move.meeple) {
			activePlayer.remainingMeeples -= 1;
			newTile.meeples = [{
				playerIndex: activePlayerIndex,
				placement: {
					locationType: move.meeple.type,
					index: move.meeple.index
				}
			}];
		}
		// create links between the new tile and existing placed tiles
		for(var i5 = 0; i5 < gamestate.placedTiles.length; i5++) {
			var placedTile = gamestate.placedTiles[i5];
			if(placedTile.x === newTile.x) {
				if(placedTile.y === newTile.y - 1) {
					newTile.northTileIndex = i5;
					placedTile.southTileIndex = gamestate.placedTiles.length;
				} else if(placedTile.y === newTile.y + 1) {
					newTile.southTileIndex = i5;
					placedTile.northTileIndex = gamestate.placedTiles.length;
				}
			} else if(placedTile.y === newTile.y) {
				if(placedTile.x === newTile.x - 1) {
					newTile.westTileIndex = i5;
					placedTile.eastTileIndex = gamestate.placedTiles.length;
				} else if(placedTile.x === newTile.x + 1) {
					newTile.eastTileIndex = i5;
					placedTile.westTileIndex = gamestate.placedTiles.length;
				}
			}
		}
		// and then add it to the placed tiles
		gamestate.placedTiles.push(newTile);
		gamestate.populate('placedTiles.tile', function(err, gamestate) {
			var newlyPlacedTile = gamestate.placedTiles[gamestate.placedTiles.length - 1];
			// console.log('gamestate before cities =>' + JSON.stringify(gamestate));
			// console.log('==========================');
			// check for cities with meeples on them connected to the active tile which may have been completed by the placement
			for(var i = 0; i < newlyPlacedTile.tile.cities.length; i++) {
				checkAndFinalizeFeature(newlyPlacedTile, i, 'city', gamestate);
			}
			// console.log('gamestate after cities =>' + JSON.stringify(gamestate));
			// console.log('==========================');
			// and check for roads
			for(var k = 0; k < newlyPlacedTile.tile.roads.length; k++) {
				checkAndFinalizeFeature(newlyPlacedTile, k, 'road', gamestate);
			}
			// and check for cloisters
			checkAndFinalizeFeature(newlyPlacedTile, null, 'cloister', gamestate);
			// console.log('gamestate after cloisters =>' + JSON.stringify(gamestate));
			// console.log('==========================');
			// change the active player
			gamestate.players[activePlayerIndex].active = false;
			gamestate.players[(activePlayerIndex + 1) % gamestate.players.length].active = true;
			gamestate.drawTile(callback);
		});
	}
};

function checkAndFinalizeFeature(placedTile, featureIndex, featureType, gamestate) {
	function getFeatureInfo(currentTile, featureIndex, featureType, checkedTiles) {
		var results;
		if(featureType === 'cloister') {
			results = {
				points: 0,
				tilesWithMeeples: []
			};
			// iteratively check this tile and all those around it
			// add a point for every tile in range
			for(var ind = 0; ind < gamestate.placedTiles; ind++) {
				if((gamestate.placedTiles[ind].x <= currentTile.x + 1 || gamestate.placedTiles[ind].x >= currentTile.x - 1) &&
				   (gamestate.placedTiles[ind].y <= currentTile.y + 1 || gamestate.placedTiles[ind].y >= currentTile.y - 1)) {
					results.points++;
				}
			}
			// grab the potential reference to the cloister meeple
			for(var ind2 = 0; ind2 < currentTile.meeples; ind2++) {
				if(currentTile.meeples[ind2].locationType === 'cloister') {
					results.tilesWithMeeples.push({
						placedTile: currentTile,
						meepleIndex: ind2
					});
					break;
				}
			}
			results.complete = (results.points === 9);
		} else if(featureType === 'road' || featureType === 'city') {
			// recursively calculate feature (road or city) completeness, point value
			// and record tiles with placed meeples for potential removal and scoring
			if(!checkedTiles) {
				checkedTiles = {};
			}
			results = {
				complete: true,
				points: 0,
				tilesWithMeeples: []
			};
			// if we have already examined this feature skip checking and add zere points
			if(checkedTiles[currentTile] &&
			   checkedTiles[currentTile].indexOf(featureIndex) !== -1) {
				return results;
			}
			// otherwise record the feature index of the tile as checked
			if(checkedTiles[currentTile]) {
				checkedTiles[currentTile].push(featureIndex);
			} else {
				checkedTiles[currentTile] = [featureIndex];
				// only add points if this is the first time encountering the tile
				results.points = currentTile.tile.doublePoints && featureType === 'city' ? 2 : 1;
			}
			// console.log('checking meeples =>' + JSON.stringify(currentTile.meeples));
			// console.log('==========================');
			// record the locations of any meeples on this feature
			for(var i = 0; i < currentTile.meeples.length; i++) {
				if(currentTile.meeples[i].placement.locationType === featureType &&
				   currentTile.meeples[i].placement.index === featureIndex) {
					results.tilesWithMeeples.push({
						placedTile: currentTile,
						meepleIndex: i
					});
				}
			}
			// grab the definition of the current feature from the tile
			var currentFeature = currentTile.tile[featureType === 'city' ? 'cities' : featureType + 's'][featureIndex];
			// console.log('found feature ' + (featureType === 'city' ? 'cities' : featureType + 's') + ',' + featureIndex + '=>' + JSON.stringify(currentFeature));
			// console.log('==========================');
			// for each side this feature has try and extend to connected tiles searching for
			// meeples to record, points to score, or to detect incompleteness
			for(var j = 0; j < currentFeature.directions.length; j++) {
				// apply the tiles rotation to the feature definition to determine which tile to check next
				var direction = currentFeature.directions[j];
				var connectedTile;
				var directions = ['N','E','S','W'];
				var rotatedDirection = directions[(directions.indexOf(direction) + currentTile.rotation) % 4];
				if(rotatedDirection === 'N') {
					connectedTile = gamestate.placedTiles[currentTile.northTileIndex];
				} else if(rotatedDirection === 'E') {
					connectedTile = gamestate.placedTiles[currentTile.eastTileIndex];
				} else if(rotatedDirection === 'S') {
					connectedTile = gamestate.placedTiles[currentTile.southTileIndex];
				} else if(rotatedDirection === 'W') {
					connectedTile = gamestate.placedTiles[currentTile.westTileIndex];
				}
				if(!connectedTile) {
					// console.log('no connection: ' + rotatedDirection);
					// console.log('==========================');
					// if the feature extends in this direction and there is no tile the feature is not complete
					results.complete = false;
				} else {
					// console.log('moving: ' + rotatedDirection);
					// console.log('==========================');
					// flip the rotated direction since we are getting the feature index from the perspective of the connected tile
					var connectedDirection = directions[(directions.indexOf(rotatedDirection) + 2) % 4];
					// traverse over to it summing up completeness, points, and meeples
					var connectedIndex = getFeatureIndex(connectedTile, featureType, connectedDirection);
					var neighborResults = getFeatureInfo(connectedTile, connectedIndex, featureType, checkedTiles);
					results.complete = results.complete && neighborResults.complete;
					results.points = results.points + neighborResults.points;
					for(var z = 0; z < neighborResults.tilesWithMeeples.length; z++) {
						results.tilesWithMeeples.push(neighborResults.tilesWithMeeples[z]);
					}
				}
			}
			return results;
		}
	}
	function scoreAndRemoveMeeples(featureInfo) {
		// if the feature is done and there were meeples remove and score them
		if(featureInfo.complete && featureInfo.tilesWithMeeples.length > 0) {
			// the points only go to the player(s) with the most meeples on the feature
			var meepleCount = {};
			var playersWithMeeples = [];
			var maxNumberOfMeeples = 1;
			for(var i = 0; i < featureInfo.tilesWithMeeples.length; i++) {
				// find the player this meeple belongs to
				var playerIndex = featureInfo.tilesWithMeeples[i].placedTile.meeples[featureInfo.tilesWithMeeples[i].meepleIndex].playerIndex;
				// remove the meeple from the placed tile
				featureInfo.tilesWithMeeples[i].placedTile.meeples.splice(featureInfo.tilesWithMeeples[i].meepleIndex, 1);
				// increase this players count of meeples on this feature
				if(playersWithMeeples.indexOf(playerIndex) === -1) {
					playersWithMeeples.push(playerIndex);
					meepleCount[playerIndex] = 0;
				}
				meepleCount[playerIndex]++;
				if(meepleCount[playerIndex] > maxNumberOfMeeples) {
					maxNumberOfMeeples = meepleCount[playerIndex];
				}
			}
			// score meeples on this feature for each player with the max number of meeples
			// refund all removed meeples
			for(var k = 0; k < gamestate.players.length; k++) {
				if(meepleCount[k]) {
					gamestate.players[k].remainingMeeples += meepleCount[k];
					if(meepleCount[k] === maxNumberOfMeeples) {
						gamestate.players[k].points += featureInfo.points * (featureType === 'city' ? 2 : 1);
					}
				}
			}
		}
	}
	if(featureType === 'cloister') {
		// check the newly placed tile and all those around it who may have been completed
		for(var i = 0; i < gamestate.placedTiles; i++) {
			if(gamestate.placedTiles[i].tile.cloister &&
			   (gamestate.placedTiles[i].x <= placedTile.x + 1 || gamestate.placedTiles[i].x >= placedTile.x - 1) &&
			   (gamestate.placedTiles[i].y <= placedTile.y + 1 || gamestate.placedTiles[i].y >= placedTile.y - 1)) {
				var cloisterInfo = getFeatureInfo(gamestate.placedTiles[i], null, 'cloister');
				scoreAndRemoveMeeples(cloisterInfo);
			}
		}
	} else if(featureType === 'road' || featureType === 'city') {
		var featureInfo = getFeatureInfo(placedTile, featureIndex, featureType);
		// console.log('feature info =>' + JSON.stringify(featureInfo));
		// console.log('==========================');
		scoreAndRemoveMeeples(featureInfo);
	}
}

function getFeatureIndex(placedTile, type, direction) {
	// get the index of a feature based on a tile and the rotated direction on the tile (placed direction)
	// type must be 'city', 'farm', or 'road'
	var directions, unrotatedDirection, currentFeature;
	var pluralType = (type === 'city' ? 'cities' : type + 's');
	if(type === 'city' || type === 'road') {
		// take into account the tile rotation (which isn't applied to the feature definitions)
		directions = ['N','E','S','W'];
		unrotatedDirection = directions[((directions.indexOf(direction) - placedTile.rotation) % 4 + 4) % 4];
		// console.log('feature index find =>' + unrotatedDirection);
		// console.log('feature index find =>' + JSON.stringify(placedTile));
		// console.log('==========================');
		for(var i = 0; i < placedTile.tile[pluralType].length; i++) {
			currentFeature = placedTile.tile[pluralType][i];
			if(currentFeature.directions.indexOf(unrotatedDirection) !== -1) {
				return i;
			}
		}
	} else if(type === 'farm') {
		directions = ['NNE','ENE','ESE','SSE','SSW','WSW','WNW','NNW'];
		unrotatedDirection = directions[((directions.indexOf(direction) - placedTile.rotation * 2) % 8 + 8) % 8];
		for(var k = 0; k < placedTile.tile[pluralType].length; k++) {
			currentFeature = placedTile.tile[pluralType][k];
			if(currentFeature.directions.indexOf(unrotatedDirection) !== -1) {
				return k;
			}
		}
	} else if(type === 'cloister') {
		return 1;
	}
	throw new Error("couldn't find feature index for: " + placedTile.x + ',' + placedTile.y + ' ' + type + ':' + direction);
}

// create the model for game information and expose it to our app
module.exports = mongoose.model('Gamestate', gamestateSchema);