// config/database.js
module.exports = {
	'url' : process.env.CONCARNEAU_MONGOLAB_URI || process.env.MONGOLAB_URI || 'mongodb://localhost/concarneau_db'
};