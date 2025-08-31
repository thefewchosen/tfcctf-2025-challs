const express = require('express');
const multer = require('multer');
const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs');
const ensureSession = require('../middleware/session');
const developmentOnly = require('../middleware/developmentOnly');

const router = express.Router();

router.use(ensureSession);

const upload = multer({ dest: '/tmp' });

router.get('/', (req, res) => {
  res.render('index', { sessionId: req.session.userId });
});

router.get('/upload', (req, res) => {
  res.render('upload');
});

router.post('/upload', upload.single('zipfile'), (req, res) => {
    const zipPath = req.file.path;
    const userDir = path.join(__dirname, '../uploads', req.session.userId);
  
    fs.mkdirSync(userDir, { recursive: true });
  
    // Command: unzip temp/file.zip -d target_dir
    execFile('unzip', [zipPath, '-d', userDir], (err, stdout, stderr) => {
      fs.unlinkSync(zipPath); // Clean up temp file
  
      if (err) {
        console.error('Unzip failed:', stderr);
        return res.status(500).send('Unzip error');
      }
  
      res.redirect('/files');
    });
  });

router.get('/files', (req, res) => {
  const userDir = path.join(__dirname, '../uploads', req.session.userId);
  fs.readdir(userDir, (err, files) => {
    if (err) return res.status(500).send('Error reading files');
    res.render('files', { files });
  });
});

router.get('/files/:filename', (req, res) => {
    const userDir = path.join(__dirname, '../uploads', req.session.userId);
    const requestedPath = path.normalize(req.params.filename);
    const filePath = path.resolve(userDir, requestedPath);
  
    // Prevent path traversal
    if (!filePath.startsWith(path.resolve(userDir))) {
      return res.status(400).send('Invalid file path');
    }
  
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.download(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

router.get('/debug/files', developmentOnly, (req, res) => {
    const userDir = path.join(__dirname, '../uploads', req.query.session_id);
    fs.readdir(userDir, (err, files) => {
    if (err) return res.status(500).send('Error reading files');
    res.render('files', { files });
  });
});

module.exports = router;