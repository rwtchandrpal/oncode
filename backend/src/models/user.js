const mongoose = require('mongoose');
const {Schema}  = mongoose ;

const userSchema = new Schema ({
    firstName: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 50
    },
    lastName: {
         type: String,
         minLength: 1,
         maxLength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        immutable: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
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
problemsSolved: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem'
        }],
        default: [] 
    },
    password: {
     type: String,
     required: true,
     select: false
    }
}, {
    timestamps: true
})


// Sparse TTL index for automatic expiration of temporary demo sessions
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// when user delete profile
userSchema.post('findOneAndDelete', async function(doc){
    if(doc){
        await mongoose.model('Submission').deleteMany({userId: doc._id});
    }
})
const User = mongoose.model('User', userSchema);

module.exports = User;