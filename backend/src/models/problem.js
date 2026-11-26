const mongoose = require('mongoose');
const { Schema } = mongoose;
const { nextSequence } = require('./counter');
const GuestSubmission = require('./guestSubmission');
const { SLUG_PATTERN, uniqueSlug } = require('../utils/slug');

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
  // URL key (/problems/<slug>) and the seed scripts' upsert key (backend/seed). Generated from the
  // title when missing (pre-validate hook below) and never regenerated on title edits.
  // `sparse` keeps the index options identical to the slug_1 index already in the deployed database,
  // so Mongoose does not hit an index conflict; `required` keeps every document slugged.
  slug: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: SLUG_PATTERN
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

// Slug from the title ("Two Sum" -> "two-sum", then two-sum-2, ...) only when none is set
problemSchema.pre('validate', async function() {
    if (!this.slug && this.title) {
        this.slug = await uniqueSlug(this.constructor, this.title, this._id);
    }
});

// Atomic numbering: reading max(number)+1 raced under concurrent creates (E11000).
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
        await GuestSubmission.deleteMany({ problemId: docToDelete._id }, sessionOpts);
    }
});

const Problem = mongoose.model('Problem', problemSchema);
module.exports = Problem;