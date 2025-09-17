#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const server = require('../lib/server');
const packageJson = require('../package.json');
// We'll use dynamic import for open package

program
  .name('markdown-server')
  .description('A CLI tool to serve and preview markdown files with directory navigation')
  .version(packageJson.version)
  .option('-p, --port <port>', 'Port to use', '3000')
  .option('-o, --open', 'Open browser automatically', true)
  .option('-d, --directory <directory>', 'Directory to serve', process.cwd())
  .parse(process.argv);

const options = program.opts();

// Ensure the directory exists
const directoryPath = path.resolve(options.directory);
if (!fs.existsSync(directoryPath)) {
  console.error(`Error: Directory "${directoryPath}" does not exist.`);
  process.exit(1);
}

// ASCII art for Markdown Server
function displayAsciiArt() {
  console.log(`
  ███╗   ███╗ █████╗ ██████╗ ██╗  ██╗██████╗  ██████╗ ██╗    ██╗███╗   ██╗
  ████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔═══██╗██║    ██║████╗  ██║
  ██╔████╔██║███████║██████╔╝█████╔╝ ██║  ██║██║   ██║██║ █╗ ██║██╔██╗ ██║
  ██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ██║  ██║██║   ██║██║███╗██║██║╚██╗██║
  ██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗██████╔╝╚██████╔╝╚███╔███╔╝██║ ╚████║
  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝
  ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗                        
  ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗                       
  ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝                       
  ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗                       
  ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║                       
  ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝                       
  `);
}

// Start the server
const port = parseInt(options.port, 10);
server.start(directoryPath, port)
  .then(serverInfo => {
    displayAsciiArt();
    
    console.log(`\n📁 Serving files from: ${serverInfo.directory}`);
    console.log('\n🌐 Available on:');
    console.log(`   • Local:   http://localhost:${serverInfo.port}`);
    
    // Display all network interfaces
    if (serverInfo.networkInterfaces && serverInfo.networkInterfaces.length > 0) {
      serverInfo.networkInterfaces.forEach(iface => {
        console.log(`   • Network: http://${iface.address}:${serverInfo.port} (${iface.name})`);
      });
    }
    
    console.log(`\n⚡ Press Ctrl+C to stop the server\n`);

    // Open browser if requested
    if (options.open) {
      import('open').then(openModule => {
        openModule.default(`http://localhost:${serverInfo.port}`);
      }).catch(err => {
        console.error('Failed to open browser:', err);
      });
    }
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
