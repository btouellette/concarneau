// load the things we need
var mongoose = require('mongoose');

// Tile features are defined in terms of the cardinal directions they use
// Roads and cities potentially connect cardinal directions (N S E W)
// Fields potentially connect secondary-intercardinal directions (NNW NNE ENE ESE SSE SSW WSW WNW)

// NW NNW N NNE NE
// WNW         ENE
// W      *      E
// WSW         ESE
// SW SSW S SSE SE

// define the schema for our game model
var gamestateSchema = mongoose.Schema({
    name: String,
    players: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        points: Number,
        remainingMeeples: Number,
        active: Boolean
    }],
    unusedTiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tile' }],
    activeTile: {
        tile: { type: mongoose.Schema.Types.ObjectId, ref: 'Tile' },
        rotation: Number // number of times tile is rotated clockwise
    },
    placedTiles: [{
        tile: { type: mongoose.Schema.Types.ObjectId, ref: 'Tile' },
        rotation: Number, // number of times tile is rotated clockwise
        meeples: [{
            player: mongoose.Schema.Types.ObjectId, // references players
            placement: {
                locationType: String, // 'road', 'city', 'farm', or 'cloister'
                index: Number // which element of tiles[].roads/cities/farms (external schema)
            }
        }],
        northTile: mongoose.Schema.Types.ObjectId, // references placedTiles
        southTile: mongoose.Schema.Types.ObjectId,
        westTile: mongoose.Schema.Types.ObjectId,
        eastTile: mongoose.Schema.Types.ObjectId
    }]
});

// create the model for game information and expose it to our app
module.exports = mongoose.model('Gamestate', gamestateSchema);