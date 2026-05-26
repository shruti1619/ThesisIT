const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true,
    },
    groupNumber: { // Added Group Number field
        type: Number, // Or String, depending on your format
        required: [true, 'Group number is required'],
        unique: true // Assuming group numbers should be unique, perhaps within an academic year/class
        // Consider adding more specific validation if needed
    },
    leader: { // Stores the ObjectId of the leader Student
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
        // Leader's Name, Email, Roll No are retrieved via population
    },
    members: [{ // Stores ObjectIds of member Students
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
        // Members' Name, Email, Roll No are retrieved via population
        // Validation for size (5 members) and class consistency happens in backend routes
    }],
    contributions: [{ // New field to store contributions for each member
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        contribution: {
            type: String,
            required: true,
            trim: true
        }
    }],
    academicYear: { // Validation for format is here
        type: String,
        required: true,
        trim: true,
        match: [/^\d{4}-\d{2}$/, 'Academic year must be in YYYY-YY format']
        // Check for member consistency happens in backend routes
    },
    year: { // Validation for allowed values is here
        type: String,
        enum: ['first', 'second', 'third', 'final'],
        required: true
        // Check for member consistency happens in backend routes
    },
    guideId: { // Stores the ObjectId of the ProjectGuide
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectGuide',
        required: [true, 'Project guide is required']
        // Guide's Name is retrieved via population
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optional: Compound index for uniqueness if groupNumber is unique per year/academicYear
// groupSchema.index({ academicYear: 1, year: 1, groupNumber: 1 }, { unique: true });

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;