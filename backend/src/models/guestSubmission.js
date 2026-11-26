// Submissions made in guest mode (docs/GUEST_MODE_DESIGN.md). Kept apart from `submissions` so guest
// work never reaches user stats, solved lists or the admin dashboard, and deleted by a TTL index when
// the guest session ends. Admin-only diagnostics (failedTestCase, errorDetail) are not stored.
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const guestSubmissionSchema = new Schema(
  {
    // Random id from the signed guest token, never from the request body or params
    guestId: {
      type: String,
      required: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["cpp", "java"],
    },
    status: {
      type: String,
    },
    runtime: {
      type: Number, // ms
      default: 0,
    },
    memory: {
      type: Number, // mb
      default: 0,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    testCasesTotal: {
      type: Number,
      default: 0,
    },
    // End of the guest session (the token's exp). MongoDB deletes the document after this time.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

guestSubmissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
guestSubmissionSchema.index({ guestId: 1, problemId: 1, createdAt: -1 });

module.exports = mongoose.model("GuestSubmission", guestSubmissionSchema);
