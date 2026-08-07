const authForm = document.getElementById('authForm');
const errorBox = document.getElementById('errorBox');
const infoBox = document.getElementById('infoBox');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
});

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  infoBox.classList.add('hidden');
}

function showInfo(message) {
  infoBox.textContent = message;
  infoBox.classList.remove('hidden');
  errorBox.classList.add('hidden');
}

function hideMessages() {
  errorBox.classList.add('hidden');
  infoBox.classList.add('hidden');
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.textContent = isLoading ? 'Please wait...' : 'Open Workspace';
  btnSpinner.classList.toggle('hidden', !isLoading);
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();

  const workspaceName = document.getElementById('workspaceName').value.trim();
  const password = passwordInput.value;

  if (workspaceName.length < 3) {
    showError('Workspace name must be at least 3 characters.');
    return;
  }
  if (password.length < 4) {
    showError('Password must be at least 4 characters.');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceName, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showError(data.message || 'Something went wrong.');
      setLoading(false);
      return;
    }

    if (data.created) {
      showInfo(`Workspace "${data.workspaceName}" created! Redirecting...`);
    } else {
      showInfo('Login successful! Redirecting...');
    }

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 700);
  } catch (err) {
    console.error(err);
    showError('Network error. Please try again.');
    setLoading(false);
  }
});
