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
    doublePoints: Boolean,
    imageURL: String,
    expansion: String,
    count: Number,
    startingTile: Boolean
});

tileSchema.statics.loadTiles = function() {
	var Tile = this;
	Tile.remove({}, function() {
		// Load all the base game tiles into the database
		Tile.create({
			northEdge: 'city', // edges are 'road', 'city', or 'field'
			southEdge: 'field',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W E'] }], // features are arrays of directions, example of curved road or triangle city ['S','W']
			cities: [{ directions: ['N'] }],
			farms: [{ directions: ['WNW ENE', 'WSW SSW SSE ESE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RCr.jpg',
			expansion: 'base-game',
			count: 4,
			startingTile: true
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N'] }],
			farms: [{ directions: ['WNW WSW SSW SSE ESE ENE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/C.jpg',
			expansion: 'base-game',
			count: 5,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N', 'W'] }],
			farms: [{ directions: ['SSW SSE ESE ENE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CC.2.jpg',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'city',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N', 'S'] }],
			farms: [{ directions: ['WNW WSW ENE ESE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CFC.2.jpg',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['W E'] }],
			farms: [{ directions: ['NNW NNE','SSW SSE'] }],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/CFc+.jpg',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['W E'] }],
			farms: [{ directions: ['NNW NNE','SSW SSE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CFc.1.jpg',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W','S','E'] }],
			cities: [{ directions: ['N'] }],
			farms: [{ directions: ['WNW ENE','WSW SSW', 'SSE ESE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CRRR.jpg',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'field',
			eastEdge: 'road',
			roads: [{ directions: ['S E'] }],
			cities: [{ directions: ['N'] }],
			farms: [{ directions: ['WNW WSW SSW ENE','SSE ESE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CRr.jpg',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N W'] }],
			farms: [{ directions: ['SSW SSE ESE ENE'] }],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/Cc+.jpg',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N W'] }],
			farms: [{ directions: ['SSW SSE ESE ENE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/Cc.1.jpg',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'road',
			roads: [{ directions: ['S E'] }],
			cities: [{ directions: ['N W'] }],
			farms: [{ directions: ['SSW ENE', 'SSE ESE'] }],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/CcRr+.jpg',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'road',
			roads: [{ directions: ['S E'] }],
			cities: [{ directions: ['N W'] }],
			farms: [{ directions: ['SSW ENE', 'SSE ESE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CcRr.jpg',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N E W'] }],
			farms: [{ directions: ['SSW SSE'] }],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/Ccc+.jpg',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N E W'] }],
			farms: [{ directions: ['SSW SSE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/Ccc.jpg',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [{ directions: ['S'] }],
			cities: [{ directions: ['N E W'] }],
			farms: [{ directions: ['SSW', 'SSE'] }],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/CccR+.jpg',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [{ directions: ['S'] }],
			cities: [{ directions: ['N E W'] }],
			farms: [{ directions: ['SSW', 'SSE'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CccR.jpg',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'city',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N E S W'] }],
			farms: [],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/Cccc+.jpg',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [],
			cities: [],
			farms: [{ directions: ['NNW NNE ENE ESE SSE SSW WSW WNW'] }],
			cloister: true,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/L.jpg',
			expansion: 'base-game',
			count: 4,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'road',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [{ directions: ['S'] }],
			cities: [],
			farms: [{ directions: ['NNW NNE ENE ESE SSE SSW WSW WNW'] }],
			cloister: true,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/LR.jpg',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['E W'] }],
			cities: [],
			farms: [{ directions: ['WNW NNW NNE ENE', 'ESE SSE SSW WSW'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RFr.jpg',
			expansion: 'base-game',
			count: 8,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['E', 'S', 'W'] }],
			cities: [],
			farms: [{ directions: ['WNW NNW NNE ENE', 'ESE SSE', 'SSW WSW'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RRR.jpg',
			expansion: 'base-game',
			count: 4,
			startingTile: false
		},{
			northEdge: 'road',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['N', 'E', 'S', 'W'] }],
			cities: [],
			farms: [{ directions: ['WNW NNW', 'NNE ENE', 'ESE SSE', 'SSW WSW'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RRRR.jpg',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'field',
			roads: [{ directions: ['W S'] }],
			cities: [],
			farms: [{ directions: ['WNW NNW NNE ENE ESE SSE', 'SSW WSW'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/Rr.jpg',
			expansion: 'base-game',
			count: 9,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'field',
			roads: [{ directions: ['W S'] }],
			cities: [{ directions: ['N'] }],
			farms: [{ directions: ['WNW ENE ESE SSE', 'SSW WSW'] }],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RrC.jpg',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		}, function(err) { if(err) { console.log('load tiles err: ' + err); } });
	});
};

// create the model for game information and expose it to our app
module.exports = mongoose.model('Tile', tileSchema);