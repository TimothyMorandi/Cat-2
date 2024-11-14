const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all obituaries with pagination
router.get('/obituaries', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Query to get total count
        const [countResult] = await db.promise().query('SELECT COUNT(*) as total FROM obituaries');
        const totalItems = countResult[0].total;

        // Query to get paginated obituaries
        const query = `
            SELECT 
                id,
                name,
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth,
                DATE_FORMAT(date_of_death, '%Y-%m-%d') as date_of_death,
                content,
                author,
                DATE_FORMAT(submission_date, '%Y-%m-%d %H:%i') as submission_date,
                slug
            FROM obituaries 
            ORDER BY submission_date DESC
            LIMIT ? OFFSET ?
        `;

        const [obituaries] = await db.promise().query(query, [limit, offset]);

        res.json({
            success: true,
            data: {
                obituaries,
                pagination: {
                    currentPage: page,
                    itemsPerPage: limit,
                    totalItems: totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                }
            }
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching obituaries'
        });
    }
});

// Get single obituary by ID or slug
router.get('/obituaries/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        
        // Check if identifier is ID (number) or slug (string)
        const isId = !isNaN(identifier);
        
        const query = `
            SELECT 
                id,
                name,
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth,
                DATE_FORMAT(date_of_death, '%Y-%m-%d') as date_of_death,
                content,
                author,
                DATE_FORMAT(submission_date, '%Y-%m-%d %H:%i') as submission_date,
                slug
            FROM obituaries 
            WHERE ${isId ? 'id = ?' : 'slug = ?'}
            LIMIT 1
        `;

        const [obituary] = await db.promise().query(query, [identifier]);

        if (!obituary || obituary.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Obituary not found'
            });
        }

        res.json({
            success: true,
            data: obituary[0]
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching obituary'
        });
    }
});

// Create new obituary
router.post('/obituaries', async (req, res) => {
    try {
        const { name, date_of_birth, date_of_death, content, author } = req.body;

        // Validation
        if (!name || !date_of_birth || !date_of_death || !content || !author) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Create slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const query = `
            INSERT INTO obituaries 
            (name, date_of_birth, date_of_death, content, author, slug) 
            VALUES (?, ?, ?, ?, ?, ?)
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
            data: {
                id: result.insertId,
                slug: slug,
                message: 'Obituary created successfully'
            }
        });

    } catch (error) {
        console.error('Database error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                error: 'An obituary with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Error creating obituary'
        });
    }
});

// Search obituaries
router.get('/obituaries/search', async (req, res) => {
    try {
        const { query: searchQuery } = req.query;
        
        if (!searchQuery) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const query = `
            SELECT 
                id,
                name,
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth,
                DATE_FORMAT(date_of_death, '%Y-%m-%d') as date_of_death,
                content,
                author,
                DATE_FORMAT(submission_date, '%Y-%m-%d %H:%i') as submission_date,
                slug
            FROM obituaries 
            WHERE 
                name LIKE ? OR 
                content LIKE ? OR 
                author LIKE ?
            ORDER BY submission_date DESC
            LIMIT 20
        `;

        const searchPattern = `%${searchQuery}%`;
        const [results] = await db.promise().query(query, [
            searchPattern,
            searchPattern,
            searchPattern
        ]);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: 'Error searching obituaries'
        });
    }
});

module.exports = router;