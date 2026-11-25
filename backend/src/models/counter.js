const mongoose = require('mongoose');

// Named sequence counters, e.g. { _id: 'problemNumber', seq: 42 } (BUG-16).
const counterSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        seq: { type: Number, required: true, default: 0 },
    },
    { versionKey: false }
);

const Counter = mongoose.model('Counter', counterSchema);

// Atomically returns the next value of `name`. On the very first call the counter starts from
// `initialValue()` (e.g. the current max problem number), so existing data keeps its numbering.
// $ifNull inside an update pipeline only applies when `seq` is missing, so two racing first calls
// still get n+1 and n+2.
const nextSequence = async (name, initialValue = async () => 0) => {
    const start = await initialValue();
    const doc = await Counter.findOneAndUpdate(
        { _id: name },
        [{ $set: { seq: { $add: [{ $ifNull: ['$seq', start] }, 1] } } }],
        { upsert: true, returnDocument: 'after', updatePipeline: true }
    ).lean();
    return doc.seq;
};

module.exports = { Counter, nextSequence };
