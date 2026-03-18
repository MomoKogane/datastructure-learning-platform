import mongoose, { Document, Schema } from 'mongoose';

export interface MessageDocument extends Document {
  recipientId: string;
  senderId: string;
  senderRole: 'admin' | 'teacher' | 'system';
  title: string;
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>({
  recipientId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  senderId: {
    type: String,
    required: true,
    trim: true
  },
  senderRole: {
    type: String,
    enum: ['admin', 'teacher', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'messages'
});

messageSchema.index({ recipientId: 1, createdAt: -1 });

const Message = mongoose.model<MessageDocument>('Message', messageSchema);

export default Message;
