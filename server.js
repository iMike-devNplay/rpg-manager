const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend/dist/frontend'));

// Route pour servir l'application Angular
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/frontend/index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 RPG Manager server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: frontend/dist/frontend`);
});

module.exports = app;