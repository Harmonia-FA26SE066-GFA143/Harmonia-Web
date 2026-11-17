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
| **Quản trị viên** | `/admin` | Tài khoản và vai trò, ca đoàn, danh mục (mùa, loại lễ, nghi thức, chủ đề, kỹ năng), nhật ký hoạt động |

Ngoài ra có trang giới thiệu công khai, đăng nhập (kể cả Google) và trang hồ sơ cá nhân.

## Điểm nổi bật

- **Kho bài hát**: tìm theo mùa phụng vụ, phần lễ, chủ đề; xem dạng thẻ bản nhạc hoặc mục lục; quản lý bản nhạc, lời, audio mẫu theo bè và bản nhạc tương tác.
- **Phòng luyện tập**: bản nhạc vẽ bằng Verovio, nốt đang hát sáng lên và trang tự cuộn theo, chế độ tập trung và cỡ nốt lớn cho máy chiếu.
- **Lịch phụng vụ** theo mùa và màu phụng vụ trong ngày, đồng bộ từ lịch trực tuyến.
- **Tình hình chuẩn bị** cho từng Thánh lễ: danh sách bài hát, buổi tập, phân công, xác nhận tham gia.
- **Thông báo thời gian thực** qua SignalR.

## Thiết kế

Giao diện theo **Harmonia Design System**: đỏ rượu giáo xứ `#8E3B4B`, nền giấy ngà, vàng chỉ để trang trí, màu mùa phụng vụ trên dải mùa. Chữ Be Vietnam Pro, tiêu đề lễ bằng Cormorant Garamond. Bản sắc Công giáo ở mức tiết chế: khuông nhạc thánh ca và hình vòm, không thập giá trên nút, không gradient vàng.

Trạng thái không bao giờ chỉ dựa vào màu; mọi trạng thái đều có chữ. Chuyển động tôn trọng thiết lập *giảm chuyển động* của hệ điều hành. Bố cục được kiểm tra ở màn hình máy tính 1440px.

## Công nghệ

| Lớp | Dùng |
| --- | --- |
| Khung | React 19, TypeScript, Vite |
| Giao diện | Ant Design 6 (component và form), `@ant-design/icons` |
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
├── app/         # router, providers, phân quyền theo vai trò
├── config/      # đọc biến môi trường
├── features/    # mỗi nghiệp vụ một thư mục: api/, components/, hooks/, pages/, types.ts
├── layouts/     # khung ứng dụng: thanh trên, điều hướng
├── lib/         # client API, phiên đăng nhập, lỗi, phân trang
├── shared/      # component và hook dùng chung (EmptyState, StatusTag, SeasonChip…)
└── styles/      # design tokens, theme Ant Design, global.css
```

Các nghiệp vụ trong `src/features/`: kho bài hát, chương trình phụng vụ, danh sách bài hát và duyệt, buổi tập và điểm danh, xác nhận tham gia, phân công, luyện tập, kỹ năng, thành viên và đăng ký, ca đoàn, báo cáo, thông báo, tài khoản, danh mục, nhật ký.

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
