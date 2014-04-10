/* jshint -W099 */
var cookie = require('cookie');
var connect = require('connect');
var moniker = require('moniker');
var Q = require('q');

// load up the gamestate model
var Tile = require('./models/tile');
var Gamestate = require('./models/gamestate');
var User = require('./models/user');

var subscriptions = {
	gameToSocket: {}, // index by gameid, array of sockets to send update messages to
	socketToGame: {} // index by socket id, current active gameid
};

module.exports = function(server, sessionStore) {

	//TODO: remove after testing
    Tile.remove({}).exec();
	Tile.count({}, function(err, count) {
		if(count === 0) {
			loadTiles();
		}
	});

    var io = require('socket.io').listen(server);
    io.set('log level', 1); // reduce logging
	io.set('authorization', function(handshakeData, accept)  {
		if (handshakeData.headers.cookie) {
			handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
			handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], process.env.EXPRESS_SESSION_SECRET);
			if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
				return accept('Cookie is invalid.', false);
			}
		} else {
			return accept('No cookie transmitted.', false);
		}
		accept(null, true);
	});

    io.sockets.on('connection', function (socket) {
    	// retrieve user information for user specific actions
        sessionStore.get(socket.handshake.sessionID, function(err, session) {
            if(err || !session) {
                console.log("couldn't retrieve session");
                return;
            }
            User.findById(session.passport.user, function(err, currentUser) {
		        socket.on('new game', function() {
		        	// pull the user information from the db again in case it has changed since the socket was established
		        	User.findById(currentUser._id, function(err, currentUser) {
						//TODO: remove after testing
			            currentUser.activeGames = [];
			            var gamestate = new Gamestate(); // create a new gamestate
			            initializeNewGame(gamestate, currentUser).then(function() {
							subscribe(socket, gamestate); // when creating a game it is now active so subscribe to updates
							gamestate.populate('placedTiles.tile', function(err, gamestate) {
								if(err) { console.log('new game populate err: ' + err); }
								socket.emit('sending gamestate', gamestate);
				            });
			            });
		        	});
		        });
		        socket.on('load game', function(gameID) {
		            Gamestate.findById(gameID, function(err, gamestate) {
		                if(err) { console.log('load find err: ' + err); }
		                if(userIsInGame(currentUser, gamestate)) {
			                subscribe(socket, gamestate); // when loading a game it is now active so subscribe to updates
			                gamestate.populate('placedTiles.tile', function(err, gamestate) {
			                    if(err) { console.log('load populate err: ' + err); }
			                    socket.emit('sending gamestate', gamestate);
			                });
		                }
		            });
		        });
		        socket.on('add user to game', function(gameID, userID) {
		        	//TODO: since we are adding user provided data to the db we should have some sort of job that finds and removes games with invalid references
		            Gamestate.findById(gameID, function(err, gamestate) {
			            if(!err && userIsInGame(currentUser, gamestate) && !userIsInGame(userID, gamestate)) {
			            	gamestate.players.push({ user: userID });
		        			User.findByIdAndUpdate(userID, { $push: { activeGames: gameID }}, function(err) {
		        				if(err) {
	        						console.log('user add to game err: ' + err);
	        					} else {
	            					gamestate.save();
	        					}
		        			});
			            }
		            });
		        });
		        socket.on('add friend', function(userID) {
		        	User.findByIdAndUpdate(currentUser._id, { $push: { friends: userID }}, { upsert: true }).exec();
		        });
		        socket.on('remove friend', function(userID) {
		        	User.findByIdAndUpdate(currentUser._id, { $pull: { friends: userID }}).exec();
		        });
            });
        });
		socket.on('disconnect', function() {
			unsubscribe(socket); // on disconnect remove update subscriptions
		});
    });
};

function userIsInGame(user, gamestate) {
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
}

function subscribe(socket, gamestate) {
	unsubscribe(socket); // remove any other subscriptions
	// add the gamestate -> socket mapping
	if(subscriptions.gameToSocket[gamestate._id]) {
		subscriptions.gameToSocket[gamestate._id].push(socket);
	} else {
		subscriptions.gameToSocket[gamestate._id] = [socket];
	}
	subscriptions.socketToGame[socket.id] = gamestate._id; // add the socket -> gamestate mapping
}

function unsubscribe(socket) {
	var activeGameID = subscriptions.socketToGame[socket.id];
	if(activeGameID) {
		if(subscriptions.gameToSocket[activeGameID].length === 0) {
			delete subscriptions.gameToSocket[activeGameID];
		} else {
			subscriptions.gameToSocket[activeGameID].splice(subscriptions.gameToSocket[activeGameID].indexOf(socket), 1);
		}
	}
	delete subscriptions.socketToGame[socket.id];
}

