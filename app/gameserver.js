var cookie = require('cookie');
var connect = require('connect');

// load up the gamestate model
var Tile = require('./models/tile');
var Gamestate = require('./models/gamestate');
var User = require('./models/user');

//TODO: user chat
//TODO: trim/lean before emitting
//TODO: send update when players see game finish, when all have seen delete from db
//TODO: send error messages back to client if failure and report them back
//TODO: make sure that all items (current game, friends, etc) are kept in sync, consider just sending user and updating every time the user changes
var subscriptions = {
	gameToSocket: {}, // index by gameid, array of sockets to send update messages to
	socketToGame: {}, // index by socket id, current active gameid
	userToSocket: {}
};

module.exports = function(server, sessionStore) {

	// if the tile db is empty load in the tiles,
	Tile.count({}, function(err, count) {
		if(count === 0) {
			Tile.loadTiles();
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
				subscriptions.userToSocket[currentUser._id] = socket;
				socket.on('disconnect', function() {
					unsubscribe(socket); // on disconnect remove update subscriptions
					delete subscriptions.userToSocket[currentUser._id];
				});
				socket.on('new game', function(friends) {
					// pull the user information from the db again in case it has changed since the socket was established
					User.findById(currentUser._id, function(err, currentUser) {
						if(err) { console.log('new game find user err: ' + err); }
						var gamestate = new Gamestate(); // create a new gamestate
						gamestate.initializeNewGame(currentUser, friends, function() {
							subscribe(socket, gamestate); // when creating a game it is now active so subscribe to updates
							gamestate.populate('placedTiles.tile activeTile.tile players.user', function(err, gamestate) {
								if(err) { console.log('new game populate err: ' + err); }
								// get distinct list of user IDs in the game
								var distinctUserIDs = gamestate.players.map(function(player) { return player.user._id; }).filter(function(value, index, self) {
									return self.indexOf(value) === index;
								});
								// if players are active send them the new game
								for(var i = 0; i < distinctUserIDs.length; i++) {
									if(subscriptions.userToSocket[distinctUserIDs[i]]) {
										subscriptions.userToSocket[distinctUserIDs[i]].emit('game started', gamestate, currentUser._id);
									}
								}
							});
						});
					});
				});
				socket.on('load game', function(gameID) {
					Gamestate.findById(gameID, function(err, gamestate) {
						if(err) { console.log('load find err: ' + err); }
						if(gamestate && gamestate.userIsInGame(currentUser)) {
							subscribe(socket, gamestate); // when loading a game it is now active so subscribe to updates
							gamestate.populate('placedTiles.tile activeTile.tile players.user', function(err, gamestate) {
								if(err) { console.log('load populate err: ' + err); }
								socket.emit('sending gamestate', gamestate);
							});
						}
					});
				});
				socket.on('remove game', function(gameID) {
					Gamestate.findByIdAndRemove(gameID, function(err, gamestate) {
						if(err) { 
							console.log('remove game err: ' + err);
						} else {
							gamestate.populate('players.user', function(err, gamestate) {
								for(var i = 0; i < gamestate.players.length; i++) {
									User.findByIdAndUpdate(gamestate.players[i].user, { $pull: { activeGames: gamestate._id }}).exec();
								}	
							});
						}
					});
				});
				socket.on('sending move', function(gameID, move, autocomplete) {
					Gamestate.findById(gameID, function(err, gamestate) {
						if(err) { console.log('load find err: ' + err); }
						if(gamestate && gamestate.userIsActive(currentUser) && move) {
							gamestate.placeTile(move, function(err, gamestate) {
								gamestate.populate('placedTiles.tile activeTile.tile players.user', function(err, gamestate) {
									if(err) { console.log('send move populate err: ' + err); }
									for(var i = 0; i < subscriptions.gameToSocket[gameID].length; i++) {
										subscriptions.gameToSocket[gameID][i].emit('sending gamestate', gamestate);
									}
								});
							}, autocomplete);
						}
					});
				});
				socket.on('add friend', function(username) {
					User.findOne({ username: username }, function(err, user) {
						if(user) {
							//TODO: make this set distinct
							User.findByIdAndUpdate(currentUser._id, { $addToSet: { friends: user._id }}, function(err) {
								if(!err) {
									socket.emit('friend added', username, user._id);
								}
							});
						} else {
							socket.emit('friend not found');
						}
					});
					
				});
				socket.on('remove friend', function(userID) {
					User.findByIdAndUpdate(currentUser._id, { $pull: { friends: userID }}).exec();
				});
				socket.on('set display name', function(name) {
					User.findByIdAndUpdate(currentUser._id, { $set: { username: name }}).exec();
				});
            });
        });
    });
};

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