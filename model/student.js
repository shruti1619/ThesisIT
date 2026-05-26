const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {  // Add username field
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
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
        trim: true,
        match: /^\d{4}-\d{2}$/
    },
    year: {
        type: String,
        enum: ['first', 'second', 'third', 'final'], // Updated to include all years
        required: true
    },
    rollNo: {
        type: String,
        required: [true, 'Roll Number is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'Roll Number cannot be empty'
        }
    },
    prn: {
        type: String,
        required: true,
        unique: true
    },
    groupId: { // Keep this field to link student to their group
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    // projectId: { // Remove this field - project association is now via the Group model
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Project',
    //     default: null
    // },
    teamRole: { // Keep this field to identify leader vs member
        type: String,
        enum: ['leader', 'member'],
        default: 'member'
    },
    profileImage: { // New field for profile image
        type: String,
        default: '/IMAGES/default-profile.png'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    projectRefineryId: { // New field to link student to their ProjectRefinery project
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectRefinery',
        default: null
    },
    profileImagePath: {
        type: String,
        default: null // Or your default path if you have one
    }
});


const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
