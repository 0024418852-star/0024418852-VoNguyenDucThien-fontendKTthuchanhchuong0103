// Trang danh sách sự kiện: tìm kiếm và lọc theo CLB
const searchForm = document.querySelector('#search-form');
const keywordInput = document.querySelector('#keyword');
const clubSelect = document.querySelector('#club-filter');
const statusEl = document.querySelector('#status');
const eventList = document.querySelector('#event-list');

const clubNames = new Map();
let requestId = 0; // bỏ qua kết quả của request cũ khi người dùng tìm liên tiếp

const createCard = (event) => {
  const card = el('article', { className: 'card' });
  card.append(
    el('img', { attrs: { src: 'img/event.svg', alt: `Ảnh minh hoạ sự kiện ${event.name}`, width: '320', height: '180' } }),
  );
  const body = el('div', { className: 'card-body' });
  const clubName = clubNames.get(event.clubId);
  if (clubName) body.append(el('p', { text: clubName, className: 'card-club' }));
  body.append(
    el('h3', {}, el('a', { text: event.name, attrs: { href: `event-detail.html?id=${encodeURIComponent(event.id)}` } })),
    el('p', {}, el('time', { text: formatDateTime(event.startTime), attrs: { datetime: event.startTime } })),
    el('p', { text: event.location }),
    el('p', { text: formatSeats(event), className: isFull(event) ? 'seats seats-full' : 'seats' }),
  );
  if (isFull(event)) body.append(el('span', { text: 'Hết chỗ', className: 'badge-full' }));
  card.append(body);
  return card;
};

const renderEvents = (events) => eventList.replaceChildren(...events.map(createCard));

const loadClubs = async () => {
  try {
    const clubs = await apiFetch('/api/clubs');
    for (const club of clubs) {
      clubNames.set(club.id, club.name);
      clubSelect.append(el('option', { text: club.name, attrs: { value: club.id } }));
    }
  } catch {
    clubSelect.disabled = true; // vẫn xem được sự kiện khi không tải được CLB
  }
};

const loadEvents = async (keyword = '', clubId = '') => {
  const current = ++requestId;
  setStatus(statusEl, 'Đang tải…');
  const params = new URLSearchParams({ pageSize: '50' });
  if (keyword) params.set('q', keyword);
  if (clubId) params.set('clubId', clubId);

  try {
    const data = await apiFetch(`/api/events?${params}`);
    if (current !== requestId) return;
    renderEvents(data.items);
    setStatus(statusEl, data.items.length ? `Tìm thấy ${data.totalCount} sự kiện` : 'Không có sự kiện nào khớp từ khoá.');
  } catch {
    if (current !== requestId) return;
    eventList.replaceChildren();
    setStatus(statusEl, 'Không tải được dữ liệu, vui lòng thử lại.', true);
  }
};

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadEvents(keywordInput.value.trim(), clubSelect.value);
});

clubSelect.addEventListener('change', () => loadEvents(keywordInput.value.trim(), clubSelect.value));

(async () => {
  await loadClubs();
  await loadEvents();
})();
