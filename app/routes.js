var User = require('./models/user');
const {parse, stringify} = require('flatted/cjs');
var crypto = require('crypto');
var ejs = require('ejs');
var mailer = require('./mailer');

//TODO: confirm e-mail before allowing into game

module.exports = function(app, passport, client) {

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
		if(req.isAuthenticated()) {
			if(process.env.SENTRY_DSN) { client.setUserContext({ user: req.user}); }
			res.redirect('/game');
		} else {
			res.render('index.ejs');
		}
	});

	// PROFILE SECTION =========================
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user
		});
	});

	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/username', isLoggedIn, function(req, res) {
		if(req.user.username) {
			res.redirect('/game');
		} else {
			res.render('username.ejs', {
				user : req.user,
				message: req.flash('usernameMessage')
			});
		}
	});

	// process the username form
	app.post('/username', isLoggedIn, function(req, res) {
		//console.log(req.headers['x-request-id'] + ' - selecting new username - ' + stringify(req));
		if(!req.user.username) {
			var username = req.body.username.toLowerCase();
			console.log(req.headers['x-request-id'] + ' - testing valid');
			if(/^[a-z0-9_]{1,12}$/.test(username)) {
				console.log(req.headers['x-request-id'] + ' - setting username');
				User.findByIdAndUpdate(req.user._id, { $set: { username: username }}, function(err) {
					console.log(req.headers['x-request-id'] + ' - setting username callback');
					if(err) {
						console.log(req.headers['x-request-id'] + ' - username callback error - ' + stringify(err));
						if(err.lastErrorObject && err.lastErrorObject.code === 11001) {
							console.log(req.headers['x-request-id'] + ' - setting username callback error taken');
							req.flash('usernameMessage', 'Username already taken');
						} else {
							console.log(req.headers['x-request-id'] + ' - setting username callback error unknown');
							req.flash('usernameMessage', err.errmsg);
						}
						console.log(req.headers['x-request-id'] + ' - reloading username');
						res.redirect('/username');
					} else {
						console.log(req.headers['x-request-id'] + ' - set user name sending to game');
						res.redirect('/game');
					}
				});
			} else {
				console.log(req.headers['x-request-id'] + ' - not valid');
				req.flash('usernameMessage', username.length > 12 ? 'Username too long' : username.length === 0 ? 'Username too short' : 'Username using invalid characters');
				res.redirect('/username');
			}
		} else {
			console.log(req.headers['x-request-id'] + ' - already has username');
			res.redirect('/game');
		}
	});

	app.get('/game', [isLoggedIn, hasUsername], function(req, res) {
		if(process.env.SENTRY_DSN) { client.setUserContext({ user: req.user}); }
		res.render('game.ejs', {
			user : req.user
		});
	});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
	// LOGIN ===============================
	// show the login form
	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/game', // redirect to the secure game section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// SIGNUP =================================
	// show the signup form
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/username', // redirect to the username choosing page
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// FORGOT =================================
	// show the forgot password form
	app.get('/forgot', function(req, res) {
		if(req.isAuthenticated()) {
			if(process.env.SENTRY_DSN) { client.setUserContext({ user: req.user}); }
			res.redirect('/game');
		} else {
			res.render('forgot.ejs', { message: req.flash('forgotPasswordMessage') });
		}
	});

	// process the forgot password form
	app.post('/forgot', function (req, res) {
		const email = req.body.email;
		const passwordResetToken = crypto.randomBytes(20).toString('hex');
		const passwordResetExpiration = Date.now() + 3600000*12; // expires after 12 hour
		User.findOneAndUpdate({ 'local.email': email.toLowerCase() }, { 'local.passwordResetToken': passwordResetToken, 'local.passwordResetExpiration': passwordResetExpiration }, function(err, user) {
			ejs.renderFile('views/password-reset.ejs', { serverURL: process.env.SERVER_URL, passwordResetToken: passwordResetToken }, function(err, html) {
				if (!err && user) {
					mailer.sendMail({
						from: 'Concarneau <concarneau.game@gmail.com>',
						to: email,
						subject: 'Resetting Your Password',
						html: html
					}, function(err, res) {
						if(err) {
							console.log('e-mail failed: ' + err);
						}
					});
				}
				// send message regardless of what happened to avoid scripted listing of users
				req.flash('forgotPasswordMessage', 'Password reset sent!');
				res.redirect('/forgot');
			});
		});
	});

	// RESET =================================
	// show the reset password form
	app.get('/reset', function(req, res) {
		res.render('reset.ejs', { passwordResetToken: req.query.prt, message: req.flash('resetPasswordMessage') });
	});

	// process the reset password form
	app.post('/reset', function(req, res) {
		const email = req.body.email;
		const password = req.body.password;
		const passwordResetToken = req.body.prt;
		User.findOneAndUpdate({
			'local.email': email.toLowerCase(),
			'local.passwordResetToken': passwordResetToken,
			'local.passwordResetExpiration': { $gt: Date.now() }
		}, {
			'local.passwordResetToken': null,
			'local.passwordResetExpiration': null,
			'local.password': User.generateHash(password)
		}, function (err, user) {
			ejs.renderFile('views/password-reset-success.ejs', { serverURL: process.env.SERVER_URL }, function(err, html) {
				if (err || !user) {
					req.flash('resetPasswordMessage', 'Incorrect email or password reset invalid or expired!');
					res.redirect('/reset');
				} else {
					mailer.sendMail({
						from: 'Concarneau <concarneau.game@gmail.com>',
						to: email,
						subject: 'Your Password Has Been Reset',
						html: html
					}, function(err, res) {
						if(err) {
							console.log('e-mail failed: ' + err);
						}
					});
					req.flash('loginMessage', 'Your password has been reset!');
					res.redirect('/login');
				}
			});
		});
	});

	// facebook -------------------------------

	// send to facebook to do the authentication
	app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/game',
			failureRedirect : '/'
		}));

	// twitter --------------------------------

	// send to twitter to do the authentication
	app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

	// handle the callback after twitter has authenticated the user
	app.get('/auth/twitter/callback',
		passport.authenticate('twitter', {
			successRedirect : '/game',
			failureRedirect : '/'
		}));


	// google ---------------------------------

	// send to google to do the authentication
	app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

	// the callback after google has authenticated the user
	app.get('/auth/google/callback',
		passport.authenticate('google', {
			successRedirect : '/game',
			failureRedirect : '/'
		}));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
	app.get('/connect/local', function(req, res) {
		res.render('connect-local.ejs', { message: req.flash('loginMessage') });
	});
	app.post('/connect/local', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// facebook -------------------------------

	// send to facebook to do the authentication
	app.get('/connect/facebook', passport.authorize('facebook', { scope : ['email'] }));

	// handle the callback after facebook has authorized the user
	app.get('/connect/facebook/callback',
		passport.authorize('facebook', {
			successRedirect : '/profile',
			failureRedirect : '/'
		}));

	// twitter --------------------------------

	// send to twitter to do the authentication
	app.get('/connect/twitter', passport.authorize('twitter', { scope : ['email'] }));

	// handle the callback after twitter has authorized the user
	app.get('/connect/twitter/callback',
		passport.authorize('twitter', {
			successRedirect : '/profile',
			failureRedirect : '/'
		}));


	// google ---------------------------------

	// send to google to do the authentication
	app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

	// the callback after google has authorized the user
	app.get('/connect/google/callback',
		passport.authorize('google', {
			successRedirect : '/profile',
			failureRedirect : '/'
		}));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// facebook -------------------------------
	app.get('/unlink/facebook', function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// twitter --------------------------------
	app.get('/unlink/twitter', function(req, res) {
		var user           = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// google ---------------------------------
	app.get('/unlink/google', function(req, res) {
		var user          = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

function hasUsername(req, res, next) {
	if(req.user.username) {
		return next();
	}
	res.redirect('/username');
}
