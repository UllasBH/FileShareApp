const infoWorkspaceName = document.getElementById('infoWorkspaceName');
const infoCreatedAt = document.getElementById('infoCreatedAt');
const infoFileCount = document.getElementById('infoFileCount');
const infoStorageUsed = document.getElementById('infoStorageUsed');
const settingsStorageFill = document.getElementById('settingsStorageFill');
const sidebarStorageText = document.getElementById('sidebarStorageText');
const sidebarStorageFill = document.getElementById('sidebarStorageFill');

const changePasswordForm = document.getElementById('changePasswordForm');
const settingsError = document.getElementById('settingsError');
const settingsInfo = document.getElementById('settingsInfo');
const changePasswordBtn = document.getElementById('changePasswordBtn');

const logoutBtn = document.getElementById('logoutBtn');
const logoutBtn2 = document.getElementById('logoutBtn2');
const toast = document.getElementById('toast');

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB soft display limit

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

async function loadWorkspaceInfo() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (!res.ok || !data.success) {
      window.location.href = '/';
      return;
    }

    const ws = data.workspace;
    infoWorkspaceName.textContent = ws.workspaceName;
    infoCreatedAt.textContent = formatDate(ws.createdAt);
    infoFileCount.textContent = ws.fileCount;

    const usedText = formatBytes(ws.storageUsed);
    infoStorageUsed.textContent = usedText;
    sidebarStorageText.textContent = usedText;

    const pct = Math.min(100, (ws.storageUsed / STORAGE_LIMIT_BYTES) * 100);
    settingsStorageFill.style.width = `${pct}%`;
    sidebarStorageFill.style.width = `${pct}%`;
  } catch (err) {
    console.error(err);
  }
}

function hideMessages() {
  settingsError.classList.add('hidden');
  settingsInfo.classList.add('hidden');
}

changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    settingsError.textContent = 'New passwords do not match.';
    settingsError.classList.remove('hidden');
    return;
  }

  if (newPassword.length < 4) {
    settingsError.textContent = 'New password must be at least 4 characters.';
    settingsError.classList.remove('hidden');
    return;
  }

  changePasswordBtn.disabled = true;
  changePasswordBtn.textContent = 'Updating...';

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      settingsError.textContent = data.message || 'Could not update password.';
      settingsError.classList.remove('hidden');
    } else {
      settingsInfo.textContent = 'Password updated successfully!';
      settingsInfo.classList.remove('hidden');
      changePasswordForm.reset();
      showToast('Password changed successfully.', 'success');
    }
  } catch (err) {
    console.error(err);
    settingsError.textContent = 'Network error. Please try again.';
    settingsError.classList.remove('hidden');
  } finally {
    changePasswordBtn.disabled = false;
    changePasswordBtn.textContent = 'Update Password';
  }
});

async function doLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (err) {
    console.error(err);
    window.location.href = '/';
  }
}

logoutBtn.addEventListener('click', doLogout);
logoutBtn2.addEventListener('click', doLogout);

// Apply saved theme preference
if (localStorage.getItem('fileshareapp-theme') === 'light') {
  document.body.classList.add('light-mode');
}

loadWorkspaceInfo();
