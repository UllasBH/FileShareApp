const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const fileState = document.getElementById('fileState');

const fileIconBig = document.getElementById('fileIconBig');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const uploadDate = document.getElementById('uploadDate');
const downloadCount = document.getElementById('downloadCount');
const downloadBtn = document.getElementById('downloadBtn');

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

function getShareIdFromPath() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1];
}

async function loadSharedFile() {
  const shareId = getShareIdFromPath();

  try {
    const res = await fetch(`/api/files/share/${shareId}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      loadingState.classList.add('hidden');
      errorState.classList.remove('hidden');
      return;
    }

    const file = data.file;

    fileIconBig.textContent = getFileIcon(file.mimeType, file.originalName);
    fileName.textContent = file.originalName;
    fileSize.textContent = formatBytes(file.size);
    uploadDate.textContent = formatDate(file.uploadedAt);
    downloadCount.textContent = file.downloads;
    downloadBtn.href = `/api/files/share/${shareId}/download`;

    loadingState.classList.add('hidden');
    fileState.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
  }
}

loadSharedFile();
