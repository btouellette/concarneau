// server.js

//TODO: consider setting up logging via winston (https://github.com/flatiron/winston)

// set up ======================================================================
// if we're behind an http proxy set up all requests to go through it
if(process.env.HTTP_PROXY) {
	var parsedURL = require('url').parse(process.env.HTTP_PROXY);
	var host = parsedURL && parsedURL.hostname ? parsedURL.hostname : '127.0.0.1';
	var port = parsedURL && parsedURL.port ? parseInt(parsedURL.port, 10) : 8080;
	require('./config/proxy')(host, port);
}

// if this is a c9 project configure appropriately
if(process.env.C9_PROJECT) {
    require('./config/c9');
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
	url: configDB.url
});

mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(express.logger('dev')); // log every request to the console
app.use(express.compress());
app.use(express.cookieParser()); // read cookies (needed for auth)
app.use(express.json());
app.use(express.urlencoded()); // get information from html forms
//TODO: consider using static cache (https://github.com/isaacs/st)
app.use('/images', express.static(__dirname + '/images', { maxAge: 31557600000 /* one year caching */ }));

app.set('view engine', 'ejs'); // set up ejs for templating

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