function initializeNewGame(newGame, user) {
	//TODO: remove after testing
    Gamestate.remove({}).exec();
    newGame.players = [{ user: user._id }]; // with the current user as the only player
    newGame.name = moniker.choose();
    user.activeGames.unshift(newGame._id); // add the game to the users active games
    // grab the starting tile and make it the only placed tile
    var startTilePlaced = Tile.findOne({ startingTile: true, expansion: 'base-game' }).exec(function(err, startTile) {
		newGame.placedTiles.unshift({
			tile: startTile._id,
			rotation: 0
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
    return Q.all([startTilePlaced, unusedTilesLoaded]).then(function() {
        newGame.save(function(err) {
            if(err) { console.log('new game save err: ' + err); }
            user.save(function(err) {
                if(err) { console.log('user save err: ' + err); }
                console.log('new game saved');
            });
        });
    });
}

function loadTiles() {
	// Load all the base game tiles into the database
    Tile.create({
        northEdge: 'city', // edges are 'road', 'city', or 'field'
        southEdge: 'field',
        westEdge: 'road',
        eastEdge: 'road',
        roads: [{ directions: ['W E'] }], // features are arrays of directions, example of curved road or triangle city ['S','W']
        cities: [{ directions: ['N'] }],
        farms: [{ directions: ['WNW ENE', 'WSW SSW SSE ESE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/RCr.jpg',
        expansion: 'base-game',
        count: 4,
        startingTile: true
    },{
        northEdge: 'city',
        southEdge: 'field',
        westEdge: 'field',
        eastEdge: 'field',
        roads: [],
        cities: [{ directions: ['N'] }],
        farms: [{ directions: ['WNW WSW SSW SSE ESE ENE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/C.jpg',
        expansion: 'base-game',
        count: 5,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'field',
        westEdge: 'city',
        eastEdge: 'field',
        roads: [],
        cities: [{ directions: ['N', 'W'] }],
        farms: [{ directions: ['SSW SSE ESE ENE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/CC.2.jpg',
        expansion: 'base-game',
        count: 2,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'city',
        westEdge: 'field',
        eastEdge: 'field',
        roads: [],
        cities: [{ directions: ['N', 'S'] }],
        farms: [{ directions: ['WNW WSW ENE ESE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/CFC.2.jpg',
        expansion: 'base-game',
        count: 3,
        startingTile: false
    },{
        northEdge: 'field',
        southEdge: 'field',
        westEdge: 'city',
        eastEdge: 'city',
        roads: [],
        cities: [{ directions: ['W E'] }],
        farms: [{ directions: ['NNW NNE','SSW SSE'] }],
        cloister: false,
        doublePoints: true,
        imageURL: '/images/tiles/base-game/CFc+.jpg',
        expansion: 'base-game',
        count: 2,
        startingTile: false
    },{
        northEdge: 'field',
        southEdge: 'field',
        westEdge: 'city',
        eastEdge: 'city',
        roads: [],
        cities: [{ directions: ['W E'] }],
        farms: [{ directions: ['NNW NNE','SSW SSE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/CFc.1.jpg',
        expansion: 'base-game',
        count: 1,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'road',
        westEdge: 'road',
        eastEdge: 'road',
        roads: [{ directions: ['W','S','E'] }],
        cities: [{ directions: ['N'] }],
        farms: [{ directions: ['WNW ENE','WSW SSW', 'SSE ESE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/CRRR.jpg',
        expansion: 'base-game',
        count: 3,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'road',
        westEdge: 'field',
        eastEdge: 'road',
        roads: [{ directions: ['S E'] }],
        cities: [{ directions: ['N'] }],
        farms: [{ directions: ['WNW WSW SSW ENE','SSE ESE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/CRr.jpg',
        expansion: 'base-game',
        count: 3,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'field',
        westEdge: 'city',
        eastEdge: 'field',
        roads: [],
        cities: [{ directions: ['N W'] }],
        farms: [{ directions: ['SSW SSE ESE ENE'] }],
        cloister: false,
        doublePoints: true,
        imageURL: '/images/tiles/base-game/Cc+.jpg',
        expansion: 'base-game',
        count: 2,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'field',
        westEdge: 'city',
        eastEdge: 'field',
        roads: [],
        cities: [{ directions: ['N W'] }],
        farms: [{ directions: ['SSW SSE ESE ENE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/Cc.1.jpg',
        expansion: 'base-game',
        count: 3,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'road',
        westEdge: 'city',
        eastEdge: 'road',
        roads: [{ directions: ['S E'] }],
        cities: [{ directions: ['N W'] }],
        farms: [{ directions: ['SSW ENE', 'SSE ESE'] }],
        cloister: false,
        doublePoints: true,
        imageURL: '/images/tiles/base-game/CcRr+.jpg',
        expansion: 'base-game',
        count: 2,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'road',
        westEdge: 'city',
        eastEdge: 'road',
        roads: [{ directions: ['S E'] }],
        cities: [{ directions: ['N W'] }],
        farms: [{ directions: ['SSW ENE', 'SSE ESE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/CcRr.jpg',
        expansion: 'base-game',
        count: 3,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'field',
        westEdge: 'city',
        eastEdge: 'city',
        roads: [],
        cities: [{ directions: ['N E W'] }],
        farms: [{ directions: ['SSW SSE'] }],
        cloister: false,
        doublePoints: true,
        imageURL: '/images/tiles/base-game/Ccc+.jpg',
        expansion: 'base-game',
        count: 1,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'field',
        westEdge: 'city',
        eastEdge: 'city',
        roads: [],
        cities: [{ directions: ['N E W'] }],
        farms: [{ directions: ['SSW SSE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/Ccc.jpg',
        expansion: 'base-game',
        count: 3,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'road',
        westEdge: 'city',
        eastEdge: 'city',
        roads: [{ directions: ['S'] }],
        cities: [{ directions: ['N E W'] }],
        farms: [{ directions: ['SSW', 'SSE'] }],
        cloister: false,
        doublePoints: true,
        imageURL: '/images/tiles/base-game/CccR+.jpg',
        expansion: 'base-game',
        count: 2,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'road',
        westEdge: 'city',
        eastEdge: 'city',
        roads: [{ directions: ['S'] }],
        cities: [{ directions: ['N E W'] }],
        farms: [{ directions: ['SSW', 'SSE'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/CccR.jpg',
        expansion: 'base-game',
        count: 1,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'city',
        westEdge: 'city',
        eastEdge: 'city',
        roads: [],
        cities: [{ directions: ['N E S W'] }],
        farms: [],
        cloister: false,
        doublePoints: true,
        imageURL: '/images/tiles/base-game/Cccc+.jpg',
        expansion: 'base-game',
        count: 1,
        startingTile: false
    },{
        northEdge: 'field',
        southEdge: 'field',
        westEdge: 'field',
        eastEdge: 'field',
        roads: [],
        cities: [],
        farms: [{ directions: ['NNW NNE ENE ESE SSE SSW WSW WNW'] }],
        cloister: true,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/L.jpg',
        expansion: 'base-game',
        count: 4,
        startingTile: false
    },{
        northEdge: 'field',
        southEdge: 'road',
        westEdge: 'field',
        eastEdge: 'field',
        roads: [{ directions: ['S'] }],
        cities: [],
        farms: [{ directions: ['NNW NNE ENE ESE SSE SSW WSW WNW'] }],
        cloister: true,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/LR.jpg',
        expansion: 'base-game',
        count: 2,
        startingTile: false
    },{
        northEdge: 'field',
        southEdge: 'field',
        westEdge: 'road',
        eastEdge: 'road',
        roads: [{ directions: ['E W'] }],
        cities: [],
        farms: [{ directions: ['WNW NNW NNE ENE', 'ESE SSE SSW WSW'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/RFr.jpg',
        expansion: 'base-game',
        count: 8,
        startingTile: false
    },{
        northEdge: 'field',
        southEdge: 'road',
        westEdge: 'road',
        eastEdge: 'road',
        roads: [{ directions: ['E', 'S', 'W'] }],
        cities: [],
        farms: [{ directions: ['WNW NNW NNE ENE', 'ESE SSE', 'SSW WSW'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/RRR.jpg',
        expansion: 'base-game',
        count: 4,
        startingTile: false
    },{
        northEdge: 'road',
        southEdge: 'road',
        westEdge: 'road',
        eastEdge: 'road',
        roads: [{ directions: ['N', 'E', 'S', 'W'] }],
        cities: [],
        farms: [{ directions: ['WNW NNW', 'NNE ENE', 'ESE SSE', 'SSW WSW'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/RRRR.jpg',
        expansion: 'base-game',
        count: 1,
        startingTile: false
    },{
        northEdge: 'field',
        southEdge: 'road',
        westEdge: 'road',
        eastEdge: 'field',
        roads: [{ directions: ['W S'] }],
        cities: [],
        farms: [{ directions: ['WNW NNW NNE ENE ESE SSE', 'SSW WSW'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/Rr.jpg',
        expansion: 'base-game',
        count: 9,
        startingTile: false
    },{
        northEdge: 'city',
        southEdge: 'road',
        westEdge: 'road',
        eastEdge: 'field',
        roads: [{ directions: ['W S'] }],
        cities: [{ directions: ['N'] }],
        farms: [{ directions: ['WNW ENE ESE SSE', 'SSW WSW'] }],
        cloister: false,
        doublePoints: false,
        imageURL: '/images/tiles/base-game/RrC.jpg',
        expansion: 'base-game',
        count: 3,
        startingTile: false
    }, function(err) { if(err) { console.log('load tiles err: ' + err); } });
}