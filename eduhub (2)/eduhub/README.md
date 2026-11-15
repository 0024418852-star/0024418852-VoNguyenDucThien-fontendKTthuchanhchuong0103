# EduHub

EduHub là nền tảng quản lý câu lạc bộ (CLB) và sự kiện dành cho cộng đồng sinh viên Trường Đại học Đồng Tháp. Dự án gồm hai phần chạy cùng nhau:

- **Website** (`site/`): giao diện HTML, CSS, JavaScript thuần (không framework) để xem sự kiện, tìm kiếm, đăng ký tham gia và quản lý đăng ký.
- **Mock API** (`mock-api/`): máy chủ dữ liệu viết bằng Node.js thuần, không cần cài thêm thư viện, dữ liệu mẫu nạp từ `db.json`.

## Chức năng chính

Trên website, người dùng có thể xem và tìm sự kiện, lọc theo CLB, xem chi tiết, đăng nhập hoặc tạo tài khoản, đăng ký và huỷ đăng ký, xem trạng thái đăng ký và lấy mã check-in. Tài khoản `Admin` có thêm trang **Quản trị** (`admin.html`) để thêm, sửa, xoá sự kiện và CLB, xem và xác nhận đăng ký theo từng sự kiện, xác thực mã check-in. Toàn bộ chức năng của hệ thống:

- **Sự kiện**: xem danh sách có phân trang, tìm theo tên (không phân biệt dấu tiếng Việt), lọc theo CLB và khoảng thời gian, xem chi tiết, số chỗ còn lại.
- **Câu lạc bộ**: xem danh sách và thông tin CLB; quản trị viên thêm, sửa, xoá CLB.
- **Đăng ký sự kiện**: thành viên đăng ký, xem các đăng ký của mình và huỷ đăng ký; quản trị viên xác nhận đăng ký và xem danh sách người đăng ký.
- **Check-in bằng mã QR**: thành viên nhận mã check-in cho đăng ký của mình, quản trị viên xác thực mã tại sự kiện.
- **Tài khoản và xác thực**: đăng ký, đăng nhập bằng JWT (access token 15 phút), làm mới phiên bằng refresh token lưu trong cookie `HttpOnly` (7 ngày), đăng xuất. Mật khẩu được băm bằng scrypt.
- **Phân quyền**: hai vai trò `Admin` và `Member`.
- **Lỗi chuẩn hoá**: API trả lỗi theo định dạng ProblemDetails (RFC 9457), có chi tiết từng trường dữ liệu không hợp lệ.

## Yêu cầu

- **Node.js 22 trở lên**. Kiểm tra phiên bản:

  ```bash
  node -v
  ```

  Kết quả `v22.x.x` trở lên là đạt. Nếu thấp hơn hoặc báo không tìm thấy lệnh `node`, hãy cài Node.js bản LTS mới từ https://nodejs.org.
- Không cần `npm install`; dự án chỉ dùng các module có sẵn của Node.js.
- Trình duyệt hiện đại (Chrome, Edge, Firefox) và VS Code (khuyến nghị).

## Cấu trúc thư mục

```
eduhub/
├── start.mjs            # Lệnh chạy chung: bật Mock API và website
├── package.json
├── mock-api/
│   ├── server.mjs       # Máy chủ API
│   └── db.json          # Dữ liệu mẫu: thành viên, CLB, sự kiện, đăng ký
└── site/                # Website
    ├── index.html             # Danh sách sự kiện, tìm kiếm, lọc theo CLB
    ├── event-detail.html      # Chi tiết sự kiện, đăng ký / huỷ đăng ký
    ├── login.html             # Đăng nhập và tạo tài khoản
    ├── my-registrations.html  # Đăng ký của tôi, mã check-in
    ├── admin.html             # Quản trị (chỉ Admin)
    ├── css/style.css          # Giao diện (responsive 1 / 2 / 3 cột)
    ├── js/
    │   ├── app.js             # Dùng chung: gọi API, xác thực, tiện ích DOM
    │   ├── events.js          # Trang danh sách sự kiện
    │   ├── event-detail.js    # Trang chi tiết sự kiện
    │   ├── login.js           # Trang đăng nhập / tạo tài khoản
    │   ├── my-registrations.js
    │   └── admin.js           # Trang quản trị
    └── img/event.svg          # Ảnh minh hoạ cho thẻ sự kiện
```

## Chạy dự án

