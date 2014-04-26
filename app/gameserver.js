var cookie = require('cookie');
var connect = require('connect');

// load up the gamestate model
var Tile = require('./models/tile');
var Gamestate = require('./models/gamestate');
var User = require('./models/user');

//TODO: user chat
//TODO: trim/lean before emitting
//TODO: send update when players see game finish, when all have seen delete from db
var subscriptions = {
	gameToSocket: {}, // index by gameid, array of sockets to send update messages to
	socketToGame: {} // index by socket id, current active gameid
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
				socket.on('new game', function() {
					// pull the user information from the db again in case it has changed since the socket was established
					User.findById(currentUser._id, function(err, currentUser) {
						if(err) { console.log('new game find user err: ' + err); }
						//TODO: remove after testing
						currentUser.activeGames = [];
						Gamestate.remove({}).exec();
						var gamestate = new Gamestate(); // create a new gamestate
						gamestate.initializeNewGame(currentUser, function() {
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
						if(gamestate && gamestate.userIsInGame(currentUser)) {
							subscribe(socket, gamestate); // when loading a game it is now active so subscribe to updates
							gamestate.populate('placedTiles.tile activeTile.tile', function(err, gamestate) {
								if(err) { console.log('load populate err: ' + err); }
								socket.emit('sending gamestate', gamestate);
							});
						}
					});
				});
				socket.on('start game', function(gameID) {
					Gamestate.findById(gameID, function(err, gamestate) {
						if(err) { console.log('start game err: ' + err); }
						if(gamestate && gamestate.userIsInGame(currentUser)) {
							gamestate.startGame(function(err, gamestate) {
								for(var i = 0; i < subscriptions.gameToSocket[gameID].length; i++) {
									subscriptions.gameToSocket[gameID][i].emit('sending gamestate', gamestate);
								}
							});
						}
					});
				});
				socket.on('sending move', function(gameID, move, autocomplete) {
					Gamestate.findById(gameID, function(err, gamestate) {
						if(err) { console.log('load find err: ' + err); }
						if(gamestate && gamestate.userIsActive(currentUser)) {
							gamestate.placeTile(move, function(err, gamestate) {
								for(var i = 0; i < subscriptions.gameToSocket[gameID].length; i++) {
									subscriptions.gameToSocket[gameID][i].emit('sending gamestate', gamestate);
								}
							}, autocomplete);
						}
					});
				});
				socket.on('add user to game', function(gameID, userID) {
					Gamestate.findById(gameID, function(err, gamestate) {
						if(!err && 
							gamestate && 
							gamestate.players.length < 5 &&
							gamestate.userIsInGame(currentUser) && 
							!gamestate.userIsInGame(userID)) {
							gamestate.players.push({ user: userID });
							gamestate.save();
							//TODO: remove after testing
							User.findByIdAndUpdate(userID, { $set: { activeGames: [gameID] }}).exec();
							// User.findByIdAndUpdate(userID, { $push: { activeGames: gameID }}).exec();
						}
					});
				});
				socket.on('add friend', function(username) {
					User.findOne({ username: username }, function(err, user) {
						if(user) {
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
		socket.on('disconnect', function() {
			unsubscribe(socket); // on disconnect remove update subscriptions
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