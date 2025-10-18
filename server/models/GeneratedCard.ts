import mongoose, { Document, Schema } from 'mongoose';

export interface IGeneratedCard extends Document {
  userId?: string; // Optional reference to user if available
  userEmail?: string; // Email of the user who generated the card
  imageUrl: string; // URL of the generated image
  dishName?: string; // Name of the selected dish
  background?: string; // Selected background
  greeting?: string; // User's greeting message
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedCardSchema = new Schema<IGeneratedCard>({
  userId: {
    type: String,
    required: false,
    trim: true
  },
  userEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
  dishName: {
    type: String,
    required: false,
    trim: true
  },
  background: {
    type: String,
    required: false,
    trim: true
  },
  greeting: {
    type: String,
    required: false,
    trim: true,
    maxlength: [500, 'Greeting cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for faster queries
GeneratedCardSchema.index({ createdAt: -1 });
GeneratedCardSchema.index({ userEmail: 1 });

export default mongoose.models.GeneratedCard || mongoose.model<IGeneratedCard>('GeneratedCard', GeneratedCardSchema);
