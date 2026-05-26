const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        const connection = await mongoose.connect('mongodb://localhost:27017/THESIS_STORAGE_VAULT', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDatabase;