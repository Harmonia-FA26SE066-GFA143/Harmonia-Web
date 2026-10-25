# Harmonia Web – Stitch Screen Map

Nguồn: danh sách screen Stitch (file local của Web, không đưa lên Git) (115 screen DESKTOP + `DESIGN(2).md`), Stitch project `5445464059092912576`.
Lập ở Phase 0 (2026-09-26), làm sạch 2026-10-20. File này chỉ nối **màn Stitch ↔ route ↔ feature folder**. Hành vi, trường, trạng thái và quyền do BE quyết định (quyết định owner 2026-10-07); xem `docs/business/` và `docs/tbd-backlog.md`. Route khai báo ở `src/app/router/paths.ts`.

## Quy ước

- Mỗi dòng là **một page**. Các screen cùng tên khác hậu tố (Đang tải Skeleton, Trạng thái Trống, Lỗi…, Không có kết quả lọc, Modal…) là **state** của page đó, không phải route riêng.
- Actor suy ra từ sidebar của screen trên Stitch (shell Admin / Cha xứ / Ca trưởng) và ghi chú vai trò của Web (local). Stitch không phải nguồn business rule.
- Tiền tố `/admin`, `/priest`, `/director` là không gian làm việc theo role; `RoleGuard` chỉ cho role tương ứng vào, còn quyền thật do BE kiểm soát.
- Số thứ tự giữ nguyên như bản đầu để các tham chiếu cũ vẫn đúng; #3 (Đăng ký) và #5a (Chờ xác nhận) đã gỡ vì BE không có đăng ký công khai.

## Bảng page (màn có trên Stitch)

| # | Page | Actor | Route | Feature folder | Screen IDs (base + states) | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | Trang chủ (SHARED-04) | Công khai (chưa đăng nhập) | `/` | `src/app/pages` | `ae22a963736d4bfaa786b1996061babc` Mặc định | Đã dựng, nối BE |
| 2 | Đăng nhập | Tất cả role web | `/login` | `auth` | `93e51845d9f64aa983a433661f5fd93b` Mặc định<br>`3ea870c4d8624847a7049333e6c0eb5b` Đang đăng nhập<br>`467b492a4206497d96bb3af116a09b28` Đang kết nối Google (chỉ tham khảo; nút Google dựng riêng, xem ghi chú)<br>`3d5cd095edc745c18c8dfcb7a69bc210` Lỗi nhập liệu<br>`928a7e84e6274994afa7dfd6d1ba0c7b` Lỗi xác thực | Đã dựng, nối BE |
| 4 | Quên mật khẩu | Tất cả role web | `/forgot-password` | `auth` | `4d064752a03044ac808b2f5a29e26631` Mặc định<br>`47b750dde8b840b89884ada25cb36a91` Đang gửi<br>`b88571d11a74422a961522f4022e9228` Thành công<br>`4a241691c7ee4be394f203891b6c5166` Lỗi nhập liệu<br>`a896d09e981b4bb3b91d9589c21c27c0` Lỗi gửi | Đã dựng, nối BE |
| 5 | Hồ sơ cá nhân (SHARED-05) | Tất cả role web | `/profile` | `profile` | `9fff59d37ad14813874106c3c67c019a` Mặc định<br>`bc241eebdb3d4cac8d645d20e2a7bb0a` Chế độ Chỉnh sửa<br>`9fed48f8558c43eba2231cd4f701d762` Đang tải Skeleton<br>`7391e2555b4d44e9b2896aefc13ac7e3` Lỗi tải dữ liệu<br>`28298e1040084633a4c814f1ea3841c1` Modal Đăng xuất | Đã dựng, nối BE |
| 6 | Tổng quan (Admin) | Admin | `/admin` | `dashboard` | `7c6d43b4f6f74af7a2f869f406c8d4a3` Mặc định<br>`10ccbfa5b54b4f37a71abfa235cbbcfa` Đang tải Skeleton<br>`28d517e6cfbe4ee992f3b75c1f40888a` Trạng thái Trống<br>`6454517136d74210ab78ec3a20919c6c` Lỗi kết nối | Đã dựng, nối BE |
| 7 | Tài khoản | Admin | `/admin/accounts` | `users` | `05a9faf1eb7645e58944d3d8c0cae704` Mặc định<br>`b59d75136fb04f93887b3ce491a6d8b1` Modal Tạo tài khoản<br>`527c42afbc64463da553ee089855200b` Đang tải Skeleton<br>`747e7c041c4d4a06bb282b2eb15135aa` Trạng thái Trống<br>`85b1db14a8014f108ca747f60bb685f6` Không có kết quả lọc<br>`0b6872759cae472ab0ab8f50ac9af5d8` Lỗi tải dữ liệu | Đã dựng, nối BE |
| 8 | Vai trò & Phân quyền | Admin | `/admin/roles` | `users` | `59247714daba435aa4dc78ded696ade6` Mặc định<br>`d67ed2ba86724a558486316c27db0c30` Modal Thay đổi vai trò<br>`e94ce2e81aaf42d8a539b1aec3979156` Đang tải Skeleton<br>`55b9b8e003924d3fb88398c65901f716` Trạng thái Trống<br>`00babfc97a9a4a5cb8b830146768dfd0` Lỗi kết nối | Đã dựng, nối BE |
| 9 | Danh mục kỹ năng | Admin | `/admin/skill-categories` | `system-categories` | `cff1472ef83c4e67b6ab4b7e707f065c` Mặc định<br>`c0bd8800d5604c41b50296bf9bf21e33` Modal Thêm<br>`6e829a073fb14da3a3cdb640e1d2412d` Modal Chỉnh sửa<br>`c8af418a3fa742dbbcf09d44931cfc01` Đang tải Skeleton<br>`a6e20b043a614388a542e99d52947240` Trạng thái Trống<br>`3a3c0dafb8e1417cb13d8668ee398692` Lỗi kết nối | Đã dựng, nối BE |
| 10 | Danh mục phụng vụ | Admin | `/admin/liturgical-categories` | `system-categories` | `48115df55cde431dbd9d0b68ef1aaa07` Mặc định<br>`6c877c976115460eb9fbe5664086694d` Modal Thêm<br>`e990018a18d3498cb1b53bc2e0ef2fec` Đang tải Skeleton<br>`8c765800ec664eb3a3c2f8a36e52322a` Trạng thái Trống<br>`67de1672b99d497bb73d2ec984a82673` Lỗi tải dữ liệu | Đã dựng, nối BE |
| 11 | Cấu hình chung | Admin | `/admin/settings` | `settings` | `29c2f9fae1ae43f7b7ad2d06cfd73974` Mặc định<br>`6db73e6bb59347f0b07ddb5a7349445a` Khung dự phòng mở rộng<br>`1d30792604a34617a4aee9ffb8df81bd` Đang tải Skeleton<br>`5873aa2c972b498687fe0eb5bc68da5f` Lỗi kết nối | Đã dựng, nối BE |
| 12 | Báo cáo (Admin) | Admin | `/admin/reports` | `reports` | `9d8b81f236cf4858b7da7389ca909427` Mặc định ("Quản trị hệ thống")<br>`d9258aefc1ec40f1b7e578ca7e7371ac` Modal Xuất báo cáo<br>`c9524e7f6d4d4748831f6e9757fb23aa` Đang tải Skeleton<br>`8e735868179c47739279eb8fdcdea7df` Trạng thái Trống<br>`dc25d5df4e5f4e709a4b40a9cded95cf` Không có kết quả lọc<br>`35f888ec2c5a477293a722149812d36a` Lỗi tải dữ liệu | Đã dựng, nối BE |
| 13 | Lịch sử hoạt động | Admin | `/admin/activity-log` | `activity-log` | `620cff3545b24c7c9d4a6a78b875abf8` Mặc định ("Quản trị hệ thống")<br>`4dd69c683fc64e479362e55a84e1e3e1` Modal Chi tiết bản ghi<br>`a5bb7f348d8e41eca35385694d018428` Đang tải Skeleton<br>`ffab6bda4bd44535aa593dd058d44cce` Trạng thái Trống<br>`05168f2905c546a288128fb4944adb58` Không có kết quả lọc<br>`9fdc3cf41dc64e2bac38f0a8b8d60d60` Lỗi tải dữ liệu | Đã dựng, nối BE |
| 14 | Tổng quan Cha xứ | Cha xứ / HĐ Phụng vụ | `/priest` | `dashboard` | `236fd94b56f3478f82e361ea56af77fe` Mặc định<br>`459db6c6ba1e4ff7bacf8ac45b898b2d` Đang tải Skeleton<br>`9d7de1d49b0247df99255c01d1e0d3c7` Trạng thái Trống<br>`e5e792bc0f2b402ab11e44c671bd11ea` Lỗi kết nối | Đã dựng, nối BE |
| 15 | Lịch phụng vụ | Cha xứ / HĐ Phụng vụ | `/priest/calendar` | `liturgical-programs` | `b2d6cd87ceb94cf5a86f96134eee3c44` Mặc định<br>`b7a03b43eaed4b90b30470a1e664b36d` Đang tải Skeleton<br>`97289dd35b2646459788b518c7f91ab2` Trạng thái Trống<br>`2a2954fcc38a43629ab0e9548287869f` Lỗi kết nối | Đã dựng, nối BE |
| 16 | Danh sách Chương trình phụng vụ (Cha xứ) | Cha xứ / HĐ Phụng vụ | `/priest/programs` | `liturgical-programs` | `c138753109bd4376ba22a7da4c84eb29` Mặc định<br>`cd4a1f80dba34b2e8c5e56613372388d` Đang tải Skeleton<br>`14b925d4540b4af18596063ffc72a8c4` Trạng thái Trống<br>`b5fe638ad061400e8f74c5bc1270c637` Không có kết quả lọc<br>`df82d9c482c74cc39a3b5c906d126e39` Lỗi tải dữ liệu | Đã dựng, nối BE |
| 17 | Tạo Chương trình phụng vụ | Cha xứ / HĐ Phụng vụ | `/priest/programs/new` | `liturgical-programs` | `5ca0165bd418493ab80b160b16b58f32` Mặc định<br>`3df1e0b20b104a318530228ec29ab12d` Đang lưu<br>`0f822075d8024a838ddc405e2c095310` Lỗi xác thực<br>`eeba6ab6082d45b4bd3247d7a2e62c72` Cảnh báo trùng lặp (chỉ tham khảo, không dựng)<br>`cfaef115f73f4b89a79de2b109d8b0ef` Hộp thoại Rời khỏi | Đã dựng, nối BE |
| 18 | Chi tiết Chương trình phụng vụ (Cha xứ) | Cha xứ / HĐ Phụng vụ | `/priest/programs/:programId` | `liturgical-programs` | `da9fae7ebe30448e82922341326420fc` Mặc định<br>`2375bff5bcac43cfba9ffabc1c9eb0e1` Chưa có bài hát<br>`85583aca95ce4e80a9c83dd1191037ba` Đang tải Skeleton<br>`932dcf0a49ab425790ff5944c5f700bf` Lỗi tải dữ liệu<br>`aa83ca1becce46bab0eff111c5f33d1d` Không tìm thấy chương trình | Đã dựng, nối BE |
| 19 | Duyệt danh sách bài hát | Cha xứ / HĐ Phụng vụ | `/priest/programs/:programId/song-review` | `song-list-review` | `d8598b76eba84ec4b862c60ba177eef5` Mặc định<br>`9053d725ec584fe1a003e020bc996554` Yêu cầu chỉnh sửa<br>`264d5e40e5ad4c7bbc3c2cba6cd6bfe8` Đã phê duyệt<br>`da29abda62f74c8b9400b9e932ad8811` Chưa có bài hát<br>`b7931af1e891474fa28698932671fb3c` Đang tải Skeleton | Đã dựng, nối BE |
| 20 | Báo cáo (Cha xứ) | Cha xứ / HĐ Phụng vụ | `/priest/reports` | `reports` | `d0695f97a18c455ab6a108a94e42bba1` Mặc định | Đã dựng, nối BE |
| 21 | Tổng quan Ca trưởng | Ca trưởng | `/director` | `dashboard` | `fbed4da7c3d34503b198fdc5e42b971c` Mặc định<br>`6cc4b00e779a46bdbbde2efe6456300f` Không có việc tồn đọng<br>`a9a3acce6226446c8293721d30dc8858` Đang tải Skeleton<br>`71a91177e5e7415d9a16f1d5ca7be177` Trạng thái Trống<br>`8ec2749dde5a4ea3b24400ee571b74ee` Lỗi kết nối | Đã dựng, nối BE |
| 22 | Danh sách Chương trình phụng vụ (Ca trưởng) | Ca trưởng | `/director/programs` | `liturgical-programs` | `61ac899417d9405983c241e9d6bc279a` Mặc định<br>`a62a419b9c1c4081bfca6a7cb67c9c06` Đang tải Skeleton<br>`244dbce9737948329f0e5150baebe87a` Trạng thái Trống<br>`de0394c959854a98a8e892a6cd44e019` Không có kết quả lọc<br>`07ef41b16b3f4b81a378f6126f0454a5` Lỗi tải dữ liệu | Đã dựng, nối BE |
| 23 | Chi tiết Chương trình phụng vụ (Ca trưởng) | Ca trưởng | `/director/programs/:programId` | `liturgical-programs` | `fc321cc65c464259b838ecfb6920fbea` Mặc định<br>`06f5914348e842668380ea7ca4c0d332` Chưa có bài hát<br>`a15b2cabd5cc43e3be72274cd87914a5` Đang tải Skeleton<br>`4c52caddec51436fb8c19dc879f7641c` Đã phê duyệt<br>`46dc04eaa2944b229e4273ff58b2c9bc` Yêu cầu chỉnh sửa | Đã dựng, nối BE |
| 24 | Đề xuất danh sách bài hát | Ca trưởng | `/director/programs/:programId/song-list` | `song-lists` | `5974acf510274601bf03d592dd4a95e8` Mặc định<br>`be30ce763ed4447981cef5bed602b226` Đã gửi duyệt<br>`2427048a4a8244419c116dc796226dc2` Yêu cầu chỉnh sửa<br>`c057e67337284a69b59c9c08618e8d63` Đang tải Skeleton<br>`23ee45dee4424576b025c579c491d043` Trạng thái Trống<br>`df730dd692224b8bbc6f68d26073cf8a` Lỗi kết nối | Đã dựng, nối BE |
| 25 | Lịch tập | Ca trưởng | `/director/rehearsals` | `rehearsals` | `0fdbe0e5a4554fe78418b8bd4ed4f622` Mặc định | Đã dựng, nối BE |
| 26 | Điểm danh | Ca trưởng | `/director/attendance` | `attendance` | `1b499f8f5c1c4879af09ce8720f42a09` Mặc định | Đã dựng, nối BE |
| 27 | Xác nhận tham gia | Ca trưởng | `/director/participation` | `participation` | `cb679c6b86a24f0d9cdd3f5d33c334e0` Mặc định | Đã dựng, nối BE |
| 28 | Yêu cầu nhân sự & Phân công | Ca trưởng | `/director/roster` | `roster` | `49b75e16525a41468110349f798c6902` Mặc định | Đã dựng, nối BE |
| 29 | Bài tập & Tiến độ luyện tập | Ca trưởng | `/director/practice` | `practice` | `8e5269ea64ca40d29916872749794317` Mặc định | Đã dựng, nối BE |
| 30 | Báo cáo (Ca trưởng) | Ca trưởng | `/director/reports` | `reports` | `10d1d8e343004640935a93f9d6fa5cbd` Mặc định | Placeholder: BE chỉ mở báo cáo cho Cha xứ và Admin (`tbd-backlog.md` B24, quyết định 2026-10-17) |
| 31 | Kho bài hát | Ca trưởng | `/director/library` | `music-library` | `e7556b69066f4fc0bdb75fd2f1ff60ae` Mặc định (chọn; bản `9d462ed531074e32ab4f779495a0ffc6` bỏ vì tự thêm tên tác giả)<br>`84c6d1c1945a4bd1a5d4bb658d33d794` Modal Thêm bài hát<br>`c85e8d4bb0ac4fc29f7e559641c34f40` Đang tải Skeleton<br>`c8bd63639b004e3e935bf5834c004152` Trạng thái Trống<br>`c1c985b101dd4ecba3ee12dc740b0093` Không có kết quả lọc<br>`75d08692dc5a4132b8a4dadb9e672133` Lỗi tải dữ liệu | Đã dựng, nối BE |
| 32 | Chi tiết bài hát | Ca trưởng | `/director/library/:songId` | `music-library` | `2edd5a15ed274d2fa03cde452694ee05` Mặc định (chọn; bản `7ac0d7d6096449eb93ab2f718fa35907` bỏ vì dồn tài liệu vào một bảng, không chia 4 nhóm và không có "Chưa phân loại")<br>`344309c695d44d90b9f3f3c83fcded90` Modal Xoá tài liệu | Đã dựng, nối BE |

Screen Stitch không dựng: **Đăng ký** `04312fd5c7f945ba8f83dcf0f84c2051`. 115 screen ID gốc, mỗi ID thuộc đúng một page hoặc nằm trong danh sách này; dòng 31–32 là screen bổ sung, không có trong `stitch-screens.txt`. `15354935462241073431` là `DESIGN(2).md`, không phải screen.

## Page không có trên Stitch (dựng theo BE)

| Page | Actor | Route | Feature folder |
|---|---|---|---|
| Đặt lại mật khẩu (từ link email) | Công khai | `/reset-password` | `auth` |
| Đổi mật khẩu | Mọi role web | `/change-password` | `auth` |
| Danh sách ca viên | Ca trưởng | `/director/members` | `members` |
| Ca đoàn | Ca trưởng | `/director/choirs` | `choirs` |
| Duyệt kỹ năng | Ca trưởng | `/director/skill-approval` | `skill-approval` |
| Ghi chú từ Cha xứ | Ca trưởng | `/director/notes` | `notes` |
| Ghi chú cho Ca trưởng | Cha xứ | `/priest/notes` | `notes` |

## Các screen ID trùng tên – quyết định chọn bản

Quy tắc 3 của `stitch-implementation-plan.md` giả định các cặp trùng tên là bản cũ/mới của cùng màn. Khi mở cả hai bản thì **không phải vậy**: mỗi cặp là **một bản theo shell Cha xứ và một bản theo shell Ca trưởng** (sidebar khác nhau, hành động khác nhau). Vì vậy không bỏ bản nào; đã tách thành các page theo role (dòng 16/22, 18/23, 20/30).

