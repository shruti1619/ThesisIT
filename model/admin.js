const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        length: 10
    },
    adminCode: {
        type: String,
        required: true
    },
    academicYear: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{4}-\d{2}$/
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    profileImagePath: {
        type: String,
        default: null // Or your default path if you have one
    }
});


const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;