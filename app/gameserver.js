var cookie = require('cookie');
var connect = require('connect');

// load up the gamestate model
var Tile = require('./models/tile');
var Gamestate = require('./models/gamestate');
var User = require('./models/user');

module.exports = function(server, sessionStore) {

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
        User.find(function(err, user) {
            socket.emit('all users', JSON.stringify(user));
        });
        var currentUser;
        sessionStore.get(socket.handshake.sessionID, function(err, session) {
    		if(err || !session) {
    			console.log("couldn't retrieve session");
    			return;
    		}
    		User.findById(session.passport.user, function(err, user) {
    			currentUser = user;
    		});
    	});
        socket.on('new game', function () {
            // create the user
            var newGame = new Gamestate();
            newGame.players = [{ user: currentUser._id }];
            newGame.name = 'GameName:' + newGame._id;
            newGame.save(function(err) {
                if (err) {
                    throw err;
                } else {
                	currentUser.activeGames.unshift(newGame._id);
                	currentUser.save(function(err) {
                		if(err) {
                			throw err;
                		} else {
                			console.log('game added');
                		}
                	});
                }
            });
        });
    });

};