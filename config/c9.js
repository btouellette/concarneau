var argv = require('yargs').argv;

process.env.FACEBOOK_SECRET = argv.FACEBOOK_SECRET;
process.env.TWITTER_SECRET = argv.TWITTER_SECRET;
process.env.TWITTER_ACCESS_SECRET = argv.TWITTER_ACCESS_SECRET;
process.env.GOOGLE_SECRET = argv.GOOGLE_SECRET;
process.env.EMAIL_PASSWORD = argv.EMAIL_PASSWORD;

process.env.FACEBOOK_CALLBACK = 'https://concarneau-c9-btouellette.c9.io/auth/facebook/callback';
process.env.TWITTER_CALLBACK = 'https://concarneau-c9-btouellette.c9.io/auth/twitter/callback';
process.env.GOOGLE_CALLBACK = 'https://concarneau-c9-btouellette.c9.io/auth/google/callback';

process.env.MONGO_URI = 'mongodb://' + process.env.IP + '/concarneau_db';

process.env.SOCKET_URL = 'https://concarneau-c9-btouellette.c9.io';
