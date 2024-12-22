const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Import path
const session = require('express-session'); // Import session middleware
const flash = require('connect-flash'); // Import flash for messaging
const { Pool } = require('pg');
const cors = require('cors');
const { Parser } = require('json2csv'); // Import the Parser from json2csv

const app = express();
const port = 3000;

// PostgreSQL connection setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'analytics',
    password: 'shubh',
    port: 5432
});

// Setting EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure this path is correct

// Serving static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key', // Replace with your own secret
    resave: false,
    saveUninitialized: true,
}));
app.use(flash());
app.use(cors());
app.use(express.json());

// Route to display the welcome page (index.ejs)
app.get('/', (req, res) => {
    res.render('index'); // Serve index.ejs first
});

// API to fetch dynamic chart data
app.get('/api/call-data', async (req, res) => {
    try {
        const result = await pool.query('SELECT employee_name, connected_calls FROM call_logs');

        // Extract labels (employee names) and data (connected calls)
        const labels = result.rows.map(row => row.employee_name);
        const data = result.rows.map(row => row.connected_calls);

        res.json({ labels, data });
    } catch (err) {
        console.error('Error fetching call data:', err.message);
        res.status(500).send('Server Error');
    }
});

// API to fetch customer satisfaction
app.get('/api/customer-satisfaction', async (req, res) => {
    try {
        const result = await pool.query('SELECT AVG(customer_feedback) AS satisfaction FROM call_logs WHERE customer_feedback IS NOT NULL');
        const satisfaction = Math.round(result.rows[0].satisfaction || 0); // Default to 0 if no data
        res.json({ satisfaction });
    } catch (err) {
        console.error('Error fetching customer satisfaction:', err.message);
        res.status(500).send('Server Error');
    }
});

// API to fetch total calls and total hours spent
app.get('/api/calls', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT COUNT(*) AS total_calls,
                   SUM(duration::interval) AS total_hours
            FROM call_logs`);

        const totalHours = Math.round(result.rows[0].total_hours.split(' ')[0] * 60); // Convert to minutes
        res.json({ total_calls: result.rows[0].total_calls, total_hours: totalHours });
    } catch (err) {
        console.error('Error fetching total calls:', err.message);
        res.status(500).send('Server Error');
    }
});

// API to fetch average call duration
app.get('/api/average-duration', async (req, res) => {
    try {
        const result = await pool.query('SELECT AVG(duration::interval) AS avg_duration FROM call_logs');
        const avgDuration = Math.round(result.rows[0].avg_duration.split(' ')[0] * 60); // Convert to minutes
        res.json({ avg_duration: avgDuration });
    } catch (err) {
        console.error('Error fetching average duration:', err.message);
        res.status(500).send('Server Error');
    }
});

// API to fetch all call logs
app.get('/api/call-logs', async (req, res) => {
    const sortColumn = req.query.sort || 'emp_code'; // Default sort column
    const sortOrder = req.query.order === 'desc' ? 'DESC' : 'ASC'; // Default sort order
    const limit = parseInt(req.query.limit) || 10; // Default limit if not specified

    const validSortColumns = ['emp_code', 'employee_name', 'call_type', 'duration', 'missed_calls', 'connected_calls', 'call_status', 'region', 'customer_feedback'];
    const sanitizedSortColumn = validSortColumns.includes(sortColumn) ? sortColumn : 'emp_code';

    try {
        const query = `SELECT emp_code, 
                              employee_name, 
                              call_type, 
                              duration, 
                              missed_calls,
                              connected_calls, 
                              call_status,
                              region, 
                              customer_feedback 
                       FROM call_logs
                       ORDER BY ${sanitizedSortColumn} ${sortOrder}
                       LIMIT $1`; // Use parameterized query for limit
        const result = await pool.query(query, [limit]);
        console.log('Query Result:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err.message);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// API to download call logs as CSV
app.get('/download/call-logs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM call_logs'); // Adjust query as necessary
        console.log('Query result:', result.rows); // Log the result to console

        if (result.rows.length === 0) {
            return res.status(404).send('No data available for download.');
        }

        const csvParser = new Parser();
        const csv = csvParser.parse(result.rows); // Convert JSON to CSV

        // Set response headers to prompt a download
        res.header('Content-Type', 'text/csv');
        res.attachment('call_logs.csv'); // Filename for the downloaded file
        res.send(csv);
    } catch (err) {
        console.error('Error downloading call logs:', err.message);
        res.status(500).send('Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
