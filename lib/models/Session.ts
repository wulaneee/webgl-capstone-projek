import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  completedAt: Date;
  status: 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['completed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation during hot reloads
const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);

export default Session;
