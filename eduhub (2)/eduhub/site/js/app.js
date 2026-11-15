// EduHub — mã dùng chung cho mọi trang: gọi API, xác thực, tiện ích DOM
const API_URL = 'http://localhost:4000';

// Tiện ích: đổi giờ UTC sang giờ Việt Nam, vd "08:00 12/09/2026"
const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

// "Còn 12/40 chỗ" hoặc "Hết chỗ" khi đã đủ
const formatSeats = (event) => {
  const remaining = event.capacity - event.registeredCount;
  return remaining <= 0 ? 'Hết chỗ' : `Còn ${remaining}/${event.capacity} chỗ`;
};

const isFull = (event) => event.registeredCount >= event.capacity;

// Tạo phần tử bằng createElement; nội dung luôn gán bằng textContent
const el = (tag, { text, className, attrs = {} } = {}, ...children) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.append(...children);
  return node;
};

const setStatus = (node, message, isError = false) => {
  node.textContent = message;
  node.classList.toggle('is-error', isError);
};

// ---------- Xác thực ----------
const TOKEN_KEY = 'eduhub.accessToken';
const SESSION_KEY = 'eduhub.hasSession'; // cờ báo có thể có cookie làm mới phiên

const getToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
};

const hasSession = () => {
  try { return localStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
};

const setToken = (token) => {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(SESSION_KEY, '1');
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch { /* trình duyệt chặn lưu trữ: bỏ qua */ }
};

class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let refreshing = null; // dùng chung một lần làm mới phiên cho nhiều request

const refreshSession = () => {
  refreshing ??= fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) throw new ApiError(response.status, 'Phiên đăng nhập đã hết hạn.');
      const data = await response.json();
      setToken(data.accessToken);
      return data.accessToken;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
};

const apiFetch = async (path, { method = 'GET', body } = {}) => {
  const send = () => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await send();
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    try {
      await refreshSession();
      response = await send();
    } catch {
      setToken(null);
    }
  }
  if (!response.ok) {
    let problem = {};
    try { problem = await response.json(); } catch { /* không có nội dung JSON */ }
    throw new ApiError(response.status, problem.detail ?? problem.title ?? 'Có lỗi xảy ra.', problem.errors);
  }
  return response.status === 204 ? null : response.json();
};

// Trả về thông tin người dùng hiện tại, hoặc null nếu chưa đăng nhập
let currentUserPromise = null;
const getCurrentUser = () => {
  currentUserPromise ??= (async () => {
    try {
      if (!getToken()) {
        if (!hasSession()) return null;
        await refreshSession();
      }
      return await apiFetch('/api/members/me');
    } catch {
      return null;
    }
  })();
  return currentUserPromise;
};

// Gom thông báo lỗi theo từng trường thành một chuỗi
const describeError = (error, fallback) => {
  if (error instanceof ApiError) {
    const details = error.errors ? Object.values(error.errors).flat() : [];
    return details.length ? details.join(' ') : error.message;
  }
  return fallback;
};

// Chỉ cho chuyển hướng tới trang nội bộ, tránh chuyển sang địa chỉ lạ
const safeNext = (value, fallback = 'index.html') =>
  /^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(value ?? '') ? value : fallback;

// ---------- Đầu trang: nút đăng nhập / đăng xuất ----------
const renderAuthSlot = async () => {
  const slot = document.querySelector('#auth-slot');
  if (!slot) return;
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    slot.replaceChildren(el('a', { text: 'Đăng nhập', attrs: { href: `login.html?next=${next}` } }));
    return;
  }
  const logout = el('button', { text: 'Đăng xuất', className: 'link-button', attrs: { type: 'button' } });
  logout.addEventListener('click', async () => {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch { /* vẫn đăng xuất phía trình duyệt */ }
    setToken(null);
    location.href = 'index.html';
  });
  const items = [el('span', { text: user.name, className: 'user-name' }), logout];
  if (user.role === 'Admin') items.unshift(el('a', { text: 'Quản trị', attrs: { href: 'admin.html' }, className: 'admin-link' }));
  slot.replaceChildren(...items);
};

renderAuthSlot();
