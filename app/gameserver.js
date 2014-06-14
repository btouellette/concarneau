/* jslint smarttabs:true */
var cookie = require('cookie');
var connect = require('connect');
var nodemailer = require('nodemailer');
var twit = require('twit');
var auth = require('../config/auth');

// load up the gamestate model
var Tile = require('./models/tile');
var Gamestate = require('./models/gamestate');
var User = require('./models/user');

//TODO: matchmaking
//TODO: demo mode
//TODO: make sure updates to empty games or users don't crash the nodejs instance
//TODO: send update when players see game finish, when all have seen delete from db
//TODO: send error messages back to client if failure and report them back
//TODO: make sure that all items (current game, friends, etc) are kept in sync, consider just sending user and updating every time the user changes
var userToSocket = {};

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "concarneau.game@gmail.com",
        pass: process.env.EMAIL_PASSWORD
    }
});
var twitter = new twit({
	consumer_key: auth.twitterAuth.consumerKey,
	consumer_secret: auth.twitterAuth.consumerSecret,
	access_token: auth.twitterAuth.accessToken,
	access_token_secret: auth.twitterAuth.accessTokenSecret
});

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
			try {
				try {
					handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
				} catch (err) {
					return accept('Error during initial cookie parse - ' + JSON.stringify(err), false);
				}
				try {
					handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], process.env.EXPRESS_SESSION_SECRET);
				} catch (err) {
					return accept('Error during signed cookie parse - ' + JSON.stringify(err), false);
				}
				if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
					return accept('Cookie is invalid.', false);
				}
			} catch (err) {
				return accept('Error parsing session cookie - ' + JSON.stringify(err), false);
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
				if(userToSocket[currentUser._id]) {
					userToSocket[currentUser._id].push(socket);
				} else {
					userToSocket[currentUser._id] = [socket];
				}
				socket.on('disconnect', function() {
					// on disconnect remove update subscriptions
					if(userToSocket[currentUser._id].length === 1) {
						delete userToSocket[currentUser._id];
					} else {
						userToSocket[currentUser._id].splice(userToSocket[currentUser._id].indexOf(socket), 1);
					}
				});
				socket.on('new game', function(friends) {
					// pull the user information from the db again in case it has changed since the socket was established
					User.findById(currentUser._id, function(err, currentUser) {
						if(err) { console.log('new game find user err: ' + err); }
						var gamestate = new Gamestate(); // create a new gamestate
						gamestate.initializeNewGame(currentUser, friends, function() {
							gamestate.populate('placedTiles.tile activeTile.tile players.user',
							                   'cities.meepleOffset cloister farms.meepleOffset roads.meepleOffset imageURL username',
								function(err, gamestate) {
									if(err) { console.log('new game populate err: ' + err); }
									// get distinct list of user IDs in the game
									var distinctUserIDs = gamestate.players.map(function(player) { return player.user._id; }).filter(function(value, index, self) {
										return self.indexOf(value) === index;
									});
									// if players are active send them the new game
									for(var i = 0; i < distinctUserIDs.length; i++) {
										var socketArray = userToSocket[distinctUserIDs[i]];
										if(socketArray) {
											for(var k = 0; k < socketArray.length; k++) {
												socketArray[k].emit('game started', gamestate, currentUser._id);
											}
										}
									}
								}
							);
						});
					});
				});
				socket.on('load game', function(gameID) {
					Gamestate.findById(gameID, function(err, gamestate) {
						if(err) { console.log('load find err: ' + err); }
						if(gamestate && gamestate.userIsInGame(currentUser)) {
							gamestate.populate('placedTiles.tile activeTile.tile unusedTiles players.user', 
							                   'cities.meepleOffset farms.meepleOffset roads.meepleOffset cloister imageURL username',
								function(err, gamestate) {
									if(err) { console.log('load populate err: ' + err); }
									socket.emit('sending gamestate', gamestate, true);
								}
							);
						}
					});
				});
				socket.on('remove game', function(gameID) {
					Gamestate.findByIdAndRemove(gameID, function(err, gamestate) {
						if(err || !gamestate) { 
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
						if(err || !gamestate) { 
							console.log('load find err: ' + err); 
						} else if(move && gamestate.userIsActive(currentUser)) {
							gamestate.placeTile(move, function(err, gamestate) {
								if(err || !gamestate) {
									console.log('place tile err: ' + err); 
								} else {
									gamestate.markModified('unusedTiles');
									gamestate.populate('placedTiles.tile activeTile.tile unusedTiles players.user',
									                   'cities.meepleOffset farms.meepleOffset roads.meepleOffset cloister imageURL email_notifications twitter_notifications username local.email facebook.email google.email twitter.username',
										function(err, gamestate) {
											if(err) { 
												console.log('send move populate err: ' + err);
											} else {
												var activeUser, previousUser;
												for(var j = 0; j < gamestate.players.length; j++) {
													if(gamestate.players[j].active) {
														activeUser = gamestate.players[j].user;
														previousUser = gamestate.players[(j - 1 + gamestate.players.length) % gamestate.players.length].user;
														break;
													}
												}
												// send notification to user if the user has changed and they are not actively connected
												if(!userToSocket[activeUser._id] && activeUser.username !== previousUser.username) {
													var activeEmail = activeUser.local.email || activeUser.google.email || activeUser.facebook.email;
													// send e-mail notification if we have a valid e-mail and the user has the option enabled
													if(activeEmail && activeUser.email_notifications) {
														smtpTransport.sendMail({
															from: "Concarneau <concarneau.game@gmail.com",
															to: activeEmail,
															subject: "Your turn!",
															text: "There is a Concarneau game where it is your turn: https://concarneau.herokuapp.com"
														}, function(err, res) {
															if(err) {
																console.log('e-mail failed: ' + err);
															}
														});
													}
													// send twitter notification if we have a valid twitter handle and the user has the option enabled
													if(activeUser.twitter.username && activeUser.twitter_notifications) {
														twitter.post('statuses/update', { status: '@' + activeUser.twitter.username + ' There is a Concarneau game where it is your turn: https://concarneau.herokuapp.com?' + Math.floor(Math.random()*1000000) }, function(err, data, response) {
															if(err) {
																console.log('twitter failed: ' + err);
															}
														});
													}
												}
												// get distinct list of user IDs in the game
												var distinctUserIDs = gamestate.players.map(function(player) { return player.user._id; }).filter(function(value, index, self) {
													return self.indexOf(value) === index;
												});
												// if players are active send them the new gamestate
												for(var i = 0; i < distinctUserIDs.length; i++) {
													var socketArray = userToSocket[distinctUserIDs[i]];
													if(socketArray) {
														for(var k = 0; k < socketArray.length; k++) {
															socketArray[k].emit('sending gamestate', gamestate, false);
														}
													}
												}
											}
										}
									);
								}
							}, autocomplete);
						}
					});
				});
				socket.on('add friend', function(username) {
					User.findOne({ username: username }, function(err, user) {
						if(user) {
							var friendID = user._id;
							if(currentUser.friends.indexOf(user._id) === -1) {
								User.findByIdAndUpdate(currentUser._id, { $addToSet: { friends: user._id }}, function(err, user) {
									if(!err && user) {
										socket.emit('friend added', username, friendID);
										currentUser = user;
									}
								});
							}
						} else {
							socket.emit('friend not found');
						}
					});
					
				});
				socket.on('remove friend', function(userID) {
					User.findByIdAndUpdate(currentUser._id, { $pull: { friends: userID }}).exec();
				});
				socket.on('sending message', function(message, gameID) {
					Gamestate.findById(gameID, function(err, gamestate) {
						if(err) { console.log('message find err: ' + err); }
						if(gamestate && gamestate.userIsInGame(currentUser)) {
							// add the message to the gamestate, trimming to 100 characters and limiting message array length to 100
							message = message.substr(0,100);
							Gamestate.findByIdAndUpdate(gameID, { $push: { messages: { $each: [{ username: currentUser.username, message: message}], $slice: -100 }}}, function(err, gamestate) {
								gamestate.populate('players.user', function(err, gamestate) {
									// get distinct list of user IDs in the game
									var distinctUserIDs = gamestate.players.map(function(player) { return player.user._id; }).filter(function(value, index, self) {
										return self.indexOf(value) === index;
									});
									// if players are active send them the new message
									for(var i = 0; i < distinctUserIDs.length; i++) {
										var socketArray = userToSocket[distinctUserIDs[i]];
										if(socketArray) {
											for(var k = 0; k < socketArray.length; k++) {
												socketArray[k].emit('message sent', message, currentUser.username, gamestate._id);
											}
										}
									}
								});
							});
						}
					});
				});
				socket.on('email notification', function(enabled) {
					User.findByIdAndUpdate(currentUser._id, { $set: { email_notifications: enabled }} , function(err, user) {
						if(!err && user) {
							currentUser = user;
						}
					});
				});
				socket.on('twitter notification', function(enabled) {
					User.findByIdAndUpdate(currentUser._id, { $set: { twitter_notifications: enabled }} , function(err, user) {
						if(!err && user) {
							currentUser = user;
						}
					});
				});
			});
		});
	});
};