| Tên trên Stitch | Bản Cha xứ | Bản Ca trưởng | Khác biệt chính |
|---|---|---|---|
| Danh sách CTPV (Mặc định / Skeleton / Trống / Không có kết quả lọc / Lỗi tải dữ liệu) | `c138753…`, `cd4a1f8…`, `14b925d…`, `b5fe638…`, `df82d9c…` | `61ac899…`, `a62a419…`, `244dbce…`, `de0394c…`, `07ef41b…` | Bản Cha xứ có nút tạo chương trình; bản Ca trưởng xem chương trình đã được giao |
| Chi tiết CTPV (Mặc định) | `da9fae7…` (cao 2970) | `fc321cc…` (cao 4554) | Bản Cha xứ: thông tin chương trình, danh sách bài hát, nút "Công bố chương trình". Bản Ca trưởng: không gian làm việc theo sự kiện (bài hát, lịch tập, yêu cầu nhân sự, roster, bài tập) |
| Chi tiết CTPV (Chưa có bài hát / Đang tải Skeleton) | `2375bff…`, `85583ac…` | `06f5914…`, `a15b2ca…` | Như trên |
| Báo cáo (Mặc định) | `d0695f9…` | `10d1d8e…` | Nội dung báo cáo theo role (FE-22 cho Cha xứ; báo cáo Ca trưởng không có FE riêng, xem TBD) |

