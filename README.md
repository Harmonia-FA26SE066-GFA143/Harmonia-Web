<p align="center">
  <img src="public/icon-192.png" width="88" height="88" alt="Harmonia" />
</p>

<h1 align="center">Harmonia · Web</h1>

<p align="center">
  <b>Mỗi Thánh lễ, một ca đoàn sẵn sàng.</b><br />
  Ứng dụng web điều phối ca đoàn giáo xứ và âm nhạc phụng vụ: từ chương trình Cha xứ công bố đến một ca đoàn đã thuộc bài, đã tập và đủ người phục vụ.
</p>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-8e3b4b?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-8e3b4b?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-8e3b4b?logo=vite&logoColor=white" />
  <img alt="Ant Design 6" src="https://img.shields.io/badge/Ant%20Design-6-8e3b4b?logo=antdesign&logoColor=white" />
  <img alt="Node 24" src="https://img.shields.io/badge/Node-24-8e3b4b?logo=nodedotjs&logoColor=white" />
</p>

---

## Harmonia là gì

Harmonia nối **lịch phụng vụ của Cha xứ** với **việc chuẩn bị của ca đoàn** trên cùng một bản ghi: danh sách bài hát và phê duyệt, buổi tập, xác nhận tham gia, phân công, luyện tập. Cha xứ và Ca trưởng nhìn cùng một chương trình, mỗi người từ công việc của mình.

Điều trang web luôn đặt lên đầu: **chương trình sắp tới còn thiếu gì**, để Ca trưởng thấy và xử lý ngay mà không phải rời trang.

> Ca viên dùng ứng dụng di động riêng (Harmonia-Mobile). Web này dành cho Ca trưởng, Cha xứ và Quản trị viên.

## Ai dùng và dùng để làm gì

| Vai trò | Không gian | Công việc chính |
| --- | --- | --- |
| **Ca trưởng** | `/director` | Đề xuất danh sách bài hát, lên lịch tập, mời tham gia, phân công phục vụ, điểm danh, chấm bài luyện tập, duyệt kỹ năng ca viên, xem báo cáo, quản lý kho bài hát |
| **Cha xứ** | `/priest` | Tạo và công bố chương trình phụng vụ (thủ công hoặc sinh từ lịch Thánh lễ), đồng bộ lịch phụng vụ, duyệt danh sách bài hát, theo dõi tình hình chuẩn bị |
| **Quản trị viên** | `/admin` | Tài khoản và vai trò, ca đoàn, đơn đăng ký gia nhập, bổ nhiệm Ca trưởng, danh mục (mùa, loại lễ, nghi thức, chủ đề, kỹ năng), cấu hình chung, nhật ký hoạt động |

Ngoài ra có trang giới thiệu công khai (`/`), trang đăng ký gia nhập ca đoàn (`/join`), đăng nhập (kể cả Google) và trang hồ sơ cá nhân.

## Điểm nổi bật

- **Kho bài hát**: tìm theo mùa phụng vụ, phần lễ, chủ đề; xem dạng thẻ bản nhạc hoặc mục lục; quản lý bản nhạc, lời, audio mẫu theo bè và bản nhạc tương tác.
- **Phòng luyện tập**: bản nhạc vẽ bằng Verovio, nốt đang hát sáng lên và trang tự cuộn theo, chế độ tập trung và cỡ nốt lớn cho máy chiếu.
- **Lịch phụng vụ** theo mùa và màu phụng vụ trong ngày, đồng bộ từ lịch trực tuyến.
- **Tình hình chuẩn bị** cho từng Thánh lễ: danh sách bài hát, buổi tập, phân công, xác nhận tham gia.
- **Thông báo thời gian thực** qua SignalR.

## Thiết kế

Giao diện theo **Harmonia Design System** (*Illuminated Missal*): đỏ rượu giáo xứ `#8E3B4B`, nền giấy ấm `#F5F0E8`, bảng màu trạng thái dịu mắt tương phản cao (`≥ 6.5:1`), vàng chỉ để trang trí và màu mùa phụng vụ trên dải mùa. Dùng một phông chữ tự phục vụ duy nhất là **Be Vietnam Pro** (tối ưu đầy đủ dấu tiếng Việt) và bộ **85 icon SVG nội bộ** (`src/shared/ui/icons/`). Ảnh thực tế không gian Nhà thờ Giáo xứ Tân Định (`src/assets/images/brand/`, ghi nguồn tại [`public/media/ATTRIBUTION.md`](public/media/ATTRIBUTION.md)) chỉ xuất hiện ở trang công khai và xác thực; các không gian làm việc giữ nền giấy tĩnh để tập trung điều phối. Bản sắc Công giáo ở mức tiết chế: khuông nhạc thánh ca và hình vòm, không thập giá trên nút, không gradient vàng.

