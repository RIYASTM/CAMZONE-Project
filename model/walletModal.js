const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
  type: {
    type: String,
    enum: ['Credit', 'Debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  transactionId: {
    type: String,
    required: true,

  },
  createdAt: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['Pending', 'Success', 'Failed'],
    default: 'Success',
  },
}, { timestamps: true });

const walletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // unique: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  transactions: [transactionSchema],
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;