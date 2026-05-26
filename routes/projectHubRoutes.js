const express = require('express');
const router = express.Router();
const Project = require('../modal/project');
const Group = require('../modal/group');
const Student = require('../modal/student'); 
const Alumni = require('../modal/alumni'); // Assuming your project model is named Project

// Route to get all projects for the hub
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find({});
        res.render('projecthub', { projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).send('Server Error');
    }
});

// Route to render project details page by ID
router.get('/details/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('groupId', 'groupName'); // Populate only needed fields if desired
        if (!project) {
            return res.status(404).send('Project not found');
        }
        // --- EDIT: Use the year directly from the project object ---
        // const year = project.groupId ? project.groupId.year : 'Year not available'; // Old way - incorrect field
        const year = project.year; // Correct way - 'TE' or 'BE' from the project itself
        // --- End Edit ---

        // Pass the project object and the extracted year to the template
        res.render('projectDetails', { project, year });
    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).send('Server Error');
    }
});

// Route to view alumni and current student details of a project
// Route to fetch alumni and current student members by groupId
router.get('/alumni/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;

        // Fetch group details
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).send('Group not found');
        }

        // Fetch students in this group
        const studentMembers = await Student.find(
            { groupId },
            'name email profileImagePath contribution'
        );

        // Fetch alumni in this group
        const alumniMembers = await Alumni.find(
            { groupId },
            'name email profileImagePath contribution'
        );

        // Combine all members
        const allMembers = [...studentMembers, ...alumniMembers];

        if (allMembers.length === 0) {
            return res.status(404).send('No team members found for this group');
        }

        // Fetch project data if needed
        const project = await Project.findOne({ groupId });

        res.render('alumniDetails', {
            members: allMembers,
            projectTitle: project ? project.title : 'Unknown Project',
            guideName: project ? project.guideName : 'N/A',
            group: group // Pass the group object to the view
        });

    } catch (error) {
        console.error('Error fetching team details:', error);
        res.status(500).send('Server Error');
    }
});


module.exports = router;