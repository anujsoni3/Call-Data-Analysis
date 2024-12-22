const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv'); // Add this import
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'analytics',
  password: 'postgres',
  port: 5432,
});

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));
app.use(flash());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  const user = req.session.user || null; // Get the logged-in user from session
  res.render('index', { 
    messages: req.flash('info'), // Pass flash messages
    user: user // Pass user to template
  });
});

app.get('/indexD', (req, res) => {
  res.render('indexD');  // Render indexD.ejs
});

// Signup page
app.get('/signup', (req, res) => {
  res.render('signup', { messages: req.flash('info') });
});

// Signup route with validation
app.post(
  "/signup",
  [
    body("username").not().isEmpty().withMessage("Username is required"),
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom(async (email) => {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length > 0) {
          throw new Error("Email already in use");
        }
      }),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
      .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
      .matches(/\d/).withMessage("Password must contain at least one number")
      .matches(/[\W_]/).withMessage("Password must contain at least one special character"),
    body("confirm_password")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('info', errors.array().map(err => err.msg).join(", "));
      return res.redirect('/signup');
    }

    const { username, email, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
        [username, email, hashedPassword]
      );
      req.flash('info', 'Signup successful! You can log in now.');
      res.redirect('/login');
    } catch (err) {
      console.error(err.message);
      req.flash('info', 'An error occurred while signing up.');
      res.redirect('/signup');
    }
  }
);

app.get('/indexV', async (req, res) => {
  try {
    // Fetch audio records from the database
    const result = await pool.query('SELECT employee_name, audio_file_path FROM audio_records');
    const audioData = result.rows;

    // Send data to index.ejs for rendering
    res.render('indexV', { audioData });
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

app.get('/sentimental', (req, res) => {
  res.render('sentimental');
});
// Login page
app.get('/login', (req, res) => {
  res.render('login', { messages: req.flash('info') });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = userResult.rows[0];

    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.user = user; // Store user in session

      // Save session and redirect to home page
      req.session.save((err) => {
        if (err) {
          console.error(err);
          req.flash('info', 'An error occurred during login.');
          return res.redirect('/login');
        }
        req.flash('info', 'Login successful!');
        res.redirect('/');
      });
    } else {
      req.flash('info', 'Invalid username or password');
      return res.redirect('/login');
    }
  } catch (err) {
    console.error(err.message);
    req.flash('info', 'An error occurred while logging in.');
    res.redirect('/login');
  }
});

app.get('/download/call-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM call_logs'); // Adjust query as necessary

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

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    req.flash('info', 'Logout successful!');
    res.redirect('/');
  });
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

// Catch-all route for 404 errors
app.use((req, res) => {
  res.status(404).send('Sorry, that route does not exist.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
