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
var tileSchema = mongoose.Schema({
    northEdge: String, // edges are 'road', 'city', or 'field'
    southEdge: String, 
    westEdge: String, 
    eastEdge: String, 
    roads: [{ directions: [String] }], // features are arrays of directions, example of curved road or triangle city ['S','W']
    cities: [{ directions: [String] }],
    farms: [{ directions: [String] }],
    cloister: Boolean,
    imageURL: String
});

// create the model for game information and expose it to our app
module.exports = mongoose.model('Tile', tileSchema);