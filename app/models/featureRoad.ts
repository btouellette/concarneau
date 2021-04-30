/* jslint smarttabs:true */
// load the things we need
var mongoose = require('mongoose');

var featureSchema = mongoose.Schema({
  points: Number,
  tilesWithMeeples: [{
    placedTileIndex: Number,
    meepleIndex: Number
  }],
  complete: Boolean,
  inn: Boolean,
});

// create the model for features and expose it to our app
module.exports = mongoose.model('Feature - Road', featureSchema);