**Đã quyết (Daniel, 2026-09-26):** mỗi role một page riêng (route tách theo tiền tố role như hiện tại). Phần dùng chung (thông tin chương trình, bảng bài hát, bộ lọc, modal xuất báo cáo) đặt trong `features/liturgical-programs/components` và `features/reports/components`; hành động truyền từ page vào.

## Ghi chú còn hiệu lực

- **Trang chủ (SHARED-04):** trang giới thiệu công khai (shell `web_standard`, 2560px), không nằm trong AppShell. Đoạn "quy trình 7 bước", mockup chương trình và các con số minh hoạ do Stitch tự tạo không phải business rule.
- **Đăng nhập:** nút "Đăng nhập với Google" chỉ hiện khi có `VITE_GOOGLE_CLIENT_ID` (`src/config/env.ts`); BE chỉ nhận tài khoản Admin đã tạo sẵn. Không có đăng ký công khai, không có màn "Chờ xác nhận".
- **Hồ sơ cá nhân:** FE-01–FE-02 là chức năng của Ca viên trên mobile; hồ sơ trên web dành cho Cha xứ, Ca trưởng và Admin (xem `role-surfaces.md`).
- **Chi tiết CTPV (Cha xứ / Ca trưởng):** hai screen Stitch cùng tên là hai shell khác nhau, không phải bản cũ/mới (bảng trên). Thanh 5 bước không dựng; trạng thái chuẩn bị lấy từ `GET …/preparation-status`.
- **Báo cáo (Ca trưởng):** giữ placeholder tới khi BE mở báo cáo cho Ca trưởng (B24).
- **Chi tiết Stitch tự thêm** (mã tài khoản, thanh "Sandbox", "Căn cứ thẩm định", cột/nút không có trường BE tương ứng, thanh "Mô phỏng trạng thái") **không** được dựng. Khi một màn Stitch cần trường mà BE không có, ghi `TBD: Backend API missing` vào `tbd-backlog.md`.
- **Locale:** `AppProviders` dùng `vi_VN` cho Ant Design và `vi` cho dayjs (lịch, phân trang, chữ mặc định).

