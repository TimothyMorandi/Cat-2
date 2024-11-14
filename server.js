const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// Import database connection - ONLY ONCE
const db = require('./db/database');

// Import routes
const submitObituaryRouter = require('./routes/submit_obituary');
const obituariesRouter = require('./routes/obituaries');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Change 'public' to 'web' for static files
app.use(express.static(path.join(__dirname, '/web')));

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Root route to serve the form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/obituary_form.htm'));
});

// Use routes
app.use('/submit_obituary', submitObituaryRouter);
app.use('/api', obituariesRouter);

// Route for viewing obituaries page
app.get('/view_obituaries', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/obituaries.html'));
});

// Update the obituaries route to use MySQL connection
app.get('/api/obituaries', (req, res) => {
    const query = `
        SELECT 
            name,
            DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth,
            DATE_FORMAT(date_of_death, '%Y-%m-%d') as date_of_death,
            content,
            author,
            DATE_FORMAT(submission_date, '%Y-%m-%d') as submission_date
        FROM obituaries 
        ORDER BY submission_date DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching obituaries:', err);
            return res.status(500).json({ error: 'Error fetching obituaries' });
        }
        res.json({ obituaries: results });
    });
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

// Start server with error handling
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, (error) => {
    if (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
    console.log('\x1b[32m%s\x1b[0m', `✓ Server is running`);
    console.log('\x1b[36m%s\x1b[0m', `  → Local: http://localhost:${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `  → Time: ${new Date().toLocaleString()}`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error('\x1b[31m%s\x1b[0m', `❌ Error: Port ${PORT} is already in use`);
    } else {
        console.error('\x1b[31m%s\x1b[0m', '❌ Server error:', error);
    }
    process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('\n\x1b[33m%s\x1b[0m', '⚠️  Shutting down server...');
    server.close(() => {
        db.end((err) => {  // Changed from close to end for MySQL
            if (err) {
                console.error('\x1b[31m%s\x1b[0m', '❌ Error closing database:', err);
            } else {
                console.log('\x1b[32m%s\x1b[0m', '✓ Database connection closed');
            }
            console.log('\x1b[32m%s\x1b[0m', '✓ Server closed successfully');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('\n\x1b[33m%s\x1b[0m', '⚠️  Shutting down server...');
    server.close(() => {
        db.end((err) => {  // Changed from close to end for MySQL
            if (err) {
                console.error('\x1b[31m%s\x1b[0m', '❌ Error closing database:', err);
            } else {
                console.log('\x1b[32m%s\x1b[0m', '✓ Database connection closed');
            }
            console.log('\x1b[32m%s\x1b[0m', '✓ Server closed successfully');
            process.exit(0);
        });
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('\x1b[31m%s\x1b[0m', '❌ Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m%s\x1b[0m', '❌ Unhandled Promise Rejection:', reason);
    process.exit(1);
});