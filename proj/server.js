const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = 3000;

// PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'analytics',
  password: 'postgres',
  port: 5432,
});

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to serve static files (CSS, JS, Audio, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/indexV', async (req, res) => {
  try {
    // Fetch audio records from the database
    const result = await pool.query('SELECT employee_name, audio_file_path FROM audio_records');
    const audioData = result.rows;

    // Send data to index.ejs for rendering
    res.render('index', { audioData });
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Error retrieving audio records');
  }
});

// API to search audio files by employee name
app.get('/api/search', async (req, res) => {
  const searchQuery = req.query.name ? `%${req.query.name.toLowerCase()}%` : '%';

  try {
    // Query database based on the search term
    const result = await pool.query(
      'SELECT employee_name, audio_file_path FROM audio_records WHERE LOWER(employee_name) LIKE $1',
      [searchQuery]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
