// Trang quản trị: sự kiện, câu lạc bộ, đăng ký và check-in (chỉ dành cho Admin)
const statusEl = document.querySelector('#status');
const content = document.querySelector('#admin-content');

const REGISTRATION_LABELS = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã huỷ' };
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// Ô nhập thời gian là giờ Việt Nam (UTC+7); API lưu UTC
const toIso = (local) => new Date(`${local}:00+07:00`).toISOString();
const toLocalInput = (iso) => new Date(Date.parse(iso) + VN_OFFSET_MS).toISOString().slice(0, 16);

const button = (text, className, onClick) => {
  const node = el('button', { text, className: `btn ${className}`, attrs: { type: 'button' } });
  node.addEventListener('click', onClick);
  return node;
};

const row = (title, meta, ...actions) =>
  el('li', { className: 'admin-row' },
    el('div', {}, el('strong', { text: title }), el('p', { text: meta, className: 'note' })),
    el('div', { className: 'actions' }, ...actions));

const run = async (action, fallback) => {
  try {
    await action();
  } catch (error) {
    setStatus(statusEl, describeError(error, fallback), true);
  }
};

// ---------- Thẻ chức năng ----------
const tabButtons = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('.panel');

const showTab = (name) => {
  for (const tab of tabButtons) {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  }
  for (const panel of panels) panel.hidden = panel.id !== `tab-${name}`;
  setStatus(statusEl, '');
};

for (const tab of tabButtons) tab.addEventListener('click', () => showTab(tab.dataset.tab));

// ---------- Dữ liệu dùng chung ----------
let clubs = [];
let events = [];

const fetchAllEvents = async () => {
  const items = [];
  let total = Infinity;
  for (let page = 1; items.length < total; page++) {
    const data = await apiFetch(`/api/events?page=${page}&pageSize=100`);
    if (!data.items.length) break;
    items.push(...data.items);
    total = data.totalCount;
  }
  return items;
};

// ---------- Sự kiện ----------
const eventForm = document.querySelector('#event-form');
const eventTitle = document.querySelector('#event-form-title');
const eventCancel = document.querySelector('#event-cancel');
const eventListEl = document.querySelector('#admin-event-list');
const regEventSelect = document.querySelector('#reg-event');

const resetEventForm = () => {
  eventForm.reset();
  eventForm.elements.eventId.value = '';
  eventForm.elements.clubId.disabled = false;
  eventTitle.textContent = 'Thêm sự kiện';
  eventCancel.hidden = true;
};

const editEvent = (event) => {
  const f = eventForm.elements;
  f.eventId.value = event.id;
  f.name.value = event.name;
  f.clubId.value = event.clubId;
  f.clubId.disabled = true; // API không cho đổi câu lạc bộ của sự kiện đã tạo
  f.location.value = event.location;
  f.startTime.value = toLocalInput(event.startTime);
  f.capacity.value = event.capacity;
  f.description.value = event.description ?? '';
  eventTitle.textContent = 'Sửa sự kiện';
  eventCancel.hidden = false;
  eventForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const renderEvents = () => {
  const clubName = (id) => clubs.find((c) => c.id === id)?.name ?? '';
  eventListEl.replaceChildren(...events.map((event) =>
    row(
      event.name,
      `${clubName(event.clubId)} · ${formatDateTime(event.startTime)} · ${event.location} · ${event.registeredCount}/${event.capacity} chỗ`,
      button('Sửa', 'btn-secondary', () => editEvent(event)),
      button('Xoá', 'btn-danger', () => run(async () => {
        if (!confirm(`Xoá sự kiện "${event.name}"? Các đăng ký của sự kiện cũng bị xoá.`)) return;
        await apiFetch(`/api/events/${encodeURIComponent(event.id)}`, { method: 'DELETE' });
        await loadEvents();
        setStatus(statusEl, 'Đã xoá sự kiện.');
      }, 'Không xoá được sự kiện.')),
    )));

  const selected = regEventSelect.value;
  regEventSelect.replaceChildren(...events.map((e) => el('option', { text: e.name, attrs: { value: e.id } })));
  if (events.some((e) => e.id === selected)) regEventSelect.value = selected;
};

const loadEvents = async () => {
  events = await fetchAllEvents();
  renderEvents();
  await loadRegistrations();
};

eventForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();
  run(async () => {
    const f = eventForm.elements;
    const body = {
      name: f.name.value.trim(),
      description: f.description.value.trim(),
      location: f.location.value.trim(),
      startTime: toIso(f.startTime.value),
      capacity: Number(f.capacity.value),
    };
    const id = f.eventId.value;
    if (id) {
      await apiFetch(`/api/events/${encodeURIComponent(id)}`, { method: 'PUT', body });
    } else {
      await apiFetch('/api/events', { method: 'POST', body: { ...body, clubId: f.clubId.value } });
    }
    resetEventForm();
    await loadEvents();
    setStatus(statusEl, id ? 'Đã cập nhật sự kiện.' : 'Đã thêm sự kiện.');
  }, 'Không lưu được sự kiện.');
});

eventCancel.addEventListener('click', resetEventForm);

