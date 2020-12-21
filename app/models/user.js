// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

//TODO: if linked to fb/twitter/google find friends by contacts

// define the schema for our user model
var userSchema = mongoose.Schema({
    local: {
        email: String,
        password: String,
        passwordResetToken: String,
        passwordResetExpiration: Date
    },
    facebook: {
        id: String,
        token: String,
        email: String,
        name: String
    },
    twitter: {
        id: String,
        token: String,
        displayName: String,
        username: String
    },
    google: {
        id: String,
        token: String,
        email: String,
        name: String
    },
    activeGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gamestate' }], // external reference to gamestate objects
    friends: [mongoose.Schema.Types.ObjectId],
    username: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    email_notifications: Boolean,
    twitter_notifications: Boolean,
    sound_notifications: Boolean,
    collapsible_menu: Boolean,
    dark_mode: Boolean,
    preferred_color: String
});

// generating a hash
userSchema.statics.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
