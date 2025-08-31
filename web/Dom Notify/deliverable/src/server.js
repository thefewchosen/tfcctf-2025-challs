const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');


const { saveNote, getNote } = require('./db/db');
const { sanitizeContent } = require('./utils');
const { visit } = require('./bot');

const app = express();
const PORT = 3000;


// Setup EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Rate limit: max 5 requests per 1 minute per IP
const reportLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many reports from this IP, please try again later.'
});

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

// Route: Home page - form to create a note
app.get('/', (req, res) => {
  res.render('home'); 
});

// Route: Handle form submission
app.post('/note/create', async (req, res) => {
  let { content } = req.body;

  content = sanitizeContent(content)

  const id = uuidv4();

  try {
    await saveNote(id, content);
    res.redirect(id);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving note.');
  }
});

// Route: View a note by ID
app.get('/note/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const note = await getNote(id);
    if (note) {
      res.render('note', { id, content: note.content });
    } else {
      res.status(404).render('notfound');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving note.');
  }
});

// Route: Report a note to admin
app.post('/report', reportLimiter, async (req, res) => {
  const { id } = req.body;

  try {
    const note = await getNote(id);
    if (note) {
      visit(id);
      res.status(200).send('Note reported!');
    } else {
      res.status(404).send('Not found!');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving note.');
  }
});

// Route: Return multiple custom elements as JSON
// !! At the moment the route seems to have some frontend errors, so we disabled it in the main.js
app.get('/custom-divs', (req, res) => {
    const customElements = [
      { name: 'fancy-div', observedAttribute: 'color' },
      { name: 'huge-div', observedAttribute: 'font' },
      { name: 'title-div', observedAttribute: 'title' }
    ];

    res.json(customElements);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});