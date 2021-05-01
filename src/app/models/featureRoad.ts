/* jslint smarttabs:true */
// load the things we need
import mongoose, { Document } from "mongoose";

export type FeatureRoad = {
  points: number;
  tilesWithMeeples: [{
    placedTileIndex: number;
    meepleIndex: number;
  }];
  complete: boolean;
  inn: boolean;
} & Document;

var featureSchema = new mongoose.Schema<FeatureRoad>({
  points: Number,
  tilesWithMeeples: [{
    placedTileIndex: Number,
    meepleIndex: Number
  }],
  complete: Boolean,
  inn: Boolean,
});

// create the model for features and expose it to our app
export const FeatureRoadModel = mongoose.model<FeatureRoad>('Feature - Road', featureSchema);
