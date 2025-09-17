const express = require('express');
const http = require('http');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');
const socketIo = require('socket.io');
const os = require('os');
const { scanDirectory, getFileContent } = require('./directory-scanner');

// Configure marked with highlight.js for syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

/**
 * Start the markdown server
 * @param {string} directory - The directory to serve
 * @param {number} port - The port to listen on
 * @returns {Promise<Object>} - Server information
 */
async function start(directory, port) {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);
  
  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, '../public')));
  
  // API endpoint to get directory structure
  app.get('/api/directory', (req, res) => {
    try {
      const relativePath = req.query.path || '';
      const includeHidden = req.query.includeHidden === 'true';
      const result = scanDirectory(directory, relativePath, includeHidden);
      res.json(result);
    } catch (err) {
      console.error('Error scanning directory:', err);
      res.status(500).json({ error: 'Failed to scan directory' });
    }
  });
  
  // API endpoint to get file content
  app.get('/api/file', (req, res) => {
    try {
      const filePath = req.query.path;
      
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      const content = getFileContent(directory, filePath);
      
      // Convert markdown to HTML
      const html = marked(content);
      
      res.json({
        content,
        html
      });
    } catch (err) {
      console.error('Error reading file:', err);
      res.status(500).json({ error: 'Failed to read file' });
    }
  });
  
  // Serve the main HTML file for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
  
  // Find an available port if the specified one is in use
  const findAvailablePort = async (startPort) => {
    let currentPort = startPort;
    
    while (true) {
      try {
        await new Promise((resolve, reject) => {
          server.listen(currentPort, () => {
            server.close(() => resolve());
          });
          
          server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              currentPort++;
              reject(err);
            } else {
              reject(err);
            }
          });
        });
        
        return currentPort;
      } catch (err) {
        if (err.code !== 'EADDRINUSE') {
          throw err;
        }
      }
    }
  };
  
  // Get all network interfaces
  function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (!iface.internal && iface.family === 'IPv4') {
          addresses.push({
            name,
            address: iface.address
          });
        }
      }
    }
    
    return addresses;
  }
  
  // Start the server
  const availablePort = await findAvailablePort(port);
  
  return new Promise((resolve, reject) => {
    // Bind to all network interfaces (0.0.0.0)
    server.listen(availablePort, '0.0.0.0', () => {
      const networkInterfaces = getNetworkInterfaces();
      
      resolve({
        port: availablePort,
        directory,
        networkInterfaces
      });
    });
    
    server.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  start
};
