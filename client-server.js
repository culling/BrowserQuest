const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from client-build directory
app.use(express.static(path.join(__dirname, 'client-build')));

// Handle all routes by serving index.html (for single page application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client-build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`BrowserQuest client server running at http://localhost:${PORT}`);
    console.log('Serving files from: client-build/');
    console.log('Make sure the game server is running on port 8000 before connecting');
});