// ---------- State ----------
let allFiles = [];
let currentSearch = '';

// ---------- DOM references ----------
const welcomeText = document.getElementById('welcomeText');
const workspaceNameText = document.getElementById('workspaceNameText');
const storageText = document.getElementById('storageText');
const sidebarStorageText = document.getElementById('sidebarStorageText');
const mainStorageFill = document.getElementById('mainStorageFill');
const sidebarStorageFill = document.getElementById('sidebarStorageFill');
const fileCountText = document.getElementById('fileCountText');

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadQueue = document.getElementById('uploadQueue');

const filesGrid = document.getElementById('filesGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

const logoutBtn = document.getElementById('logoutBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const modeIcon = document.getElementById('modeIcon');

const toast = document.getElementById('toast');

const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const closePreview = document.getElementById('closePreview');

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB soft display limit for the progress bar

// ---------- Utility functions ----------
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function getFileIcon(mimeType, name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📄';
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📽️';
  return '📁';
}

// ---------- Load workspace info ----------
async function loadWorkspaceInfo() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (!res.ok || !data.success) {
      window.location.href = '/';
      return;
    }

    const ws = data.workspace;
    welcomeText.textContent = `Welcome, ${ws.workspaceName}`;
    workspaceNameText.textContent = ws.workspaceName;
    fileCountText.textContent = ws.fileCount;

    const usedText = formatBytes(ws.storageUsed);
    storageText.textContent = usedText;
    sidebarStorageText.textContent = usedText;

    const pct = Math.min(100, (ws.storageUsed / STORAGE_LIMIT_BYTES) * 100);
    mainStorageFill.style.width = `${pct}%`;
    sidebarStorageFill.style.width = `${pct}%`;
  } catch (err) {
    console.error(err);
  }
}

// ---------- Load files ----------
async function loadFiles() {
  try {
    const url = currentSearch ? `/api/files?search=${encodeURIComponent(currentSearch)}` : '/api/files';
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || 'Could not load files.', 'error');
      return;
    }

    allFiles = data.files;
    renderFiles();
  } catch (err) {
    console.error(err);
    showToast('Network error loading files.', 'error');
  }
}

