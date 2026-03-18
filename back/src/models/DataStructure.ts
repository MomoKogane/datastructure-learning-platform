import mongoose, { Document, Schema } from 'mongoose';
import type { DataStructure as IDataStructure } from '../types';

// Modify the interface to work with Mongoose Document
interface DataStructureDocument extends Document {
  id: string;
  name: string;
  displayName: string;
  category: 'linear' | 'tree' | 'graph' | 'hash';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  concepts: any[];
  operations: any[];
  timeComplexity: any;
  spaceComplexity: any;
  visualizationConfig: any;
}

// Schema for complexity analysis
const complexityAnalysisSchema = new Schema({
  best: { type: String, required: true },
  average: { type: String, required: true },
  worst: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

// Schema for code examples
const codeExampleSchema = new Schema({
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp'],
    required: true
  },
  code: { type: String, required: true },
  explanation: { type: String, required: true }
}, { _id: false });

// Schema for parameters
const parameterSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  required: { type: Boolean, required: true },
  defaultValue: { type: Schema.Types.Mixed }
}, { _id: false });

// Schema for operations
const operationSchema = new Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  description: { type: String, required: true },
  timeComplexity: { type: String, required: true },
  spaceComplexity: { type: String, required: true },
  codeExamples: [codeExampleSchema],
  steps: [String],
  parameters: [parameterSchema]
}, { _id: false });

// Schema for learning concepts
const learningConceptSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true },
  examples: [String],
  keyPoints: [String]
}, { _id: false });

// Schema for visualization config
const visualizationConfigSchema = new Schema({
  type: {
    type: String,
    enum: ['array', 'linked-list', 'tree', 'graph'],
    required: true
  },
  animationSpeed: { type: Number, required: true },
  nodeColor: { type: String, required: true },
  linkColor: { type: String, required: true },
  highlightColor: { type: String, required: true },
  dimensions: {
    width: Number,
    height: Number
  }
}, { _id: false });

// Main data structure schema
const dataStructureSchema = new Schema<DataStructureDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['linear', 'tree', 'graph', 'hash'],
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  concepts: [learningConceptSchema],
  operations: [operationSchema],
  timeComplexity: {
    type: complexityAnalysisSchema,
    required: true
  },
  spaceComplexity: {
    type: complexityAnalysisSchema,
    required: true
  },
  visualizationConfig: {
    type: visualizationConfigSchema,
    required: true
  }
}, {
  timestamps: true,
  collection: 'datastructures'
});

// Indexes for better query performance
dataStructureSchema.index({ category: 1, name: 1 });
dataStructureSchema.index({ 'operations.name': 1 });

// Virtual for URL-friendly ID
dataStructureSchema.virtual('url').get(function() {
  return `/data-structures/${this.id}`;
});

// Transform the output to remove internal fields
dataStructureSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Static methods
dataStructureSchema.statics = {
  // Find by category
  findByCategory: function(category: string) {
    return this.find({ category }).sort({ name: 1 });
  },

  // Find with operations
  findWithOperations: function(dsId: string) {
    return this.findOne({ id: dsId }, 'operations');
  },

  // Search by name or description
  search: function(searchTerm: string) {
    const regex = new RegExp(searchTerm, 'i');
    return this.find({
      $or: [
        { name: regex },
        { displayName: regex },
        { description: regex }
      ]
    });
  }
};

// Instance methods
dataStructureSchema.methods = {
  // Get operation by name
  getOperation: function(operationName: string) {
    return this.operations.find((op: any) => op.name === operationName);
  },

  // Get concepts sorted by order
  getSortedConcepts: function() {
    return this.concepts.sort((a: any, b: any) => a.order - b.order);
  },

  // Calculate completion percentage for user
  calculateCompletion: function(completedSections: string[]) {
    const totalSections = this.concepts.length + this.operations.length;
    return totalSections > 0 ? (completedSections.length / totalSections) * 100 : 0;
  }
};

// Pre-save middleware
dataStructureSchema.pre('save', function(next) {
  // Ensure concepts have unique IDs and proper ordering
  this.concepts.forEach((concept: any, index: number) => {
    if (!concept.id) {
      concept.id = `${this.id}-concept-${index + 1}`;
    }
    if (concept.order === undefined) {
      concept.order = index + 1;
    }
  });

  next();
});

// Create and export the model
const DataStructure = mongoose.model<DataStructureDocument>('DataStructure', dataStructureSchema);

export default DataStructure;
