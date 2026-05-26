const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
    name: {
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
    academicYear: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{4}-\d{2}$/
    },
    yearOfPassing: {
        type: String,
        required: true
    },
    rollNo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    prn: {
        type: String,
        required: true,
        unique: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    teamRole: {
        type: String,
        enum: ['leader', 'member'],
        default: 'member'
    },
    profileImage: {
        type: String,
        default: '/IMAGES/default-profile.png'
    },
    profileImagePath: {
        type: String,
        default: null
    }
});

const Alumni = mongoose.model("Alumni", alumniSchema);

module.exports = Alumni;