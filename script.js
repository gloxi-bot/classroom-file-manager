// script.js
document.addEventListener('DOMContentLoaded', function () {
    // Load from localStorage or default
    const savedFS = localStorage.getItem('fileSystem');
    const savedPath = localStorage.getItem('currentPath');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedView = localStorage.getItem('viewMode');
  
    const fileSystem = savedFS ? JSON.parse(savedFS) : {
      root: {
        type: 'folder',
        name: 'Home',
        children: {
          documents: {
            type: 'folder',
            name: 'Documents',
            children: {
              'report.txt': {
                type: 'file',
                name: 'report.txt',
                fileType: 'document',
                content: 'This is the report content.\nYou can edit or view it.',
                encrypted: false,
                versions: []
              },
              'notes.txt': {
                type: 'file',
                name: 'notes.txt',
                fileType: 'document',
                content: 'Some notes here...',
                encrypted: false,
                versions: []
              }
            }
          },
          pictures: {
            type: 'folder',
            name: 'Pictures',
            children: {
              'vacation.jpg': {
                type: 'file',
                name: 'vacation.jpg',
                fileType: 'image',
                content: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
                encrypted: false,
                versions: []
              }
            }
          },
          'readme.txt': {
            type: 'file',
            name: 'readme.txt',
            fileType: 'document',
            content: 'Welcome to the Advanced File Manager!',
            encrypted: false,
            versions: []
          }
        }
      }
    };
  
    let currentPath = savedPath ? JSON.parse(savedPath) : ['root'];
    let selectedItems = [];
    let filteredItems = null;
    let currentSort = 'name-asc';
    let isGridView = savedView ? savedView === 'grid' : true;
    let editingFileKey = null;
  
    const fileContainer = document.getElementById('file-container');
    const pathDisplay = document.getElementById('path');
    const deleteBtn = document.getElementById('delete-btn');
    const newFolderBtn = document.getElementById('new-folder-btn');
    const newFolderModal = document.getElementById('new-folder-modal');
    const folderNameInput = document.getElementById('folder-name-input');
    const createFolderBtn = document.getElementById('create-folder-btn');
    const contextMenu = document.getElementById('context-menu');
    const uploadBtn = document.getElementById('upload-btn');
    const previewModal = document.getElementById('preview-modal');
    const previewBody = document.getElementById('preview-body');
    const previewClose = document.getElementById('preview-close');
    const searchInput = document.getElementById('search-input');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const sortSelect = document.getElementById('sort-select');
    const viewToggle = document.getElementById('view-toggle');
    const fileEditor = document.getElementById('file-editor');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const previewTitle = document.getElementById('preview-title');
    const modalActions = saveEditBtn.parentElement;
    const previewCanvas = document.getElementById('preview-canvas');
    const ctx = previewCanvas.getContext('2d');
  
    // Save state to localStorage
    function saveState() {
      localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
      localStorage.setItem('currentPath', JSON.stringify(currentPath));
      localStorage.setItem('viewMode', isGridView ? 'grid' : 'list');
    }
  
    function getCurrentFolder() {
      let current = fileSystem;
      for (let i = 0; i < currentPath.length; i++) {
        current = current[currentPath[i]];
        if (i < currentPath.length - 1) {
          current = current.children;
        }
      }
      return current;
    }
  
    function filterItems(items, term) {
      if (!term) return items;
      const lowerTerm = term.toLowerCase();
      return items.filter(item => item.name.toLowerCase().includes(lowerTerm));
    }
  
    function sortItems(items) {
      switch (currentSort) {
        case 'name-asc':
          return items.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
          return items.sort((a, b) => b.name.localeCompare(a.name));
        case 'type':
          return items.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
          });
        default:
          return items;
      }
    }
  
    function renderFiles() {
      fileContainer.innerHTML = '';
      fileContainer.classList.toggle('list-view', !isGridView);
  
      const currentFolder = getCurrentFolder();
      const children = currentFolder.children || {};
  
      updatePathDisplay();
  
      let items = Object.keys(children).map(key => {
        return {
          key: key,
          ...children[key]
        };
      });
  
      if (filteredItems !== null) {
        items = filterItems(items, filteredItems);
      }
  
      items = sortItems(items);
  
      if (items.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = filteredItems ? 'No matching files or folders' : 'This folder is empty';
        emptyMessage.setAttribute('role', 'alert');
        fileContainer.appendChild(emptyMessage);
        return;
      }
  
      items.forEach(item => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.key = item.key;
        fileItem.dataset.type = item.type;
        fileItem.tabIndex = 0;
        fileItem.setAttribute('role', 'listitem');
        fileItem.setAttribute('aria-label', `${item.type} named ${item.name}`);
  
        if (selectedItems.includes(item.key)) {
          fileItem.classList.add('selected');
        }
  
        const fileIcon = document.createElement('div');
        fileIcon.className = 'file-icon';
  
        if (item.type === 'folder') {
          fileIcon.innerHTML = '📁';
          fileIcon.classList.add('folder-icon');
        } else {
          if (item.fileType === 'image') {
            fileIcon.innerHTML = '🖼️';
            fileIcon.classList.add('image-icon');
          } else {
            fileIcon.innerHTML = '📄';
            fileIcon.classList.add('document-icon');
          }
        }
  
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = item.name + (item.encrypted ? ' 🔒' : '');
  
        fileItem.appendChild(fileIcon);
        fileItem.appendChild(fileName);
  
        if (!isGridView) {
          const meta = document.createElement('div');
          meta.className = 'file-meta';
          meta.textContent = `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`;
          fileItem.appendChild(meta);
        }
  
        fileContainer.appendChild(fileItem);
  
        fileItem.addEventListener('dblclick', () => {
          if (item.type === 'folder') {
            currentPath.push(item.key);
            selectedItems = [];
            updateDeleteButton();
            renderFiles();
            saveState();
          } else {
            if (item.encrypted) {
              alert('File is encrypted. Please decrypt first.');
            } else {
              openFilePreview(item);
            }
          }
        });
  
        fileItem.addEventListener('click', (e) => {
          if (!e.ctrlKey && !e.metaKey) {
            document.querySelectorAll('.file-item.selected').forEach(el => {
              el.classList.remove('selected');
            });
            selectedItems = [];
          }
  
          if (fileItem.classList.contains('selected')) {
            fileItem.classList.remove('selected');
            selectedItems = selectedItems.filter(key => key !== item.key);
          } else {
            fileItem.classList.add('selected');
            selectedItems.push(item.key);
          }
  
          updateDeleteButton();
        });
  
        fileItem.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileItem.click();
          }
        });
  
        fileItem.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (!fileItem.classList.contains('selected')) {
            document.querySelectorAll('.file-item.selected').forEach(el => {
              el.classList.remove('selected');
            });
            selectedItems = [item.key];
            fileItem.classList.add('selected');
            updateDeleteButton();
          }
          showContextMenu(e.clientX, e.clientY);
        });
      });
    }
  
    function updatePathDisplay() {
      pathDisplay.innerHTML = '';
      let path = '';
      for (let i = 0; i < currentPath.length; i++) {
        const segment = currentPath[i];
        path += (i > 0 ? '/' : '') + segment;
        const span = document.createElement('span');
        span.dataset.path = path;
        span.tabIndex = 0;
        let folderObj = fileSystem;
        for (let j = 0; j <= i; j++) {
          folderObj = folderObj[currentPath[j]];
          if (j < i) folderObj = folderObj.children;
        }
        span.textContent = folderObj.name;
        if (i < currentPath.length - 1) {
          span.addEventListener('click', () => {
            currentPath = currentPath.slice(0, i + 1);
            selectedItems = [];
            updateDeleteButton();
            renderFiles();
            saveState();
          });
          span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              span.click();
            }
          });
        } else {
          span.setAttribute('aria-current', 'page');
        }
        pathDisplay.appendChild(span);
        if (i < currentPath.length - 1) {
          const separator = document.createElement('span');
          separator.className = 'path-separator';
          separator.textContent = ' > ';
          pathDisplay.appendChild(separator);
        }
      }
    }
  
    function updateDeleteButton() {
      deleteBtn.disabled = selectedItems.length === 0;
      deleteBtn.setAttribute('aria-disabled', selectedItems.length === 0);
    }
  
    function showContextMenu(x, y) {
      contextMenu.style.display = 'block';
      contextMenu.style.left = `${x}px`;
      contextMenu.style.top = `${y}px`;
      const rect = contextMenu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        contextMenu.style.left = `${window.innerWidth - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = `${y - rect.height}px`;
      }
      const firstItem = contextMenu.querySelector('.context-menu-item');
      if (firstItem) firstItem.focus();
    }
  
    function hideContextMenu() {
      contextMenu.style.display = 'none';
    }
  
    function deleteSelectedItems() {
      if (selectedItems.length === 0) return;
      if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
        const currentFolder = getCurrentFolder();
        selectedItems.forEach(key => {
          delete currentFolder.children[key];
        });
        selectedItems = [];
        updateDeleteButton();
        renderFiles();
        saveState();
      }
    }
  
    function openFilePreview(item) {
      previewBody.style.display = 'block';
      fileEditor.style.display = 'none';
      modalActions.style.display = 'none';
      previewCanvas.style.display = 'none';
      previewBody.innerHTML = '';
      previewTitle.textContent = item.name;
      if (item.fileType === 'image' && item.content) {
        previewCanvas.style.display = 'block';
        const img = new Image();
        img.onload = () => {
          const maxWidth = previewCanvas.clientWidth;
          const maxHeight = previewCanvas.clientHeight;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
          previewCanvas.width = width;
          previewCanvas.height = height;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = item.content;
      } else if (item.fileType === 'document' && item.content) {
        const pre = document.createElement('pre');
        pre.textContent = item.content;
        previewBody.appendChild(pre);
      } else {
        const p = document.createElement('p');
        p.textContent = 'No preview available.';
        previewBody.appendChild(p);
      }
      editingFileKey = null;
      previewModal.style.display = 'flex';
      previewModal.focus();
    }
  
    previewClose.addEventListener('click', () => {
      previewModal.style.display = 'none';
      editingFileKey = null;
    });
  
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        previewModal.style.display = 'none';
        editingFileKey = null;
      }
    });
  
    newFolderBtn.addEventListener('click', () => {
      newFolderModal.style.display = 'flex';
      folderNameInput.value = '';
      folderNameInput.focus();
      newFolderBtn.setAttribute('aria-expanded', 'true');
    });
  
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        newFolderModal.style.display = 'none';
        newFolderBtn.setAttribute('aria-expanded', 'false');
      });
    });
  
    createFolderBtn.addEventListener('click', () => {
      const folderName = folderNameInput.value.trim();
      if (!folderName) {
        alert('Folder name cannot be empty.');
        folderNameInput.focus();
        return;
      }
      const currentFolder = getCurrentFolder();
      const key = folderName.toLowerCase().replace(/\s+/g, '-');
      if (currentFolder.children && currentFolder.children[key]) {
        alert('A folder or file with this name already exists.');
        folderNameInput.focus();
        return;
      }
      if (!currentFolder.children) {
        currentFolder.children = {};
      }
      currentFolder.children[key] = {
        type: 'folder',
        name: folderName,
        children: {}
      };
      newFolderModal.style.display = 'none';
      newFolderBtn.setAttribute('aria-expanded', 'false');
      renderFiles();
      saveState();
    });
  
    uploadBtn.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
          const currentFolder = getCurrentFolder();
          if (!currentFolder.children) {
            currentFolder.children = {};
          }
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const key = file.name.toLowerCase().replace(/\s+/g, '-');
            const fileType = file.type.startsWith('image/') ? 'image' : 'document';
            if (fileType === 'image') {
              const reader = new FileReader();
              reader.onload = (event) => {
                currentFolder.children[key] = {
                  type: 'file',
                  name: file.name,
                  fileType: fileType,
                  content: event.target.result,
                  encrypted: false,
                  versions: []
                };
                renderFiles();
                saveState();
              };
              reader.readAsDataURL(file);
            } else {
              const reader = new FileReader();
              reader.onload = (event) => {
                currentFolder.children[key] = {
                  type: 'file',
                  name: file.name,
                  fileType: fileType,
                  content: event.target.result,
                  encrypted: false,
                  versions: []
                };
                renderFiles();
                saveState();
              };
              reader.readAsText(file);
            }
          }
        }
      });
      fileInput.click();
    });
  
    contextMenu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;
      const currentFolder = getCurrentFolder();
      if (selectedItems.length !== 1) {
        if (action === 'delete') {
          deleteSelectedItems();
        }
        hideContextMenu();
        return;
      }
      const selectedKey = selectedItems[0];
      const selectedItem = currentFolder.children[selectedKey];
      if (!selectedItem) {
        hideContextMenu();
        return;
      }
      if (action === 'open') {
        if (selectedItem.type === 'folder') {
          currentPath.push(selectedKey);
          selectedItems = [];
          updateDeleteButton();
          renderFiles();
          saveState();
        } else {
          if (selectedItem.encrypted) {
            alert('File is encrypted. Please decrypt first.');
          } else {
            openFilePreview(selectedItem);
          }
        }
      } else if (action === 'rename') {
        const newName = prompt('Enter new name:', selectedItem.name);
        if (newName && newName.trim() !== '') {
          const newKey = newName.toLowerCase().replace(/\s+/g, '-');
          if (currentFolder.children[newKey] && newKey !== selectedKey) {
            alert('A folder or file with this name already exists.');
            return;
          }
          currentFolder.children[newKey] = { ...selectedItem, name: newName };
          delete currentFolder.children[selectedKey];
          selectedItems = [newKey];
          renderFiles();
          saveState();
        }
      } else if (action === 'delete') {
        deleteSelectedItems();
      } else if (action === 'copy-name') {
        navigator.clipboard.writeText(selectedItem.name).then(() => {
          alert(`Copied name: ${selectedItem.name}`);
        }).catch(() => {
          alert('Failed to copy name.');
        });
      } else if (action === 'copy-path') {
        const fullPath = [...currentPath.slice(1), selectedItem.name].join('/');
        navigator.clipboard.writeText(fullPath).then(() => {
          alert(`Copied path: ${fullPath}`);
        }).catch(() => {
          alert('Failed to copy path.');
        });
      }
      hideContextMenu();
    });
  
    document.addEventListener('click', (e) => {
      if (!contextMenu.contains(e.target)) {
        hideContextMenu();
      }
    });
  
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideContextMenu();
        if (newFolderModal.style.display === 'flex') {
          newFolderModal.style.display = 'none';
          newFolderBtn.setAttribute('aria-expanded', 'false');
        }
        if (previewModal.style.display === 'flex') {
          previewModal.style.display = 'none';
          editingFileKey = null;
        }
      }
    });
  
    fileContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileContainer.classList.add('dragover');
    });
  
    fileContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (e.target === fileContainer) {
        fileContainer.classList.remove('dragover');
      }
    });
  
    fileContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      fileContainer.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const currentFolder = getCurrentFolder();
        if (!currentFolder.children) {
          currentFolder.children = {};
        }
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const key = file.name.toLowerCase().replace(/\s+/g, '-');
          const fileType = file.type.startsWith('image/') ? 'image' : 'document';
          if (fileType === 'image') {
            const reader = new FileReader();
            reader.onload = (event) => {
              currentFolder.children[key] = {
                type: 'file',
                name: file.name,
                fileType: fileType,
                content: event.target.result,
                encrypted: false,
                versions: []
              };
              renderFiles();
              saveState();
            };
            reader.readAsDataURL(file);
          } else {
            const reader = new FileReader();
            reader.onload = (event) => {
              currentFolder.children[key] = {
                type: 'file',
                name: file.name,
                fileType: fileType,
                content: event.target.result,
                encrypted: false,
                versions: []
              };
              renderFiles();
              saveState();
            };
            reader.readAsText(file);
          }
        }
      }
    });
  
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      filteredItems = val.length > 0 ? val : null;
      selectedItems = [];
      updateDeleteButton();
      renderFiles();
    });
  
    function setDarkMode(enabled) {
      if (enabled) {
        document.body.classList.add('dark');
        darkModeToggle.textContent = '☀️';
        darkModeToggle.setAttribute('aria-pressed', 'true');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.body.classList.remove('dark');
        darkModeToggle.textContent = '🌙';
        darkModeToggle.setAttribute('aria-pressed', 'false');
        localStorage.setItem('darkMode', 'false');
      }
    }
  
    darkModeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark');
      setDarkMode(!isDark);
    });
  
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderFiles();
      saveState();
    });
  
    viewToggle.addEventListener('click', () => {
      isGridView = !isGridView;
      viewToggle.textContent = isGridView ? '🔳' : '📋';
      viewToggle.setAttribute('aria-pressed', isGridView);
      renderFiles();
      saveState();
    });
  
    // Initialize view toggle icon
    viewToggle.textContent = isGridView ? '🔳' : '📋';
    viewToggle.setAttribute('aria-pressed', isGridView);
  
    // Save state initially
    saveState();
  
    renderFiles();
  });