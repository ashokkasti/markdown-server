const fs = require('fs');
const path = require('path');

/**
 * Scans a directory and returns a tree structure of files and directories
 * @param {string} rootDir - The root directory to scan
 * @param {string} relativePath - The relative path from the root directory
 * @param {boolean} includeHidden - Whether to include hidden files and directories
 * @returns {Object} - A tree structure of files and directories
 */
function scanDirectory(rootDir, relativePath = '', includeHidden = false) {
  const fullPath = path.join(rootDir, relativePath);
  const stats = fs.statSync(fullPath);
  
  if (!stats.isDirectory()) {
    return null;
  }
  
  const items = fs.readdirSync(fullPath);
  const result = {
    name: path.basename(fullPath),
    path: relativePath || '/',
    type: 'directory',
    children: []
  };
  
  for (const item of items) {
    const isHidden = item.startsWith('.');
    
    // Skip hidden files and directories if not included
    if (isHidden && !includeHidden) {
      continue;
    }
    
    const itemPath = path.join(relativePath, item);
    const fullItemPath = path.join(rootDir, itemPath);
    
    try {
      const itemStats = fs.statSync(fullItemPath);
      
      if (itemStats.isDirectory()) {
        result.children.push({
          name: item,
          path: itemPath,
          type: 'directory',
          isHidden,
          children: [] // We'll load these on demand
        });
      } else if (itemStats.isFile() && item.toLowerCase().endsWith('.md')) {
        result.children.push({
          name: item,
          path: itemPath,
          type: 'file',
          isHidden,
          size: itemStats.size,
          lastModified: itemStats.mtime.toISOString()
        });
      }
    } catch (err) {
      console.error(`Error reading ${fullItemPath}:`, err);
    }
  }
  
  // Sort directories first, then files, both alphabetically
  result.children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  return result;
}

/**
 * Gets the content of a markdown file
 * @param {string} rootDir - The root directory
 * @param {string} filePath - The relative path to the file
 * @returns {string} - The content of the file
 */
function getFileContent(rootDir, filePath) {
  const fullPath = path.join(rootDir, filePath);
  
  try {
    const stats = fs.statSync(fullPath);
    
    if (!stats.isFile()) {
      throw new Error('Not a file');
    }
    
    return fs.readFileSync(fullPath, 'utf8');
  } catch (err) {
    console.error(`Error reading file ${fullPath}:`, err);
    throw err;
  }
}

module.exports = {
  scanDirectory,
  getFileContent
};
