/* jslint smarttabs:true */
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
    roads: [{ directions: [String], meepleOffset: { x: Number, y: Number }}], // features are arrays of directions, example of curved road or triangle city ['S','W']
    cities: [{ directions: [String], meepleOffset: { x: Number, y: Number }}],
    farms: [{ directions: [String], meepleOffset: { x: Number, y: Number }, adjacentCityIndices: [Number]}],
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
			roads: [{ directions: ['W','E'], meepleOffset: { x: 1/2, y: 1/2 }}], // features are arrays of directions, example of curved road or triangle city ['S','W']
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }}],
			farms: [{ directions: ['WNW','ENE'], meepleOffset: { x: 1/8, y: 5/16 }, adjacentCityIndices: [0]},
			        { directions: ['WSW','SSW','SSE','ESE'], meepleOffset: { x: 1/2, y: 3/4 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RCr.png',
			expansion: 'base-game',
			count: 4,
			startingTile: true
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }}],
			farms: [{ directions: ['WNW','WSW','SSW','SSE','ESE','ENE'], meepleOffset: { x: 1/2, y: 5/8 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/C.png',
			expansion: 'base-game',
			count: 5,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }},
			         { directions: ['W'], meepleOffset: { x: 1/16, y: 1/2 }}],
			farms: [{ directions: ['SSW','SSE','ESE','ENE'], meepleOffset: { x: 5/8, y: 5/8 }, adjacentCityIndices: [0, 1]}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CC.2.png',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'city',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }},
			         { directions: ['S'], meepleOffset: { x: 1/2, y: 7/8 }}],
			farms: [{ directions: ['WNW','WSW','ENE','ESE'], meepleOffset: { x: 1/4, y: 1/2 }, adjacentCityIndices: [0, 1]}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CFC.2.png',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['W','E'], meepleOffset: { x: 1/2, y: 7/16 }}],
			farms: [{ directions: ['NNW','NNE'], meepleOffset: { x: 1/2, y: 1/16 }, adjacentCityIndices: [0]},
			        { directions: ['SSW','SSE'], meepleOffset: { x: 1/2, y: 7/8 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/CFc+.png',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['W','E'], meepleOffset: { x: 1/2, y: 7/16 }}],
			farms: [{ directions: ['NNW','NNE'], meepleOffset: { x: 1/2, y: 1/16 }, adjacentCityIndices: [0]},
			        { directions: ['SSW','SSE'], meepleOffset: { x: 1/2, y: 7/8 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CFc.1.png',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W'], meepleOffset: { x: 1/4, y: 9/16 }},
			        { directions: ['S'], meepleOffset: { x: 1/2, y: 7/8 }},
			        { directions: ['E'], meepleOffset: { x: 7/8, y: 9/16 }}],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }}],
			farms: [{ directions: ['WNW','ENE'], meepleOffset: { x: 1/8, y: 5/16 }, adjacentCityIndices: [0]},
			        { directions: ['WSW','SSW'], meepleOffset: { x: 3/16, y: 13/16 }},
			        { directions: ['SSE','ESE'], meepleOffset: { x: 13/16, y: 13/16 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CRRR.png',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'field',
			eastEdge: 'road',
			roads: [{ directions: ['S','E'], meepleOffset: { x: 5/8, y: 5/8 }}],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }}],
			farms: [{ directions: ['WNW','WSW','SSW','ENE'], meepleOffset: { x: 1/4, y: 5/8 }, adjacentCityIndices: [0]},
			        { directions: ['SSE','ESE'], meepleOffset: { x: 13/16, y: 13/16 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CRr.png',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N','W'], meepleOffset: { x: 1/4, y: 1/4 }}],
			farms: [{ directions: ['SSW','SSE','ESE','ENE'], meepleOffset: { x: 11/16, y: 11/16 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/Cc+.png',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N','W'], meepleOffset: { x: 3/16, y: 3/16 }}],
			farms: [{ directions: ['SSW','SSE','ESE','ENE'], meepleOffset: { x: 11/16, y: 11/16 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/Cc.1.png',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'road',
			roads: [{ directions: ['S','E'], meepleOffset: { x: 3/4, y: 11/16 }}],
			cities: [{ directions: ['N','W'], meepleOffset: { x: 1/4, y: 1/4 }}],
			farms: [{ directions: ['SSW','ENE'], meepleOffset: { x: 9/16, y: 9/16 }, adjacentCityIndices: [0]},
			        { directions: ['SSE','ESE'], meepleOffset: { x: 7/8, y: 7/8 }}],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/CcRr+.png',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'road',
			roads: [{ directions: ['S','E'], meepleOffset: { x: 3/4, y: 11/16 }}],
			cities: [{ directions: ['N','W'], meepleOffset: { x: 1/4, y: 1/4 }}],
			farms: [{ directions: ['SSW','ENE'], meepleOffset: { x: 9/16, y: 9/16 }, adjacentCityIndices: [0]},
			        { directions: ['SSE','ESE'], meepleOffset: { x: 7/8, y: 7/8 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CcRr.png',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N','E','W'], meepleOffset: { x: 1/2, y: 3/8 }}],
			farms: [{ directions: ['SSW','SSE'], meepleOffset: { x: 1/2, y: 7/8 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/Ccc+.png',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N','E','W'], meepleOffset: { x: 1/2, y: 3/8 }}],
			farms: [{ directions: ['SSW','SSE'], meepleOffset: { x: 1/2, y: 7/8 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/Ccc.png',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [{ directions: ['S'], meepleOffset: { x: 1/2, y: 7/8 }}],
			cities: [{ directions: ['N','E','W'], meepleOffset: { x: 1/2, y: 3/8 }}],
			farms: [{ directions: ['SSW'], meepleOffset: { x: 5/16, y: 7/8 }, adjacentCityIndices: [0]},
			        { directions: ['SSE'], meepleOffset: { x: 3/4, y: 7/8 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/CccR+.png',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [{ directions: ['S'], meepleOffset: { x: 1/2, y: 7/8 }}],
			cities: [{ directions: ['N','E','W'], meepleOffset: { x: 1/2, y: 3/8 }}],
			farms: [{ directions: ['SSW'], meepleOffset: { x: 5/16, y: 7/8 }, adjacentCityIndices: [0]},
			        { directions: ['SSE'], meepleOffset: { x: 3/4, y: 7/8 }, adjacentCityIndices: [0]}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/CccR.png',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'city',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N','E','S','W'], meepleOffset: { x: 1/2, y: 1/2 }}],
			farms: [],
			cloister: false,
			doublePoints: true,
			imageURL: '/images/tiles/base-game/Cccc+.png',
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
			farms: [{ directions: ['NNW','NNE','ENE','ESE','SSE','SSW','WSW','WNW'], meepleOffset: { x: 13/16, y: 13/16 }}],
			cloister: true,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/L.png',
			expansion: 'base-game',
			count: 4,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'road',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [{ directions: ['S'], meepleOffset: { x: 1/2, y: 7/8 }}],
			cities: [],
			farms: [{ directions: ['NNW','NNE','ENE','ESE','SSE','SSW','WSW','WNW'], meepleOffset: { x: 13/16, y: 13/16 }}],
			cloister: true,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/LR.png',
			expansion: 'base-game',
			count: 2,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['E','W'], meepleOffset: { x: 1/2, y: 9/16 }}],
			cities: [],
			farms: [{ directions: ['WNW','NNW','NNE','ENE'], meepleOffset: { x: 1/4, y: 1/4 }},
			        { directions: ['ESE','SSE','SSW','WSW'], meepleOffset: { x: 3/4, y: 3/4 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RFr.png',
			expansion: 'base-game',
			count: 8,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['E'], meepleOffset: { x: 7/8, y: 1/2 }},
			        { directions: ['S'], meepleOffset: { x: 1/2, y: 13/16 }},
			        { directions: ['W'], meepleOffset: { x: 1/8, y: 1/2 }}],
			cities: [],
			farms: [{ directions: ['WNW','NNW','NNE','ENE'], meepleOffset: { x: 1/4, y: 1/4 }},
			        { directions: ['ESE','SSE'], meepleOffset: { x: 3/4, y: 3/4 }},
			        { directions: ['SSW','WSW'], meepleOffset: { x: 1/4, y: 3/4 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RRR.png',
			expansion: 'base-game',
			count: 4,
			startingTile: false
		},{
			northEdge: 'road',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['N'], meepleOffset: { x: 9/16, y: 3/16 }},
			        { directions: ['E'], meepleOffset: { x: 13/16, y: 9/16 }},
			        { directions: ['S'], meepleOffset: { x: 1/2, y: 13/16 }},
			        { directions: ['W'], meepleOffset: { x: 3/16, y: 1/2 }}],
			cities: [],
			farms: [{ directions: ['WNW','NNW'], meepleOffset: { x: 3/16, y: 3/16 }},
			        { directions: ['NNE','ENE'], meepleOffset: { x: 13/16, y: 3/16 }},
			        { directions: ['ESE','SSE'], meepleOffset: { x: 13/16, y: 13/16 }},
			        { directions: ['SSW','WSW'], meepleOffset: { x: 3/16, y: 13/16 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RRRR.png',
			expansion: 'base-game',
			count: 1,
			startingTile: false
		},{
			northEdge: 'field',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'field',
			roads: [{ directions: ['W','S'], meepleOffset: { x: 1/2, y: 9/16 }}],
			cities: [],
			farms: [{ directions: ['WNW','NNW','NNE','ENE','ESE','SSE'], meepleOffset: { x: 3/4, y: 1/4 }},
			        { directions: ['SSW','WSW'], meepleOffset: { x: 1/4, y: 3/4 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/Rr.png',
			expansion: 'base-game',
			count: 9,
			startingTile: false
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'field',
			roads: [{ directions: ['W','S'], meepleOffset: { x: 7/16, y: 11/16 }}],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }}],
			farms: [{ directions: ['WNW','ENE','ESE','SSE'], meepleOffset: { x: 3/4, y: 1/2 }, adjacentCityIndices: [0]},
			        { directions: ['SSW','WSW'], meepleOffset: { x: 1/4, y: 3/4 }}],
			cloister: false,
			doublePoints: false,
			imageURL: '/images/tiles/base-game/RrC.png',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		}, function(err) { if(err) { console.log('load tiles err: ' + err); } });
	});
};

// create the model for game information and expose it to our app
module.exports = mongoose.model('Tile', tileSchema);