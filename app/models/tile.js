/* jslint smarttabs:true */
// load the things we need
var mongoose = require('mongoose');

// tile features are defined in terms of the cardinal directions they use
// roads and cities potentially connect cardinal directions (N S E W)
// fields potentially connect secondary-intercardinal directions (NNW NNE ENE ESE SSE SSW WSW WNW)

// NW NNW N NNE NE
// WNW         ENE
// W      *      E
// WSW         ESE
// SW SSW S SSE SE

// tile images are created in GIMP with settings:
// rounded rectangle 7px
// unsharp mask 100 0.6 0
// hue/lightness/saturation -> master -> 0 -30 10
// hue/lightness/saturation -> magenta -> 0 0 -100
// shrink selection 1 pixel
// stroke selection 1 pixel black rounded edges
// add tile_overlay.xcf

// define the schema for our game model
var tileSchema = mongoose.Schema({
    northEdge: String, // edges are 'road', 'city', or 'field'
    southEdge: String,
    westEdge: String,
    eastEdge: String,
    roads: [{ directions: [String], meepleOffset: { x: Number, y: Number }, inn: Boolean }], // features are arrays of directions, example of curved road or triangle city ['S','W']
    cities: [{ directions: [String], meepleOffset: { x: Number, y: Number }}],
    farms: [{ directions: [String], meepleOffset: { x: Number, y: Number }, adjacentCityIndices: [Number]}],
    cloister: Boolean,
    doublePoints: mongoose.Schema.Types.Mixed, // true if all cities are double points, false if none, if only one city is double this will be the index of the double city
    cathedral: Boolean,
    imageURL: String,
    expansion: String,
    count: Number,
    startingTile: Boolean
});

tileSchema.statics.loadTilesBase = function() {
	var Tile = this;
	Tile.remove({ expansion: 'base-game' }, function() {
		// Load all the base game tiles into the database
		Tile.create({
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W','E'], meepleOffset: { x: 1/2, y: 1/2 }}],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }}],
			farms: [{ directions: ['WNW','ENE'], meepleOffset: { x: 1/8, y: 5/16 }, adjacentCityIndices: [0]},
			        { directions: ['WSW','SSW','SSE','ESE'], meepleOffset: { x: 1/2, y: 3/4 }}],
			cloister: false,
			doublePoints: false, 
			imageURL: '/content/images/tiles/base-game/RCr.png',
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
			imageURL: '/content/images/tiles/base-game/C.png',
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
			imageURL: '/content/images/tiles/base-game/CC.2.png',
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
			imageURL: '/content/images/tiles/base-game/CFC.2.png',
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
			imageURL: '/content/images/tiles/base-game/CFc+.png',
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
			imageURL: '/content/images/tiles/base-game/CFc.1.png',
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
			imageURL: '/content/images/tiles/base-game/CRRR.png',
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
			imageURL: '/content/images/tiles/base-game/CRr.png',
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
			imageURL: '/content/images/tiles/base-game/Cc+.png',
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
			imageURL: '/content/images/tiles/base-game/Cc.1.png',
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
			imageURL: '/content/images/tiles/base-game/CcRr+.png',
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
			imageURL: '/content/images/tiles/base-game/CcRr.png',
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
			imageURL: '/content/images/tiles/base-game/Ccc+.png',
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
			imageURL: '/content/images/tiles/base-game/Ccc.png',
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
			imageURL: '/content/images/tiles/base-game/CccR+.png',
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
			imageURL: '/content/images/tiles/base-game/CccR.png',
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
			imageURL: '/content/images/tiles/base-game/Cccc+.png',
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
			imageURL: '/content/images/tiles/base-game/L.png',
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
			imageURL: '/content/images/tiles/base-game/LR.png',
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
			imageURL: '/content/images/tiles/base-game/RFr.png',
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
			imageURL: '/content/images/tiles/base-game/RRR.png',
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
			imageURL: '/content/images/tiles/base-game/RRRR.png',
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
			imageURL: '/content/images/tiles/base-game/Rr.png',
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
			imageURL: '/content/images/tiles/base-game/RrC.png',
			expansion: 'base-game',
			count: 3,
			startingTile: false
		}, function(err) { if(err) { console.log('load tiles err: ' + err); } });
	});
};

