import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDayRating extends Document {
  date: string
  rating: 1 | 2 | 3 | 4
  notes?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

const DayRatingSchema = new Schema<IDayRating>(
  {
    date: {
      type: String,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    notes: {
      type: String,
      maxlength: 280,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
DayRatingSchema.index({ date: 1, userId: 1 }, { unique: true })

// Prevent model recompilation during hot reloads
const DayRating: Model<IDayRating> =
  mongoose.models.DayRating || mongoose.model<IDayRating>('DayRating', DayRatingSchema)

export default DayRating