1. Mở thư mục `eduhub` trong VS Code (**File → Open Folder…**).
2. Mở terminal (**Terminal → New Terminal** hoặc `` Ctrl + ` ``). Terminal sẽ đứng sẵn ở thư mục dự án.
3. Chạy:

   ```bash
   node start.mjs
   ```

   (hoặc `npm start`)

Khi thấy hai dòng sau là server đã chạy:

```
Mock API:  http://localhost:4000
Website:   http://localhost:5500  (Ctrl + C để dừng)
```

Giữ nguyên terminal trong lúc phát triển. Sau khi sửa file trong `site/`, chỉ cần lưu (`Ctrl + S`) rồi tải lại trang (`F5`), không cần chạy lại lệnh.

## Địa chỉ truy cập

| Thành phần | Địa chỉ |
|---|---|
| Website | http://localhost:5500 |
| Mock API | http://localhost:4000 |
| Danh sách sự kiện (JSON) | http://localhost:4000/api/events?pageSize=50 |
| Kiểm tra tình trạng API | http://localhost:4000/healthz |

Hãy luôn mở website qua `http://localhost:5500`, không mở trực tiếp file `index.html` (địa chỉ bắt đầu bằng `file://`).

### Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@dthu.edu.vn` | `Admin@123` |
| Member | `sv1@dthu.edu.vn` | `Member@123` |

Dữ liệu được giữ trong bộ nhớ: mọi thay đổi (đăng ký mới, huỷ đăng ký, thêm sự kiện…) sẽ mất khi dừng server và trở về dữ liệu mẫu ở lần chạy sau.

## Các endpoint chính

| Nhóm | Endpoint |
|---|---|
| Xác thực | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| Thành viên | `GET /api/members/me` |
| CLB | `GET/POST /api/clubs`, `GET/PUT/DELETE /api/clubs/{id}` |
| Sự kiện | `GET/POST /api/events`, `GET/PUT/DELETE /api/events/{id}` |
| Đăng ký | `POST /api/registrations`, `GET /api/registrations/me`, `GET /api/registrations/event/{eventId}`, `DELETE /api/registrations/{id}`, `POST /api/registrations/{id}/confirm` |
| Check-in | `POST /api/checkins/{registrationId}`, `POST /api/checkins/verify/{qrToken}` |

Tham số của `GET /api/events`: `q` (từ khoá), `clubId`, `from`, `to` (thời gian ISO-8601), `page`, `pageSize` (1–100, mặc định 10).

Các endpoint cần đăng nhập gửi kèm header `Authorization: Bearer <accessToken>`; thao tác thêm, sửa, xoá CLB và sự kiện, xác nhận đăng ký, xác thực mã check-in chỉ dành cho `Admin`.

## Kiểm tra xử lý lỗi

Để kiểm tra giao diện khi máy chủ gặp sự cố, dừng server bằng `Ctrl + C` rồi chạy:

```bash
node start.mjs --fail
```

Ở chế độ này mọi request tới `/api/...` đều trả lỗi 503. Kiểm tra xong, dừng server và chạy lại `node start.mjs` như bình thường.

## Chạy riêng Mock API

Khi cần chạy API độc lập với tuỳ chọn riêng:

```bash
node mock-api/server.mjs --port=4000 --delay=800 --fail-rate=0.1
```

| Tuỳ chọn | Ý nghĩa |
|---|---|
| `--port` | Cổng lắng nghe (mặc định 4000) |
| `--delay` | Độ trễ giả lập cho mỗi request, tính bằng mili giây |
| `--fail-rate` | Tỉ lệ request trả lỗi 503, từ 0 đến 1 |
| `--public` | Chế độ công khai: tắt độ trễ và lỗi giả lập, cho phép giao diện triển khai trên GitHub Pages hoặc Vercel gọi API, tài khoản Admin mẫu chỉ được xem, dữ liệu tự đặt lại mỗi 24 giờ |

Biến môi trường: `PORT`, `JWT_SECRET` (khoá ký JWT, mặc định sinh ngẫu nhiên mỗi lần chạy), `CORS_ORIGINS` (danh sách origin được phép, ngăn cách bằng dấu phẩy).

## Dừng server

Trong terminal đang chạy server, nhấn `Ctrl + C`.

## Xử lý lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `Cổng 4000 (hoặc 5500) đang bị chiếm` | Còn một terminal khác đang chạy `node start.mjs`. Vào terminal đó nhấn `Ctrl + C`, hoặc đóng hết terminal rồi chạy lại. |
| `Cannot find module ... start.mjs` | Terminal đang đứng sai thư mục. Dùng `cd` tới thư mục `eduhub` rồi chạy lại (dùng `ls` hoặc `dir` để thấy file `start.mjs`). |
| `'node' is not recognized` / `command not found` | Chưa cài Node.js hoặc chưa thêm vào PATH. Cài Node.js 22 trở lên rồi mở lại terminal. |
| Trang trắng, Console báo `Failed to fetch` | Server chưa chạy hoặc đã bị tắt. Xem lại terminal và chạy lại `node start.mjs`. |
| Địa chỉ trang bắt đầu bằng `file://` | Đóng tab và mở lại qua http://localhost:5500. |
| Sửa CSS/JS mà trang không đổi | Kiểm tra đã lưu file chưa, rồi nhấn `Ctrl + F5` để tải lại hoàn toàn. |
| Console báo `Cannot read properties of null` | JavaScript chạy trước khi HTML có phần tử. Đặt `<script src="js/app.js"></script>` ở cuối `<body>` hoặc thêm `defer`, và kiểm tra `id` trong HTML khớp với `querySelector`. |
| Dữ liệu bị thay đổi so với ban đầu | Do các thao tác đăng ký, huỷ, thêm, sửa trước đó. Dừng và chạy lại `node start.mjs` để về dữ liệu mẫu. |
| Gọi API từ trang khác bị chặn CORS | Thêm origin của trang vào biến môi trường `CORS_ORIGINS` khi chạy `mock-api/server.mjs`. |

Công cụ hữu ích khi phát triển: DevTools (`F12`), tab **Console** để xem lỗi JavaScript và tab **Network** để xem các request gửi tới API.
