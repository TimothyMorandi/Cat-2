const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Correct path to database connection

// Submit obituary route
router.post('/', async (req, res) => {
    try {
        const { name, date_of_birth, date_of_death, content, author } = req.body;

        // Validate input
        if (!name || !date_of_birth || !date_of_death || !content || !author) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Create slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const query = `
            INSERT INTO obituaries (
                name, 
                date_of_birth, 
                date_of_death, 
                content, 
                author,
                slug,
                submission_date
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await db.promise().query(query, [
            name, 
            date_of_birth, 
            date_of_death, 
            content, 
            author,
            slug
        ]);

        res.status(201).json({
            success: true,
            message: 'Obituary submitted successfully',
            data: {
                id: result.insertId,
                slug: slug
            }
        });

    } catch (error) {
        console.error('Database error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'An obituary with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to save obituary'
        });
    }
});

// Get all obituaries with pagination
// Remove this route since it duplicates /api/obituaries
// Users should use /api/obituaries endpoint from routes/obituaries.js instead
// Removing to avoid duplicate routes and potential conflicts

// Get single obituary by ID or slug
router.get('/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const isId = !isNaN(identifier);

        const query = `
            SELECT 
                id,
                name,
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth,
                DATE_FORMAT(date_of_death, '%Y-%m-%d') as date_of_death,
                content,
                author,
                slug,
                DATE_FORMAT(submission_date, '%Y-%m-%d %H:%i') as submission_date
            FROM obituaries 
            WHERE ${isId ? 'id = ?' : 'slug = ?'}
            LIMIT 1
        `;

        const [rows] = await db.promise().query(query, [identifier]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Obituary not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('Error fetching obituary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch obituary'
        });
    }
});

// Update obituary
router.put('/:id', async (req, res) => {
    try {
        const { name, date_of_birth, date_of_death, content, author } = req.body;
        const id = req.params.id;

        // Validate input
        if (!name || !date_of_birth || !date_of_death || !content || !author) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const query = `
            UPDATE obituaries 
            SET 
                name = ?,
                date_of_birth = ?,
                date_of_death = ?,
                content = ?,
                author = ?
            WHERE id = ?
        `;

        const [result] = await db.promise().query(query, [
            name, 
            date_of_birth, 
            date_of_death, 
            content, 
            author, 
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Obituary not found'
            });
        }

        res.json({
            success: true,
            message: 'Obituary updated successfully'
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update obituary'
        });
    }
});

module.exports = router;