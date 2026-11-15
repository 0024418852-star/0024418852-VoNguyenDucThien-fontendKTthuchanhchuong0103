// Trang chi tiết sự kiện: xem thông tin, đăng ký và huỷ đăng ký
const eventId = new URLSearchParams(location.search).get('id');
const detailBox = document.querySelector('#event-detail');
const statusEl = document.querySelector('#status');

const goToLogin = () => {
  location.href = `login.html?next=${encodeURIComponent(`event-detail.html?id=${eventId}`)}`;
};

const renderDetail = ({ event, club, user, registration }) => {
  document.title = `${event.name} — EduHub`;

  const info = el('dl', { className: 'detail-info' });
  const addRow = (label, value) => info.append(el('dt', { text: label }), el('dd', {}, value));
  if (club) addRow('Câu lạc bộ', document.createTextNode(club.name));
  addRow('Thời gian', el('time', { text: formatDateTime(event.startTime), attrs: { datetime: event.startTime } }));
  addRow('Địa điểm', document.createTextNode(event.location));
  addRow('Số chỗ', el('span', { text: formatSeats(event), className: isFull(event) ? 'seats seats-full' : 'seats' }));

  const actions = el('div', { className: 'actions' });
  if (registration) {
    const cancel = el('button', { text: 'Huỷ đăng ký', className: 'btn btn-danger', attrs: { type: 'button' } });
    cancel.addEventListener('click', () => cancelRegistration(registration.id));
    actions.append(
      el('p', { text: 'Bạn đã đăng ký sự kiện này.', className: 'note' }),
      cancel,
      el('a', { text: 'Xem đăng ký của tôi', className: 'btn btn-secondary', attrs: { href: 'my-registrations.html' } }),
    );
  } else if (isFull(event)) {
    actions.append(el('span', { text: 'Hết chỗ', className: 'badge-full' }));
  } else {
    const register = el('button', { text: 'Đăng ký tham gia', className: 'btn btn-primary', attrs: { type: 'button' } });
    register.addEventListener('click', () => (user ? registerForEvent() : goToLogin()));
    actions.append(register);
    if (!user) actions.append(el('p', { text: 'Bạn cần đăng nhập để đăng ký.', className: 'note' }));
  }

  detailBox.replaceChildren(
    el('img', { attrs: { src: 'img/event.svg', alt: `Ảnh minh hoạ sự kiện ${event.name}`, width: '320', height: '180' } }),
    el('div', {},
      el('h2', { text: event.name }),
      info,
      el('p', { text: event.description || 'Chưa có mô tả cho sự kiện này.', className: 'description' }),
      actions,
    ),
  );
};

const loadDetail = async () => {
  if (!eventId) {
    setStatus(statusEl, 'Không tìm thấy sự kiện.', true);
    return;
  }
  setStatus(statusEl, 'Đang tải…');
  try {
    const [event, user] = await Promise.all([
      apiFetch(`/api/events/${encodeURIComponent(eventId)}`),
      getCurrentUser(),
    ]);
    const club = await apiFetch(`/api/clubs/${encodeURIComponent(event.clubId)}`).catch(() => null);
    let registration = null;
    if (user) {
      const mine = await apiFetch('/api/registrations/me');
      registration = mine.find((r) => r.eventId === event.id && r.status !== 'Cancelled') ?? null;
    }
    renderDetail({ event, club, user, registration });
    setStatus(statusEl, '');
  } catch (error) {
    detailBox.replaceChildren();
    setStatus(
      statusEl,
      error instanceof ApiError && error.status === 404
        ? 'Không tìm thấy sự kiện.'
        : 'Không tải được dữ liệu, vui lòng thử lại.',
      true,
    );
  }
};

const registerForEvent = async () => {
  try {
    await apiFetch('/api/registrations', { method: 'POST', body: { eventId } });
    await loadDetail();
    setStatus(statusEl, 'Đăng ký thành công.');
  } catch (error) {
    setStatus(statusEl, describeError(error, 'Không đăng ký được, vui lòng thử lại.'), true);
  }
};

const cancelRegistration = async (registrationId) => {
  try {
    await apiFetch(`/api/registrations/${encodeURIComponent(registrationId)}`, { method: 'DELETE' });
    await loadDetail();
    setStatus(statusEl, 'Đã huỷ đăng ký.');
  } catch (error) {
    setStatus(statusEl, describeError(error, 'Không huỷ được, vui lòng thử lại.'), true);
  }
};

loadDetail();