Trạng thái không bao giờ chỉ dựa vào màu; mọi trạng thái đều có chữ. Chuyển động tôn trọng thiết lập *giảm chuyển động* của hệ điều hành. Bố cục desktop được kiểm tra ở `1366×768`, `1440×900` và `1920×1080`.

## Công nghệ

| Lớp | Dùng |
| --- | --- |
| Khung | React 19, TypeScript, Vite |
| Giao diện | Ant Design 6 (component và form), bộ icon SVG nội bộ (`src/shared/ui/icons/`) |
| Dữ liệu | TanStack Query 5, React Router 8 |
| Âm nhạc | Verovio (bản nhạc), wavesurfer.js (sóng âm), react-pdf (bản nhạc PDF) |
| Thời gian thực | `@microsoft/signalr` |
| Kiểm thử | Vitest + Testing Library, Playwright (E2E) |
| Chất lượng | oxlint, SonarCloud |

## Bắt đầu

Cần **Node 24** và backend Harmonia-BE đang chạy (hoặc dữ liệu mẫu cho dev).

```bash
npm ci
```

```bash
cp .env.example .env
```

Điền `.env`:

| Biến | Ý nghĩa |
| --- | --- |
| `VITE_API_BASE_URL` | Địa chỉ API backend, không có `/` ở cuối |
| `API_PROXY_TARGET` | Chỉ khi dev: backend mà `npm run dev` chuyển tiếp `/api` tới, dùng khi backend chưa mở CORS cho cổng dev |
| `VITE_GOOGLE_CLIENT_ID` | OAuth client id cho "Đăng nhập với Google"; để trống thì ẩn nút |
| `VITE_USE_DEV_FIXTURES` | Chỉ khi dev: `true` để xem giao diện bằng dữ liệu mẫu có nhãn `DEV FIXTURE`, không gọi API |

```bash
npm run dev
```

Mở <http://localhost:5173>.

### Lệnh thường dùng

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Chạy máy chủ dev |
| `npm run build` | Kiểm tra kiểu rồi đóng gói vào `dist/` |
| `npm run preview` | Xem thử bản đã đóng gói |
| `npm test` | Chạy test Vitest |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | oxlint |
| `npm run test:e2e` | Test E2E Playwright |

## Cấu trúc

```text
src/
├── app/         # router, providers, phân quyền theo vai trò, trang chủ công khai
├── assets/      # ảnh không gian giáo xứ dùng riêng cho trang công khai & xác thực
├── config/      # đọc biến môi trường
├── features/    # mỗi nghiệp vụ một thư mục: api/, components/, hooks/, pages/, types.ts
├── layouts/     # khung ứng dụng: thanh trên, điều hướng
├── lib/         # client API, phiên đăng nhập, lỗi, phân trang
├── shared/      # component, icon SVG nội bộ và hook dùng chung (PageHeader, StatusTag…)
└── styles/      # design tokens, theme Ant Design, global.css
```

Các nghiệp vụ trong `src/features/`: kho bài hát, chương trình phụng vụ, danh sách bài hát và duyệt, buổi tập và điểm danh, xác nhận tham gia, phân công, luyện tập, kỹ năng, thành viên, đơn đăng ký gia nhập, đề cử Ca trưởng, ca đoàn, trao đổi Cha xứ – Ca trưởng, báo cáo, thông báo, tài khoản, danh mục, cấu hình, nhật ký.

## Làm việc với backend

- **Hợp đồng API là mã nguồn Harmonia-BE** (controller, DTO, validator, enum, mã lỗi). Web làm theo BE; không tự đặt ra trường, trạng thái hay quy tắc nghiệp vụ.
- Tính năng BE chưa có được ghi `TBD: Backend API missing` trong [`docs/tbd-backlog.md`](docs/tbd-backlog.md).
- Quy ước truyền nhận (lỗi, enum, ngày giờ, phân trang, tải tệp, token): [`docs/api-conventions.md`](docs/api-conventions.md).
- Tài liệu chung với nhóm BE: [`docs/README.md`](docs/README.md).

## Đóng góp

- Nhánh `<loại>/<tên-ngắn>`, ví dụ `feat/kho-bai-hat`, `fix/lich-cha-xu`.
- Commit theo Conventional Commits, tóm tắt bằng tiếng Việt: `feat(music-library): thêm chế độ xem thẻ`.
- Trước khi mở PR: `npm test`, `npm run typecheck`, `npm run lint`.
- PR vào `main`, gộp bằng **Squash and merge**.
