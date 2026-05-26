const mongoose = require('mongoose');

const ProjectRefinerySchema = new mongoose.Schema({
    projectTitle: { type: String, trim: true },
    problemStatement: {
        type: String,
        required: true,
        trim: true
    },
    projectOverview: {
        type: String,
        required: true,
        trim: true
    },
    limitation: {
        type: String,
        required: true,
        trim: true
    },
    futureScope: {
        type: String,
        required: true,
        trim: true
    },
    technicalIssues: {
        type: String,
        required: true,
        trim: true
    },
    domain: {
        type: String,
        required: true,
        trim: true
    },
    userId: { // Reference to the Student model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ProjectRefinery', ProjectRefinerySchema);