const mongoose = require('mongoose');

// Strip query operators ($ne, $gt, $regex, ...) from user-supplied filter objects (SEC-01).
// The codebase builds no filters from raw user objects that need `$` keys; operators written in code
// via mongoose.trusted() or plain literals are unaffected.
mongoose.set('sanitizeFilter', true);

const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
    }catch(error){
        console.error(`Error connecting to MongoDB: ${error.message}`);

        process.exit(1);
    }
};

module.exports = connectDB;