## Đối chiếu design tokens

Nguồn: `DESIGN(2).md` (Stitch), design system của Web (local), `src/styles/tokens.ts`, `src/app/theme.ts`.

| Hạng mục | DESIGN(2).md / screen Stitch | design-system.md | Áp dụng |
|---|---|---|---|
| Màu neutral + burgundy `#8E3B4B` | Khớp | Khớp | Giữ nguyên |
| Burgundy trong HTML sinh ra | Token `primary` = `#702435`; `#8E3B4B` chỉ là `primary-container` | `#8E3B4B` | **Theo design-system.md:** `#8E3B4B` |
| Màu semantic | Screen dùng xanh `#136430`, đỏ `#ba1a1a`; DESIGN(2).md không định nghĩa giá trị | Chỉ quy định cách dùng, không có giá trị | Giữ mặc định của Ant Design, **TBD** |
| Font | Be Vietnam Pro; JetBrains Mono cho số liệu dày | Không nêu | Self-host qua `@fontsource/be-vietnam-pro` (400–700) và `@fontsource/jetbrains-mono` (400) – Daniel duyệt 2026-09-26 |
| Cỡ chữ | Tiêu đề trang 30/36, tiêu đề mục 20/28, thân 15/25 (DESIGN(2): 14–16, line-height 1.55–1.65), nhãn 14, metadata 12 | Không nêu | Base 14px, line-height 1.6; H1 30, H2 20, H3 17 |
| Bo góc | DESIGN(2): nút 8–10px; HTML sinh ra thu nhỏ (`rounded-lg` = 4px) | Không nêu | Theo DESIGN(2).md: 8px cho control, 10px cho container |
| Chiều cao control | Nút 40–44, input 42–46 | Không nêu | `controlHeight` 40 |
| Card | Screen dùng bóng, không viền | Khuyến nghị dùng viền và khoảng trắng | **Theo design-system.md:** viền 1px `#E4E4E7`, không bóng |
| Chữ in hoa | Screen in hoa nhãn nhóm và tiêu đề bảng | DESIGN(2): không in hoa cụm tiếng Việt dài | Không in hoa |
| Menu đang chọn | Admin: nền burgundy đặc; Ca trưởng: nền burgundy nhạt | Burgundy cho điều hướng đang active | Giữ nền nhạt + chữ burgundy (theme cũ) |
| Sidebar / nội dung | Sidebar 260px; padding 28–40px; nội dung rộng tối đa khoảng 1280–1400px | Không nêu | 260px / 32px / 1360px; dưới 768px sidebar chuyển thành drawer |