tileSchema.statics.loadTilesIAC = function() {
	var Tile = this;
	Tile.remove({ expansion: 'inns-and-cathedrals' }, function() {
		// Load all the tiles for the Inns and Cathedrals expansion into the database
		Tile.create({
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/4, y: 9/16 }}],
			farms: [{ directions: ['WNW','WSW','SSW','SSE'], meepleOffset: { x: 3/16, y: 3/4 }, adjacentCityIndices: [0]},
			        { directions: ['ENE','ESE'], meepleOffset: { x: 15/16, y: 1/2 }, adjacentCityIndices: [0]}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/C!.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/16 }},
			         { directions: ['W'], meepleOffset: { x: 1/8, y: 1/2 }},
			         { directions: ['E'], meepleOffset: { x: 7/8, y: 1/2 }}],
			farms: [{ directions: ['SSW','SSE'], meepleOffset: { x: 1/2, y: 1/2 }, adjacentCityIndices: [0, 1, 2]}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/CCC.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'city',
			westEdge: 'city',
			eastEdge: 'field',
			roads: [],
			cities: [{ directions: ['N','W'], meepleOffset: { x: 3/16, y: 3/16 }},
			         { directions: ['S'], meepleOffset: { x: 1/2, y: 15/16 }}],
			farms: [{ directions: ['ENE','ESE'], meepleOffset: { x: 3/4, y: 1/2 }, adjacentCityIndices: [0, 1]}],
			doublePoints: 0,
			imageURL: '/content/images/tiles/inns-and-cathedrals/CCc+.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'city',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N','E','S','W'], meepleOffset: { x: 1/2, y: 1/2 }}],
			farms: [],
			cathedral: true,
			imageURL: '/content/images/tiles/inns-and-cathedrals/Cccc.c.png',
			expansion: 'inns-and-cathedrals',
			count: 2
		},{
			northEdge: 'city',
			southEdge: 'city',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/16 }},
			         { directions: ['W'], meepleOffset: { x: 1/8, y: 1/2 }},
			         { directions: ['S'], meepleOffset: { x: 1/2, y: 15/16 }},
			         { directions: ['E'], meepleOffset: { x: 7/8, y: 1/2 }}],
			farms: [{ directions: [], meepleOffset: { x: 1/2, y: 1/2 }, adjacentCityIndices: [0, 1, 2, 3]}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/CCCC.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'field',
			westEdge: 'city',
			eastEdge: 'road',
			roads: [{ directions: ['E'], meepleOffset: { x: 3/4, y: 9/16 }}],
			cities: [{ directions: ['N', 'W'], meepleOffset: { x: 1/4, y: 1/4 }}],
			farms: [{ directions: ['ENE'], meepleOffset: { x: 1/2, y: 1/2 }, adjacentCityIndices: [0]},
			        { directions: ['SSW','SSE','ESE'], meepleOffset: { x: 1/2, y: 1/2 }, adjacentCityIndices: [0]}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/CcR.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'road',
			roads: [{ directions: ['S','E'], meepleOffset: { x: 3/4, y: 3/4 }, inn: true }],
			cities: [{ directions: ['N', 'W'], meepleOffset: { x: 1/4, y: 1/4 }}],
			farms: [{ directions: ['ENE','SSW'], meepleOffset: { x: 3/8, y: 3/4 }, adjacentCityIndices: [0]},
			        { directions: ['SSE','ESE'], meepleOffset: { x: 7/8, y: 7/8 }}],
		    doublePoints: true,
			imageURL: '/content/images/tiles/inns-and-cathedrals/CcRr+.i.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'field',
			eastEdge: 'field',
			roads: [{ directions: ['S'], meepleOffset: { x: 1/2, y: 5/8 }}],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }}],
			farms: [{ directions: ['ENE','ESE','SSE'], meepleOffset: { x: 3/8, y: 3/4 }, adjacentCityIndices: [0]},
			        { directions: ['WNW','WSW','SSW'], meepleOffset: { x: 7/8, y: 7/8 }, adjacentCityIndices: [0]}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/CFR.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'city',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W'], meepleOffset: { x: 3/8, y: 1/2 }},
			        { directions: ['E'], meepleOffset: { x: 7/8, y: 1/2 }}],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }},
			         { directions: ['S'], meepleOffset: { x: 1/2, y: 7/8 }}],
			farms: [{ directions: ['WNW'], meepleOffset: { x: 3/16, y: 5/16 }, adjacentCityIndices: [0]},
			        { directions: ['ENE'], meepleOffset: { x: 7/8, y: 5/16 }, adjacentCityIndices: [0]},
			        { directions: ['WSW'], meepleOffset: { x: 1/8, y: 11/16 }, adjacentCityIndices: [1]},
			        { directions: ['ESE'], meepleOffset: { x: 7/8, y: 11/16 }, adjacentCityIndices: [1]}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/CRCR.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'road',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'city',
			roads: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/16 }},
			        { directions: ['S'], meepleOffset: { x: 7/16, y: 15/16 }}],
			cities: [{ directions: ['W','E'], meepleOffset: { x: 1/2, y: 1/2 }}],
			farms: [{ directions: ['NNE'], meepleOffset: { x: 3/4, y: 1/16 }, adjacentCityIndices: [0]},
			        { directions: ['NNW'], meepleOffset: { x: 5/16, y: 1/16 }, adjacentCityIndices: [0]},
			        { directions: ['SSE'], meepleOffset: { x: 3/4, y: 7/8 }, adjacentCityIndices: [0]},
			        { directions: ['SSW'], meepleOffset: { x: 1/4, y: 15/16 }, adjacentCityIndices: [0]}],
		    doublePoints: true,
			imageURL: '/content/images/tiles/inns-and-cathedrals/CRcR+.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W'], meepleOffset: { x: 1/8, y: 9/16 }},
			        { directions: ['E'], meepleOffset: { x: 7/8, y: 7/16 }}],
			cities: [],
			farms: [{ directions: ['WNW','NNW','NNE','ENE'], meepleOffset: { x: 3/4, y: 3/16 }},
			        { directions: ['WSW','SSW','SSE','ESE'], meepleOffset: { x: 3/4, y: 13/16 }}],
		    cloister: true,
			imageURL: '/content/images/tiles/inns-and-cathedrals/LRFR.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'city',
			eastEdge: 'field',
			roads: [{ directions: ['S'], meepleOffset: { x: 1/2, y: 3/4 }, inn: true }],
			cities: [{ directions: ['W','N'], meepleOffset: { x: 1/4, y: 1/4 }}],
			farms: [{ directions: ['SSW'], meepleOffset: { x: 5/16, y: 7/8 }, adjacentCityIndices: [0]},
			        { directions: ['SSE','ESE','ENE'], meepleOffset: { x: 11/16, y: 7/8 }, adjacentCityIndices: [0]}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/RCc.i.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'field',
			southEdge: 'field',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W','E'], meepleOffset: { x: 1/2, y: 1/2 }, inn: true }],
			cities: [],
			farms: [{ directions: ['WNW','NNW','NNE','ENE'], meepleOffset: { x: 13/16, y: 3/16 }},
			        { directions: ['WSW','SSW','SSE','ESE'], meepleOffset: { x: 1/2, y: 3/4 }}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/RFr.i.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'field',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'field',
			roads: [{ directions: ['W','S'], meepleOffset: { x: 1/4, y: 1/2 }, inn: true }],
			cities: [],
			farms: [{ directions: ['WNW','NNW','NNE','ENE','ESE','SSE'], meepleOffset: { x: 1/4, y: 1/4 }},
			        { directions: ['WSW','SSW'], meepleOffset: { x: 1/2, y: 3/4 }}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/Rr.i.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'city',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'field',
			roads: [{ directions: ['W','S'], meepleOffset: { x: 1/4, y: 1/2 }, inn: true }],
			cities: [{ directions: ['N'], meepleOffset: { x: 1/2, y: 1/8 }}],
			farms: [{ directions: ['WNW','ENE','ESE','SSE'], meepleOffset: { x: 3/16, y: 5/16 }, adjacentCityIndices: [0]},
			        { directions: ['WSW','SSW'], meepleOffset: { x: 3/16, y: 3/4 }}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/RrC.i.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'field',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W'], meepleOffset: { x: 1/4, y: 9/16 }},
			        { directions: ['S'], meepleOffset: { x: 1/2, y: 7/8 }},
			        { directions: ['E'], meepleOffset: { x: 13/16, y: 5/8 }, inn: true }],
			cities: [],
			farms: [{ directions: ['WNW','NNW','NNE','ENE'], meepleOffset: { x: 1/4, y: 1/4 }},
			        { directions: ['WSW','SSW'], meepleOffset: { x: 1/4, y: 3/4 }},
			        { directions: ['ESE','SSE'], meepleOffset: { x: 13/16, y: 13/16 }}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/RRR.i.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		},{
			northEdge: 'road',
			southEdge: 'road',
			westEdge: 'road',
			eastEdge: 'road',
			roads: [{ directions: ['W','N'], meepleOffset: { x: 1/4, y: 1/4 }},
			        { directions: ['S','E'], meepleOffset: { x: 3/4, y: 3/4 }}],
			cities: [],
			farms: [{ directions: ['WNW','NNW'], meepleOffset: { x: 1/4, y: 1/4 }},
			        { directions: ['WSW','SSW','NNE','ENE'], meepleOffset: { x: 1/4, y: 3/4 }},
			        { directions: ['ESE','SSE'], meepleOffset: { x: 7/8, y: 7/8 }}],
			imageURL: '/content/images/tiles/inns-and-cathedrals/RrRr.png',
			expansion: 'inns-and-cathedrals',
			count: 1
		}, function(err) { if(err) { console.log('load tiles err: ' + err); } });
	});
};

// create the model for game information and expose it to our app
module.exports = mongoose.model('Tile', tileSchema);