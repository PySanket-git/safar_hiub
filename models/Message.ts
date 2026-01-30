import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  requirementId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    requirementId: {
      type: Schema.Types.ObjectId,
      ref: "UserRequirement",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
MessageSchema.index({ requirementId: 1, createdAt: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
