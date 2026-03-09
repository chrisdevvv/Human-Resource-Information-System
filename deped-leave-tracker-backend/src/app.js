require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./modules/auth/authRoutes');
const leaveRoutes = require('./modules/leave/leaveRoutes');
const employeeRoutes = require('./modules/employee/employeeRoutes');
const schoolRoutes = require('./modules/school/schoolRoutes');
const backlogRoutes = require('./modules/backlog/backlogRoutes');
const registrationRoutes = require('./modules/registration/registrationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/backlogs', backlogRoutes);
app.use('/api/registrations', registrationRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
