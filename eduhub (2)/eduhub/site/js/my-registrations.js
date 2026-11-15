// Trang đăng ký của tôi: xem trạng thái, huỷ đăng ký, lấy mã check-in
const statusEl = document.querySelector('#status');
const listEl = document.querySelector('#registration-list');

const STATUS_LABELS = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã huỷ' };

const createItem = (registration) => {
  const { event } = registration;
  const cancelled = registration.status === 'Cancelled';
  const item = el('li', { className: 'registration' });

  const head = el('div', { className: 'registration-head' },
    el('h3', {}, el('a', { text: event.name, attrs: { href: `event-detail.html?id=${encodeURIComponent(event.id)}` } })),
    el('span', { text: STATUS_LABELS[registration.status] ?? registration.status, className: `badge-status status-${registration.status.toLowerCase()}` }),
  );
  const meta = el('p', {}, el('time', { text: formatDateTime(event.startTime), attrs: { datetime: event.startTime } }), document.createTextNode(` · ${event.location}`));
  item.append(head, meta);

  if (registration.checkedInAt) {
    item.append(el('p', { text: `Đã check-in lúc ${formatDateTime(registration.checkedInAt)}`, className: 'note' }));
  }

  if (!cancelled) {
    const qrBox = el('p', { className: 'qr-box' });
    const qrButton = el('button', { text: 'Lấy mã check-in', className: 'btn btn-secondary', attrs: { type: 'button' } });
    qrButton.addEventListener('click', async () => {
      try {
        const { qrToken } = await apiFetch(`/api/checkins/${encodeURIComponent(registration.id)}`, { method: 'POST' });
        qrBox.replaceChildren(document.createTextNode('Mã check-in: '), el('code', { text: qrToken }));
      } catch (error) {
        setStatus(statusEl, describeError(error, 'Không lấy được mã check-in.'), true);
      }
    });
    const cancel = el('button', { text: 'Huỷ đăng ký', className: 'btn btn-danger', attrs: { type: 'button' } });
    cancel.addEventListener('click', async () => {
      try {
        await apiFetch(`/api/registrations/${encodeURIComponent(registration.id)}`, { method: 'DELETE' });
        await loadRegistrations();
        setStatus(statusEl, 'Đã huỷ đăng ký.');
      } catch (error) {
        setStatus(statusEl, describeError(error, 'Không huỷ được, vui lòng thử lại.'), true);
      }
    });
    item.append(el('div', { className: 'actions' }, qrButton, cancel), qrBox);
  }
  return item;
};

const loadRegistrations = async () => {
  setStatus(statusEl, 'Đang tải…');
  try {
    const user = await getCurrentUser();
    if (!user) {
      location.href = `login.html?next=${encodeURIComponent('my-registrations.html')}`;
      return;
    }
    const registrations = await apiFetch('/api/registrations/me');
    listEl.replaceChildren(...registrations.map(createItem));
    setStatus(statusEl, registrations.length ? `Bạn có ${registrations.length} đăng ký` : 'Bạn chưa đăng ký sự kiện nào.');
  } catch {
    listEl.replaceChildren();
    setStatus(statusEl, 'Không tải được dữ liệu, vui lòng thử lại.', true);
  }
};

loadRegistrations();