function renderFiles() {
  filesGrid.innerHTML = '';

  if (allFiles.length === 0) {
    emptyState.classList.remove('hidden');
    filesGrid.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  filesGrid.classList.remove('hidden');

  allFiles.forEach((file) => {
    const card = document.createElement('div');
    card.className = 'file-card';

    const isImage = file.mimeType.startsWith('image/');
    const icon = getFileIcon(file.mimeType, file.originalName);

    card.innerHTML = `
      ${isImage
        ? `<img class="file-preview-thumb" src="/api/files/share/${file.shareId}/download" alt="${escapeHtml(file.originalName)}">`
        : ''
      }
      <div class="file-icon-row">
        <div class="file-type-icon">${icon}</div>
        <div style="overflow:hidden;">
          <div class="file-name" title="${escapeHtml(file.originalName)}">${escapeHtml(file.originalName)}</div>
          <div class="file-meta">${formatBytes(file.size)} • ${formatDate(file.uploadedAt)}</div>
        </div>
      </div>
      <div class="file-actions">
        <button class="download-btn" title="Download" aria-label="Download ${escapeHtml(file.originalName)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="preview-btn" title="Preview" aria-label="Preview ${escapeHtml(file.originalName)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/></svg>
        </button>
        <button class="share-btn" title="Copy Share Link" aria-label="Copy share link for ${escapeHtml(file.originalName)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M10 14a5 5 0 007.07 0l2-2a5 5 0 00-7.07-7.07l-1 1M14 10a5 5 0 00-7.07 0l-2 2a5 5 0 007.07 7.07l1-1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="delete-btn" title="Delete" aria-label="Delete ${escapeHtml(file.originalName)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;

    card.querySelector('.download-btn').addEventListener('click', () => downloadFile(file._id));
    card.querySelector('.preview-btn').addEventListener('click', () => previewFile(file));
    card.querySelector('.share-btn').addEventListener('click', () => copyShareLink(file.shareId));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteFile(file._id, file.originalName));

    filesGrid.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Download ----------
function downloadFile(id) {
  window.location.href = `/api/files/download/${id}`;
}

// ---------- Preview ----------
function previewFile(file) {
  const url = `/api/files/share/${file.shareId}/download`;
  let inner = '';

  if (file.mimeType.startsWith('image/')) {
    inner = `<img src="${url}" alt="${escapeHtml(file.originalName)}">`;
  } else if (file.mimeType.startsWith('video/')) {
    inner = `<video src="${url}" controls autoplay></video>`;
  } else if (file.mimeType.startsWith('audio/')) {
    inner = `<audio src="${url}" controls style="width:100%; margin-top:40px;"></audio>`;
  } else if (file.mimeType === 'application/pdf') {
    inner = `<iframe src="${url}"></iframe>`;
  } else {
    inner = `<p style="padding:40px; text-align:center; color:var(--text-muted);">No preview available for this file type.<br><br><strong>${escapeHtml(file.originalName)}</strong></p>`;
  }

  previewContent.innerHTML = inner;
  previewModal.classList.remove('hidden');
}

closePreview.addEventListener('click', () => {
  previewModal.classList.add('hidden');
  previewContent.innerHTML = '';
});

previewModal.addEventListener('click', (e) => {
  if (e.target === previewModal) {
    previewModal.classList.add('hidden');
    previewContent.innerHTML = '';
  }
});

// ---------- Share ----------
function copyShareLink(shareId) {
  const link = `${window.location.origin}/download/${shareId}`;
  navigator.clipboard.writeText(link)
    .then(() => showToast('Share link copied to clipboard!', 'success'))
    .catch(() => showToast('Could not copy link.', 'error'));
}

// ---------- Delete ----------
async function deleteFile(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || 'Delete failed.', 'error');
      return;
    }

    showToast('File deleted.', 'success');
    await loadFiles();
    await loadWorkspaceInfo();
  } catch (err) {
    console.error(err);
    showToast('Network error during delete.', 'error');
  }
}

// ---------- Upload (with progress via XHR for real progress events) ----------
function uploadFilesToServer(fileList) {
  if (!fileList || fileList.length === 0) return;

  const formData = new FormData();
  Array.from(fileList).forEach((f) => formData.append('files', f));

  const queueItem = document.createElement('div');
  queueItem.className = 'upload-item';

  const names = Array.from(fileList).map((f) => f.name).join(', ');
  queueItem.innerHTML = `
    <div class="upload-item-top">
      <span class="upload-item-name" title="${escapeHtml(names)}">${escapeHtml(names)}</span>
      <span class="upload-item-pct">0%</span>
    </div>
    <div class="progress-track"><div class="progress-fill"></div></div>
  `;
  uploadQueue.appendChild(queueItem);

  const pctLabel = queueItem.querySelector('.upload-item-pct');
  const progressFill = queueItem.querySelector('.progress-fill');

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/files/upload');

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      progressFill.style.width = `${pct}%`;
      pctLabel.textContent = `${pct}%`;
    }
  });

  xhr.onload = async () => {
    let data;
    try {
      data = JSON.parse(xhr.responseText);
    } catch {
      data = { success: false, message: 'Unexpected server response.' };
    }

    if (xhr.status >= 200 && xhr.status < 300 && data.success) {
      progressFill.classList.add('done');
      pctLabel.textContent = 'Done';
      showToast(data.message || 'Upload complete!', 'success');
      await loadFiles();
      await loadWorkspaceInfo();
    } else {
      progressFill.classList.add('error');
      pctLabel.textContent = 'Failed';
      showToast(data.message || 'Upload failed.', 'error');
    }

    setTimeout(() => queueItem.remove(), 4000);
  };

  xhr.onerror = () => {
    progressFill.classList.add('error');
    pctLabel.textContent = 'Failed';
    showToast('Network error during upload.', 'error');
    setTimeout(() => queueItem.remove(), 4000);
  };

  xhr.send(formData);
}

// ---------- Drag & drop ----------
browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  uploadFilesToServer(fileInput.files);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((evt) => {
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((evt) => {
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
  });
});

dropZone.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  uploadFilesToServer(files);
});

// ---------- Search ----------
let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = searchInput.value.trim();
    loadFiles();
  }, 300);
});

// ---------- Logout ----------
logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (err) {
    console.error(err);
    window.location.href = '/';
  }
});

// ---------- Dark mode ----------
function applyDarkModePreference() {
  const saved = localStorage.getItem('fileshareapp-theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
  }
}

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('fileshareapp-theme', isLight ? 'light' : 'dark');
});

// ---------- Init ----------
applyDarkModePreference();
loadWorkspaceInfo();
loadFiles();