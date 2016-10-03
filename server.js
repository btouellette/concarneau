// server.js

//TODO: consider setting up logging via winston (https://github.com/flatiron/winston)

// set up ======================================================================

// if this is a c9 project using argv rather than environment variable run configurations configure appropriately
if(process.env.C9_PROJECT && !process.env.MONGOLAB_URI) {
    require('./config/c9');
}

// if configured to use nodetime, spm, or newrelic connect to it
if(process.env.NEW_RELIC_LICENSE_KEY) {
	require('newrelic');
}
if(process.env.SPM_TOKEN) {
	require ('spm-agent-nodejs');
}
if(process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'Concarneau'
  });
}

var port = process.env.PORT || 8080;

// if we're behind an http proxy set up all requests to go through it
if(process.env.HTTP_PROXY) {
	var parsedURL = require('url').parse(process.env.HTTP_PROXY);
	var host = parsedURL && parsedURL.hostname ? parsedURL.hostname : '127.0.0.1';
	port = parsedURL && parsedURL.port ? parseInt(parsedURL.port, 10) : 8080;
	require('./config/proxy')(host, port);
}

// get all the tools we need
var express      = require('express');
var app          = express();
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var compression  = require('compression');
var mongoose     = require('mongoose');
var passport     = require('passport');
var flash        = require('connect-flash');
var configDB     = require('./config/database');
var MongoStore   = require('connect-mongo')(session);

// add Sentry handler first if configured
if(process.env.SENTRY_DSN) {
	var raven = require('raven');
	var client = new raven.Client(process.env.SENTRY_DSN);
	client.patchGlobal();
	app.use(raven.middleware.express.requestHandler(process.env.SENTRY_DSN));
}

// configuration ===============================================================
//TODO: having issues if web connections come in before this is established
//      https://github.com/kcbanner/connect-mongo/issues/80
var sessionStore = new MongoStore({
	url: configDB.url,
	autoReconnect: true
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
} else {
	// temporary for C9 beta which does not correctly set the working directory TODO: remove once bug is fixed
	app.set('views', '/home/ubuntu/workspace/views');
}
app.use(compression());
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // get information from html forms
//TODO: consider using static cache (https://github.com/isaacs/st)
app.use('/content', express.static(__dirname + '/content', { maxAge: 604800000 /* one week caching */ }));

// required for passport
process.env.EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET || 'ilovescotchscotchyscotchscotch';
app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    cookie: { maxAge: 31536000 },
    key: 'express.sid',
    store: sessionStore
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// error handling ==============================================================
process.on('uncaughtException', function (err) {
  console.log(err);
});

// routes ======================================================================
require('./app/routes')(app, passport, client); // load our routes and pass in our app and fully configured passport

if(process.env.SENTRY_DSN) {
	app.use(raven.middleware.express.errorHandler(process.env.SENTRY_DSN));
	app.use(function onError(err, req, res, next) {
	    // The error id is attached to `res.sentry` to be returned
	    // and optionally displayed to the user for support.
	    res.statusCode = 500;
	    res.end(res.sentry+'\n');
	});
}

// launch ======================================================================
var server = app.listen(port);
console.log('Server listening on port ' + port);

require('./app/gameserver')(server, sessionStore);
