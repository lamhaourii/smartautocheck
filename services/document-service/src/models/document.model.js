const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['carte_grise', 'identity', 'insurance', 'other'],
    default: 'carte_grise'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending'
  },
  extractedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ocrText: {
    type: String
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', documentSchema);