// ---------- Câu lạc bộ ----------
const clubForm = document.querySelector('#club-form');
const clubTitle = document.querySelector('#club-form-title');
const clubCancel = document.querySelector('#club-cancel');
const clubListEl = document.querySelector('#admin-club-list');

const resetClubForm = () => {
  clubForm.reset();
  clubForm.elements.clubId.value = '';
  clubTitle.textContent = 'Thêm câu lạc bộ';
  clubCancel.hidden = true;
};

const renderClubs = () => {
  clubListEl.replaceChildren(...clubs.map((club) =>
    row(
      club.name,
      club.description || 'Chưa có mô tả',
      button('Sửa', 'btn-secondary', () => {
        clubForm.elements.clubId.value = club.id;
        clubForm.elements.name.value = club.name;
        clubForm.elements.description.value = club.description ?? '';
        clubTitle.textContent = 'Sửa câu lạc bộ';
        clubCancel.hidden = false;
        clubForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }),
      button('Xoá', 'btn-danger', () => run(async () => {
        if (!confirm(`Xoá câu lạc bộ "${club.name}"?`)) return;
        await apiFetch(`/api/clubs/${encodeURIComponent(club.id)}`, { method: 'DELETE' });
        await loadClubs();
        setStatus(statusEl, 'Đã xoá câu lạc bộ.');
      }, 'Không xoá được câu lạc bộ.')),
    )));

  const clubSelect = eventForm.elements.clubId;
  const selected = clubSelect.value;
  clubSelect.replaceChildren(...clubs.map((c) => el('option', { text: c.name, attrs: { value: c.id } })));
  if (clubs.some((c) => c.id === selected)) clubSelect.value = selected;
};

const loadClubs = async () => {
  clubs = await apiFetch('/api/clubs');
  renderClubs();
  renderEvents();
};

clubForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();
  run(async () => {
    const f = clubForm.elements;
    const body = { name: f.name.value.trim(), description: f.description.value.trim() };
    const id = f.clubId.value;
    if (id) await apiFetch(`/api/clubs/${encodeURIComponent(id)}`, { method: 'PUT', body });
    else await apiFetch('/api/clubs', { method: 'POST', body });
    resetClubForm();
    await loadClubs();
    setStatus(statusEl, id ? 'Đã cập nhật câu lạc bộ.' : 'Đã thêm câu lạc bộ.');
  }, 'Không lưu được câu lạc bộ.');
});

clubCancel.addEventListener('click', resetClubForm);

// ---------- Đăng ký ----------
const registrationListEl = document.querySelector('#admin-registration-list');

const loadRegistrations = async () => {
  if (!regEventSelect.value) {
    registrationListEl.replaceChildren();
    return;
  }
  const registrations = await apiFetch(`/api/registrations/event/${encodeURIComponent(regEventSelect.value)}`);
  if (!registrations.length) {
    registrationListEl.replaceChildren(el('li', { text: 'Chưa có đăng ký nào.', className: 'note' }));
    return;
  }
  registrationListEl.replaceChildren(...registrations.map((reg) => {
    const checkedIn = reg.checkedInAt ? ` · đã check-in lúc ${formatDateTime(reg.checkedInAt)}` : '';
    const actions = [el('span', {
      text: REGISTRATION_LABELS[reg.status] ?? reg.status,
      className: `badge-status status-${reg.status.toLowerCase()}`,
    })];
    if (reg.status === 'Pending') {
      actions.push(button('Xác nhận', 'btn-primary', () => run(async () => {
        await apiFetch(`/api/registrations/${encodeURIComponent(reg.id)}/confirm`, { method: 'POST' });
        await loadRegistrations();
        setStatus(statusEl, 'Đã xác nhận đăng ký.');
      }, 'Không xác nhận được đăng ký.')));
    }
    return row(
      `${reg.member.name} (${reg.member.studentId})`,
      `${reg.member.email} · đăng ký lúc ${formatDateTime(reg.registeredAt)}${checkedIn}`,
      ...actions,
    );
  }));
};

regEventSelect.addEventListener('change', () => run(loadRegistrations, 'Không tải được danh sách đăng ký.'));

// ---------- Check-in ----------
document.querySelector('#checkin-form').addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();
  run(async () => {
    const field = submitEvent.target.elements.qrToken;
    const result = await apiFetch(`/api/checkins/verify/${encodeURIComponent(field.value.trim())}`, { method: 'POST' });
    field.value = '';
    setStatus(statusEl, `Check-in thành công lúc ${formatDateTime(result.checkedInAt)}.`);
  }, 'Không xác thực được mã check-in.');
});

// ---------- Khởi động ----------
(async () => {
  setStatus(statusEl, 'Đang tải…');
  const user = await getCurrentUser();
  if (!user) {
    location.href = `login.html?next=${encodeURIComponent('admin.html')}`;
    return;
  }
  if (user.role !== 'Admin') {
    setStatus(statusEl, 'Bạn không có quyền truy cập trang này.', true);
    return;
  }
  try {
    await loadClubs();
    await loadEvents();
    content.hidden = false;
    showTab('events');
  } catch {
    setStatus(statusEl, 'Không tải được dữ liệu, vui lòng thử lại.', true);
  }
})();
