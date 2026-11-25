const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        problemId: {
            type: Schema.Types.ObjectId,
            ref: 'Problem',
            required: true
        },
        code: {
            type: String,
            required: true
        },
        language: {
            type: String,
            required: true,
            enum: ['cpp', 'java'],
        },
        status: {
            type: String,
        },
        runtime: {
            type: Number, // ms
            default: 0
        },
        memory: {
            type: Number, // mb
            default: 0
        },
        errorMessage: {
            type: String,
            default: ''
        },
        testCasesPassed: {
            type: Number,
            default: 0
        },
        testCasesTotal: {
            type: Number,
            default: 0
        },
        // Hidden-test diagnostics. Admin/debug use only: never selected by default and never sent to
        // the submitting user (SEC-03). `errorMessage` above holds only the user-safe text.
        failedTestCase: {
            type: new Schema({
                input: { type: String },
                expectedOutput: { type: String },
                actualOutput: { type: String }
            }, { _id: false }),
            select: false
        },
        errorDetail: {
            type: String,
            select: false
        },
        isDemo: {
            type: Boolean,
            default: false,
            index: true
        },
        expiresAt: {
            type: Date,
            default: null
        },
    },
     {timestamps: true}
)

submissionSchema.index({ status: 1 });
submissionSchema.index({ userId: 1, status: 1 });
submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });
submissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission ;