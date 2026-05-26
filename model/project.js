const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    // --- Core Project Info (Submitted Stage 1) ---
    projectTitle: {
        type: String,
        required: true, // Required initially
        trim: true
    },
    projectDomain: {
        type: String,
        required: true, // Required initially
        trim: true
    },
    projectOverview: {
        type: String,
        required: true // Required initially
    },
    problemStatement: {
        type: String,
        required: true // Required initially
    },
    objectives: {
        type: String,
        required: true, // Required initially
        trim: true
    },
    scopeAndFunctionality: {
        type: String,
        required: true, // Required initially
        trim: true
    },

    // --- Group & Context ---
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        unique: true // One project per group
    },
    guideId: { // Link to the assigned guide
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guide',
        required: true
    },
    academicYear: { // e.g., "2024-2025"
        type: String,
        required: true
    },
    year: { // Student year (TE/BE) determines max stages
        type: String,
        enum: ['first', 'second','third','final'], // Third Year or Final Year
        required: true
    },

    // --- Submission Tracking ---
    submissionStage: { // Tracks the highest completed stage (0=none, 1=sem1 done, etc.)
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 6 // Max possible stage
    },
    lastSubmittedBy: { // Track who submitted the *last* update
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true // Should be set on every submission
    },
    lastSubmissionDate: { // Track when the *last* update was made
        type: Date,
        default: Date.now
    },

    // --- File Paths for Each Stage ---

    // Semester 7 - Stage 1 (Seminar 1)
    seminar1PPT: { type: String, trim: true },
    progressVideo1: { type: String, trim: true },

    // Semester 7 - Stage 2 (Seminar 2)
    seminar2PPT: { type: String, trim: true },
    progressVideo2: { type: String, trim: true },

    // Semester 7 - Stage 3 (Seminar 3)
    seminar3PPT: { type: String, trim: true },
    progressVideo3: { type: String, trim: true },
    // Final files for TE (also submitted at Stage 3)
    // These will also be used by BE, but potentially updated at Stage 6

    // Semester 8 - Stage 4 (Seminar 4 - BE Only)
    seminar4PPT: { type: String, trim: true },
    progressVideo4: { type: String, trim: true },

    // Semester 8 - Stage 5 (Seminar 5 - BE Only)
    seminar5PPT: { type: String, trim: true },
    progressVideo5: { type: String, trim: true },

    // Semester 8 - Stage 6 (Seminar 6 - BE Final)
    seminar6PPT: { type: String, trim: true },
    progressVideo6: { type: String, trim: true },

    // --- Final Submission Files (Stage 3 for TE, Stage 6 for BE) ---
    // These fields store the *latest* version of these final documents
    projectReport: { type: String, trim: true },
    references: { type: String, trim: true },
    demonstrationVideo: { type: String, trim: true },
    poster: { type: String, trim: true },
    relatedCodes: { type: String, trim: true }, // Path to zip file, etc.

    // Optional: Add fields for guide feedback/approval per stage if needed later
    // e.g., stage1Feedback: String, stage1Approved: Boolean, ...

}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Optional: Index for searching
// projectSchema.index({ projectTitle: 'text', projectDomain: 'text' });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;