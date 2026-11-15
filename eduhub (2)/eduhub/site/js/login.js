// Trang đăng nhập và tạo tài khoản
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const statusEl = document.querySelector('#status');
const next = safeNext(new URLSearchParams(location.search).get('next'));

const login = async (email, password) => {
  const data = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
  setToken(data.accessToken);
  location.href = next;
};

const handleSubmit = (form, action, fallback) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus(statusEl, 'Đang xử lý…');
    try {
      await action(new FormData(form));
    } catch (error) {
      setStatus(statusEl, describeError(error, fallback), true);
      button.disabled = false;
    }
  });
};

handleSubmit(
  loginForm,
  (data) => login(data.get('email').trim(), data.get('password')),
  'Không đăng nhập được, vui lòng thử lại.',
);

handleSubmit(
  registerForm,
  async (data) => {
    const email = data.get('email').trim();
    const password = data.get('password');
    await apiFetch('/api/auth/register', {
      method: 'POST',
      body: { studentId: data.get('studentId').trim(), name: data.get('name').trim(), email, password },
    });
    await login(email, password);
  },
  'Không tạo được tài khoản, vui lòng thử lại.',
);

getCurrentUser().then((user) => {
  if (user) location.href = next;
});
