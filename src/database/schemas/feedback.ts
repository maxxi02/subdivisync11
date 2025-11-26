import mongoose, { Schema, model, models } from "mongoose";

export interface IFeedback {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "feedbacks",
  }
);

// Create indexes
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ createdAt: -1 });

export const Feedback =
  models.Feedback || model<IFeedback>("Feedback", FeedbackSchema);
