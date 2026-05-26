const connectDatabase = require('../config/database');
const User = require('../modal/student');

const createTestUser = async () => {
    try {
        // Connect to database
        await connectDatabase();

        // Create a test user
        const testUser = new User({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            mobile: "1234567890",
            role: "student",
            department: "Computer Science",
            year: "third",
            rollNumber: "CS2023001",
            prn: "PRN2023001"
        });

        // Save the user
        await testUser.save();
        console.log('Test user created successfully');
        
    } catch (error) {
        console.error('Error creating test user:', error.message);
    }
    process.exit();
};

createTestUser();