// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

	'facebookAuth' : {
		'clientID' 		: '1388988078028764', // your App ID
		'clientSecret' 	: process.env.FACEBOOK_SECRET, // your App Secret
		'callbackURL' 	: 'http://localhost:' + (process.env.PORT || 8080) + '/auth/facebook/callback'
	},

	'twitterAuth' : {
		'consumerKey' 		: '0P6wn4IB9MQSSt5eaF3eDxj1v',
		'consumerSecret' 	: process.env.TWITTER_SECRET,
		'callbackURL' 		: 'http://localhost:' + (process.env.PORT || 8080) + '/auth/twitter/callback'
	},

	'googleAuth' : {
		'clientID' 		: '859053446273-1e5ln4ca5gco80tl88a0kefj35id3eik.apps.googleusercontent.com',
		'clientSecret' 	: process.env.GOOGLE_SECRET,
		'callbackURL' 	: 'http://localhost:' + (process.env.PORT || 8080) + '/auth/google/callback'
	}

};