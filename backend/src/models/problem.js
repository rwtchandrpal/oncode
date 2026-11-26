const mongoose = require('mongoose');
const { Schema } = mongoose;
const { nextSequence } = require('./counter');

const problemSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  number: {
    type: Number,
    unique: true
  },
  // Stable kebab-case key used by the seed scripts (backend/seed) to upsert problems.
  // Optional: problems created in the admin UI have none, so the unique index is sparse.
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  topics: { 
    type: [String], 
    required: true, 
  },
  description: {
    type: String, 
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'], 
    default: 'Easy'
  },
  
  // The Driver Code Architecture
  codeSnippets: [{
    language: { type: String, required: true },
    userSnippet: { type: String, required: true }, 
    driverCode: { type: String, required: true }  
  }],

  referenceSolutions: [{
    language: { type: String, required: true }, 
    code: { type: String, required: true }
  }],

  constraints: {
    type: [String],
    required: true,
    default: []
  },

  visibleTestCase: {
      input: { type: String, required: true },
      expectedOutput: { type: String, required: true }
  },
  
  // Hidden test cases for Judge0
  hiddenTestCases: [
    {
      input: { type: String, required: true },
      expectedOutput: { type: String, required: true }
    }
  ],

  // Examples shown on the problem page
  examples: [
    {
      input: { type: String, required: true }, 
      output: { type: String, required: true },
      explanation: { type: String }
    }
  ],

  problemCreator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  }
}, { timestamps: true });

// Atomic numbering (BUG-16): reading max(number)+1 raced under concurrent creates (E11000).
problemSchema.pre('save', async function() {
    if (this.isNew && this.number == null) {
        const Problem = this.constructor;
        this.number = await nextSequence('problemNumber', async () => {
            const last = await Problem.findOne({}, 'number').sort('-number').lean();
            return last?.number || 0;
        });
    }
});

// Cascade cleanup when a problem is deleted
problemSchema.pre('findOneAndDelete', async function() {
    const session = this.getOptions()?.session;
    const sessionOpts = session ? { session } : {};
    const docToDelete = await this.model.findOne(this.getQuery(), null, sessionOpts);
    if (docToDelete) {
        await mongoose.model('User').updateMany(
            { problemsSolved: docToDelete._id },
            { $pull: { problemsSolved: docToDelete._id } },
            sessionOpts
        );
        await mongoose.model('Submission').deleteMany({ problemId: docToDelete._id }, sessionOpts);
    }
});

const Problem = mongoose.model('Problem', problemSchema);
module.exports = Problem;