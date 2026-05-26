const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../modal/admin'); // Import the Admin model
const Student = require('../modal/student'); // Import the Student model
const Alumni = require('../modal/alumni'); // Import the Alumni model
const Project = require('../modal/project');
const Group = require('../modal/group');
const ProjectGuide = require('../modal/projectGuide'); // Import the Project model
const { ensureAuthenticated, isAdmin } = require('../middlewares/auth'); // Import the middleware
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // Make sure 'path' module is required at the top

// Validation middleware for Admin registration
const validateAdminRegistration = (req, res, next) => {
    const { name, email, mobile, adminCode, academicYear, username, password } = req.body;

    if (!name || !email || !mobile || !adminCode || !academicYear || !username || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
    if (!emailRegex.test(email.toLowerCase())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Mobile validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({ error: "Mobile number must be 10 digits" });
    }

    // Password validation (minimum 6 characters)
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    next();
};

// Validation middleware for Admin sign-in
const validateAdminSignIn = (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    next();
};


// Route to render the admin dashboard with project domains
router.get('/dashboard', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
        // Fetch total student count
        const totalStudentCount = await Student.countDocuments();

        // Fetch total project guide count
        const totalProjectGuides = await ProjectGuide.countDocuments();

        // Fetch student counts by year
        const studentCountByYear = await Student.aggregate([
            { $group: { _id: "$year", count: { $sum: 1 } } }
        ]);

        // Transform the result to a more usable format
        const studentCounts = {};
        studentCountByYear.forEach(item => {
            studentCounts[item._id] = item.count;
        });

        // Fetch Unique Project Domains
        const uniqueDomains = await Project.distinct('projectDomain');
        const validDomains = uniqueDomains.filter(domain => domain && domain.trim() !== '');

        // Render the admin dashboard with all the data
        res.render('admin', { 
            totalStudentCount, 
            totalProjectGuides, 
            studentCountByYear: studentCounts, 
            projectDomains: validDomains,  // <-- domains added here
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
});

// Route to get year-wise student details
router.get('/year-wise-students', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
        const studentCountByYear = await Student.aggregate([
            { $group: { _id: "$year", count: { $sum: 1 } } }
        ]);

        const studentCounts = {};
        studentCountByYear.forEach(item => {
            studentCounts[item._id] = item.count;
        });

        res.json(studentCounts);
    } catch (error) {
        console.error('Error fetching year-wise student details:', error);
        res.status(500).json({ error: 'Failed to fetch year-wise student details.' });
    }
});

// Route to get student details by year
router.get('/students/:year', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
        const year = req.params.year;
        const students = await Student.find({ year: year });

        res.json(students);
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ error: 'Failed to fetch student details.' });
    }
});
// Route to get detailed student information
router.get('/student-details', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
        // Fetch students sorted by year in descending order
        const students = await Student.find({}, 'name year academicYear').sort({ year: -1 });
        res.json(students);
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ error: 'Failed to fetch student details.' });
    }
});
// Route to render guide details
router.get('/guide-details', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
        const guides = await ProjectGuide.find();
        const guideGroups = await Promise.all(guides.map(async (guide) => {
            const groupCount = await Group.countDocuments({ guideId: guide._id });
            return { guide, groupCount };
        }));
        res.render('guideDetails', { guides,guideGroups });
    } catch (error) {
        console.error('Error fetching guide details:', error);
        res.status(500).json({ error: 'Failed to load guide details.' });
    }
});

