document.addEventListener('DOMContentLoaded', () => {
  // Check if highlight.js is available
  const highlightJsAvailable = typeof hljs !== 'undefined';
  
  // Initialize highlight.js if available
  if (highlightJsAvailable) {
    hljs.configure({
      languages: ['javascript', 'python', 'bash', 'css', 'html', 'java', 'json', 'markdown', 'typescript', 'xml']
    });
  } else {
    console.warn('highlight.js is not available. Code highlighting will be disabled.');
  }
  
  // Check if mermaid is available
  const mermaidAvailable = typeof mermaid !== 'undefined';
  
  // Initialize mermaid if available
  if (mermaidAvailable) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose'
    });
  } else {
    console.warn('mermaid is not available. Diagram rendering will be disabled.');
  }
  
  // DOM elements
  const directoryTree = document.getElementById('directory-tree');
  const refreshBtn = document.getElementById('refresh-btn');
  const toggleViewBtn = document.getElementById('toggle-view-btn');
  const showHiddenFilesCheckbox = document.getElementById('show-hidden-files');
  const fileNameElement = document.getElementById('file-name');
  const noFileSelected = document.getElementById('no-file-selected');
  const fileContent = document.getElementById('file-content');
  const markdownPreview = document.getElementById('markdown-preview');
  const markdownSource = document.getElementById('markdown-source');
  const sourceCode = document.getElementById('source-code');
  
  // Current state
  let currentFilePath = null;
  let viewMode = 'preview'; // 'preview' or 'source'
  let showHiddenFiles = false;
  
  // Load the root directory
  loadDirectory('/');
  
  // Event listeners
  refreshBtn.addEventListener('click', () => {
    loadDirectory('/');
  });
  
  showHiddenFilesCheckbox.addEventListener('change', () => {
    showHiddenFiles = showHiddenFilesCheckbox.checked;
    loadDirectory('/');
  });
  
  toggleViewBtn.addEventListener('click', () => {
    if (viewMode === 'preview') {
      viewMode = 'source';
      markdownPreview.classList.add('d-none');
      markdownSource.classList.remove('d-none');
    } else {
      viewMode = 'preview';
      markdownPreview.classList.remove('d-none');
      markdownSource.classList.add('d-none');
    }
  });
  
  /**
   * Load directory contents
   * @param {string} path - The path to load
   * @param {HTMLElement} parentElement - The parent element to append to (optional)
   */
  function loadDirectory(path, parentElement = null) {
    fetch(`/api/directory?path=${encodeURIComponent(path)}&includeHidden=${showHiddenFiles}`)
      .then(response => response.json())
      .then(data => {
        if (!parentElement) {
          // Root directory
          directoryTree.innerHTML = '';
          renderDirectoryItems(data.children, directoryTree);
        } else {
          // Subdirectory
          parentElement.innerHTML = '';
          renderDirectoryItems(data.children, parentElement);
        }
      })
      .catch(error => {
        console.error('Error loading directory:', error);
      });
  }
  
  /**
   * Render directory items
   * @param {Array} items - The items to render
   * @param {HTMLElement} container - The container to append to
   */
  function renderDirectoryItems(items, container) {
    if (!items || items.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'text-muted small p-2';
      emptyMessage.textContent = 'Empty directory';
      container.appendChild(emptyMessage);
      return;
    }
    
    items.forEach(item => {
      const template = document.getElementById('directory-item-template');
      const clone = document.importNode(template.content, true);
      
      const directoryItem = clone.querySelector('.directory-item');
      const header = clone.querySelector('.directory-item-header');
      const icon = clone.querySelector('.directory-icon');
      const name = clone.querySelector('.directory-name');
      const children = clone.querySelector('.directory-children');
      
      name.textContent = item.name;
      
      // Add hidden-item class if it's a hidden file/directory
      if (item.isHidden) {
        directoryItem.classList.add('hidden-item');
      }
      
      if (item.type === 'directory') {
        icon.classList.add('bi-folder');
        
        // Add click event to expand/collapse directory
        header.addEventListener('click', () => {
          if (children.classList.contains('expanded')) {
            children.classList.remove('expanded');
            icon.classList.remove('bi-folder-open');
            icon.classList.add('bi-folder');
          } else {
            children.classList.add('expanded');
            icon.classList.remove('bi-folder');
            icon.classList.add('bi-folder-open');
            
            // Load subdirectory contents if not already loaded
            if (children.children.length === 0) {
              loadDirectory(item.path, children);
            }
          }
        });
      } else {
        icon.classList.add('bi-file-earmark-text');
        
        // Add click event to load file content
        header.addEventListener('click', () => {
          // Remove active class from all items
          document.querySelectorAll('.directory-item-header.active').forEach(el => {
            el.classList.remove('active');
          });
          
          // Add active class to clicked item
          header.classList.add('active');
          
          // Load file content
          loadFileContent(item.path, item.name);
        });
      }
      
      container.appendChild(directoryItem);
    });
  }
  
  /**
   * Load file content
   * @param {string} path - The path to the file
   * @param {string} name - The name of the file
   */
  function loadFileContent(path, name) {
    currentFilePath = path;
    
    fetch(`/api/file?path=${encodeURIComponent(path)}`)
      .then(response => response.json())
      .then(data => {
        // Show file content area
        noFileSelected.classList.add('d-none');
        fileContent.classList.remove('d-none');
        
        // Set file name
        fileNameElement.textContent = name;
        
        // Set source code
        sourceCode.textContent = data.content;
        
        // Apply syntax highlighting if highlight.js is available
        if (typeof hljs !== 'undefined') {
          try {
            hljs.highlightElement(sourceCode);
          } catch (e) {
            console.warn('Error highlighting code:', e);
            // Continue without syntax highlighting if there's an error
          }
        }
        
        // Set preview HTML
        markdownPreview.innerHTML = data.html;
        
        // Process mermaid diagrams
        processMermaidDiagrams();
        
        // Show preview by default
        viewMode = 'preview';
        markdownPreview.classList.remove('d-none');
        markdownSource.classList.add('d-none');
      })
      .catch(error => {
        console.error('Error loading file:', error);
      });
  }
  
  /**
   * Process mermaid diagrams in the markdown content
   */
  function processMermaidDiagrams() {
    const codeBlocks = markdownPreview.querySelectorAll('pre code.language-mermaid');
    
    codeBlocks.forEach((codeBlock, index) => {
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.id = `mermaid-diagram-${index}`;
      mermaidDiv.textContent = codeBlock.textContent;
      
      // Replace the code block with the mermaid div
      const preElement = codeBlock.parentElement;
      preElement.parentElement.replaceChild(mermaidDiv, preElement);
    });
    
    // Render mermaid diagrams if mermaid is available
    if (typeof mermaid !== 'undefined') {
      try {
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
      } catch (e) {
        console.warn('Error initializing mermaid diagrams:', e);
        // Continue without mermaid diagrams if there's an error
      }
    }
  }
});
