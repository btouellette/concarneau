/* jslint smarttabs:true */
// load the things we need
import mongoose, { Document } from "mongoose";

export type FeatureCity = {
  points: number;
  tilesWithMeeples: [{
    placedTileIndex: number;
    meepleIndex: number;
  }];
  complete: boolean;
  inn: boolean;
} & Document;

var featureSchema = new mongoose.Schema<FeatureCity>({
  points: Number,
  tilesWithMeeples: [{
    placedTileIndex: Number,
    meepleIndex: Number
  }],
  complete: Boolean,
  goods: [{
    fabric: Number,
    wine: Number,
    wheat: Number
  }],
  cathedral: Boolean,
});

// create the model for features and expose it to our app
export const FeatureCityModel = mongoose.model<FeatureCity>('Feature - City', featureSchema);
