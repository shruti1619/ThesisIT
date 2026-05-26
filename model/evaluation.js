const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define a sub-schema for individual member marks within an evaluation
const memberMarkSchema = new Schema({
    memberId: { // Reference to the specific student/member within the group
        type: Schema.Types.ObjectId,
        // ref: 'User' // Or 'Student' - adjust if you have a separate model for students/users
        required: true
    },
    marks: { // Object containing scores for each criterion for this member
        // Ensure these match your criteria keys and max values exactly
        technicalKnowledge: { type: Number, required: true, min: 0, max: 10 },
        communicationSkill: { type: Number, required: true, min: 0, max: 5 },
        individualEfforts: { type: Number, required: true, min: 0, max: 2 },
        overallPresentation: { type: Number, required: true, min: 0, max: 3 },
        innovativeness: { type: Number, required: true, min: 0, max: 3 },
        progressStatus: { type: Number, required: true, min: 0, max: 2 }
    },
    totalMarks: { // Total marks calculated for this specific member FOR THIS SEMINAR
        type: Number,
        required: true,
        min: 0,
        // Adjust max if criteria change per seminar
        max: 25 // Sum of max marks for Seminar 1 criteria
    }
}, { _id: false }); // Don't create a separate _id for each memberMark entry

const evaluationSchema = new Schema({
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group', // Reference to the Group model
        required: true
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project', // Reference to the Project model
        required: false // Make optional if needed
    },
    guideId: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectGuide', // Reference to the ProjectGuide model
        required: true
    },
    seminarNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 6 // Assuming max 6 seminars for BE
    },

    // Store marks as an array of member-specific scores for THIS seminar
    memberMarks: [memberMarkSchema],

    // Overall comments for this specific seminar evaluation
    comments: {
        type: String,
        trim: true
    },

    feedback: {
        type: String,
        trim: true // Automatically remove leading/trailing whitespace
    },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Remove the old pre-save hook for totalMarks calculation

// Index to ensure only one evaluation doc per group per seminar
evaluationSchema.index({ groupId: 1, seminarNumber: 1 }, { unique: true });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;