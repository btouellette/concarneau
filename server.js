// server.js

//TODO: consider setting up logging via winston (https://github.com/flatiron/winston)

// set up ======================================================================

// if this is a c9 project configure appropriately
if(process.env.C9_PROJECT) {
    require('./config/c9');
}

// if configured to use nodetime or newrelic connect to it
if(process.env.NEW_RELIC_LICENSE_KEY) {
	require('newrelic')
}
if(process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'Concarneau'
  });
}

// if we're behind an http proxy set up all requests to go through it
if(process.env.HTTP_PROXY) {
	var parsedURL = require('url').parse(process.env.HTTP_PROXY);
	var host = parsedURL && parsedURL.hostname ? parsedURL.hostname : '127.0.0.1';
	var port = parsedURL && parsedURL.port ? parseInt(parsedURL.port, 10) : 8080;
	require('./config/proxy')(host, port);
}

var port = process.env.PORT || 8080;

// get all the tools we need
var express    = require('express');
var app        = express();
var mongoose   = require('mongoose');
var passport   = require('passport');
var flash      = require('connect-flash');
var configDB   = require('./config/database');
var MongoStore = require('connect-mongo')(express);

// configuration ===============================================================
var sessionStore = new MongoStore({
	url: configDB.url,
	auto_reconnect: true
});

mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.set('view engine', 'ejs'); // set up ejs for templating
if(!process.env.C9_PROJECT) {
	// redirect to https if the request isn't secured
	app.set('trust proxy', true);
	app.use(function(req, res, next) {
		if(!req.secure) {
			return res.redirect('https://' + req.get('Host') + req.url);
		}
		next();
	});
}
//app.use(express.logger('dev')); // log every request to the console
app.use(express.compress());
app.use(express.cookieParser()); // read cookies (needed for auth)
app.use(express.json());
app.use(express.urlencoded()); // get information from html forms
//TODO: consider using static cache (https://github.com/isaacs/st)
app.use('/content', express.static(__dirname + '/content', { maxAge: 604800000 /* one week caching */ }));

// required for passport
process.env.EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET || 'ilovescotchscotchyscotchscotch';
app.use(express.session({ secret: process.env.EXPRESS_SESSION_SECRET, key: 'express.sid', store: sessionStore })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes')(app, passport, mongoose); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
var server = app.listen(port);
console.log('Server listening on port ' + port);

require('./app/gameserver')(server, sessionStore);