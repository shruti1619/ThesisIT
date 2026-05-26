const mongoose = require('mongoose');

// Define the schema for Project Guide
const projectGuideSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        length: 10
    },
    academicYear: {
        type: String,
        required: true,
        trim: true
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
    profileImagePath: {
        type: String,
        default: null // Or your default path if you have one
    }
});

// Create the model from the schema
const ProjectGuide = mongoose.model('ProjectGuide', projectGuideSchema);

module.exports = ProjectGuide;