// adminRoutes.js
router.get('/guide-groups/:guideId', async (req, res) => {
    try {
        const groups = await Group.find({ guideId: req.params.guideId })
            .populate({
                path: 'projectId',
                select: 'projectTitle'
            })
            .sort({ year: -1 });

        res.render('guide_group_details', { groups });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
// Registration route for Admin
router.post("/register", validateAdminRegistration, async (req, res) => {
    try {
        const { name, email, mobile, adminCode, academicYear, username, password } = req.body;

        // Check if an admin already exists
        const existingAdmin = await Admin.findOne({});
        if (existingAdmin) {
            return res.status(400).json({ error: "An admin is already registered. Only one admin is allowed." });
        }

        // Check if the admin code is unique
        const adminWithCode = await Admin.findOne({ adminCode });
        if (adminWithCode) {
            return res.status(400).json({ error: "Admin code must be unique." });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const newAdmin = await Admin.create({
            name,
            email: email.toLowerCase(),
            mobile,
            adminCode,
            academicYear,
            username,
            password: hashedPassword
        });

        // Generate JWT token
        const token = jwt.sign({ email: newAdmin.email, adminId: newAdmin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Send response
        res.cookie("token", token).json({ message: "Admin registration successful" });

    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/profile - render admin profile page
router.get('/profile', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
      const admin = await Admin.findById(req.user.adminId); // assuming req.user.adminId is set after login
      if (!admin) {
        req.flash('error_msg', 'Admin profile not found.');
        return res.redirect('/admin/dashboard'); // Redirect to admin dashboard or login
      }
      res.render('adminProfile', {  // Your admin profile view name
        admin,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
      });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      req.flash('error_msg', 'Error loading profile page.');
      res.status(500).redirect('/admin/dashboard');
    }
  });
  
  // Multer storage config for admin profile images
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile_images_admins');
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = (req.user?.adminId || 'unknown_admin') + '-' + uniqueSuffix + path.extname(file.originalname);
      cb(null, filename);
    },
  });
  
  // Accept only image files
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };
  
  const upload = multer({ storage, fileFilter });
  
  // POST /admin/update-profile - update admin profile with optional profile image
  router.post('/update-profile', ensureAuthenticated, isAdmin, upload.single('profileImage'), async (req, res) => {
    try {
      const adminId = req.user.adminId;
  
      const {
        name,
        email,
        mobile,
        adminCode,
        academicYear,
        username,
        password, // Optional: if you want to handle password change here
      } = req.body;
  
      // Prepare update data
      const updateData = {
        name,
        email,
        mobile,
        adminCode,
        academicYear,
        username,
      };
  
      // If password is provided, hash it (bcrypt)
      if (password && password.trim() !== '') {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
  
      // If profile image uploaded, update the path
      if (req.file) {
        updateData.profileImagePath = path.join('/uploads', 'profile_images_admins', req.file.filename).replace(/\\/g, '/');
        // Optionally: Delete old image file if needed (fetch old record, fs.unlink)
      }
  
      const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, {
        new: true,
        runValidators: true,
      });
  
      if (!updatedAdmin) {
        req.flash('error_msg', 'Admin not found during update.');
        return res.status(404).json({ success: false, error: 'Admin not found' });
      }
  
      req.flash('success_msg', 'Profile updated successfully!');
      res.json({
        success: true,
        message: 'Profile updated successfully!',
        profileImagePath: updatedAdmin.profileImagePath,
      });
    } catch (error) {
      console.error('Error updating admin profile:', error);
  
      if (error.message === 'Only image files are allowed!') {
        req.flash('error_msg', 'Upload failed: Only image files are allowed.');
        return res.status(400).json({ success: false, error: 'Only image files are allowed!' });
      }
  
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e) => e.message);
        req.flash('error_msg', `Profile update failed: ${messages.join(', ')}`);
        return res.status(400).json({ success: false, error: messages.join(', ') });
      }
  
      req.flash('error_msg', 'Error updating profile.');
      res.status(500).json({ success: false, error: 'Server error during profile update.' });
    }
  });
router.get('/signin', (req, res) => {
    res.render('loginAdmin');
});
// Sign-in route for Admin
router.post("/signin", validateAdminSignIn, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Find admin by username
        const admin = await Admin.findOne({ username });
        if (!admin) {
            console.log('Admin not found for username:', username);
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Compare the entered password with the hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            console.log('Password mismatch for admin:', username);
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // If credentials are correct, generate a token
        const token = jwt.sign({ username: admin.username, adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log('Admin login successful, token generated for:', username);

        // Send response
        res.cookie("token", token).json({
            message: "Login successful",
            token,
            admin: {
                email: admin.email,
                name: admin.name
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to mark final year students as alumni
router.post('/mark-final-year-as-alumni', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
        // Find final year students
        const finalYearStudents = await Student.find({ year: 'final' });

        // Prepare alumni data with all required fields
        const alumniData = finalYearStudents.map(student => ({
            name: student.name,
            username: student.username,
            email: student.email,
            mobile: student.mobile,
            academicYear: student.academicYear,
            yearOfPassing: new Date().getFullYear().toString(),
            rollNo: student.rollNo,
            prn: student.prn,
            groupId: student.groupId || null,
            teamRole: student.teamRole || 'member',
            profileImage: student.profileImage || '/IMAGES/default-profile.png',
            profileImagePath: student.profileImagePath || null
        }));

        // Insert alumni
        await Alumni.insertMany(alumniData);

        // Delete final year students
        await Student.deleteMany({ year: 'final' });

        req.flash('success_msg', 'Final year students marked as alumni successfully.');
        res.json({ message: 'Final year students marked as alumni successfully.' });

    } catch (error) {
        console.error('Error marking final year students as alumni:', error);
        res.status(500).json({ error: 'Failed to mark final year students as alumni.' });
    }
});

router.get('/alumini-list', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
        const alumniList = await Alumni.find().sort({ yearOfPassing: -1, name: 1 }); // Sort optional
        res.render('alumini_list', { alumniList });
    } catch (error) {
        console.error('Error fetching alumni list:', error);
        res.status(500).send('Server Error');
    }
});

router.get('/studentDetails', (req, res) => {
    res.render('studentDetails');
});

router.get('/logout', (req, res) => {
    res.clearCookie('token'); 
    res.redirect('/admin/signin');
    
});
module.exports = router;