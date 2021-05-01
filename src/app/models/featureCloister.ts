/* jslint smarttabs:true */
// load the things we need
import mongoose, { Document } from "mongoose";

export type FeatureCloister = {
  points: number;
  tilesWithMeeples: [{
    placedTileIndex: number;
    meepleIndex: number;
  }];
  complete: boolean;
} & Document;

var featureSchema = new mongoose.Schema<FeatureCloister>({
  points: Number,
  tilesWithMeeples: [{
    placedTileIndex: Number,
    meepleIndex: Number
  }],
  complete: Boolean,
});

// create the model for features and expose it to our app
export const FeatureCloisterModel = mongoose.model<FeatureCloister>('Feature - Cloister', featureSchema);
