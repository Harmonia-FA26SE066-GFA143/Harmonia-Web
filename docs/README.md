# Tài liệu Web cho nhóm BE

Thư mục này giúp nhóm BE biết Web đang làm gì và cần bàn gì với BE, đọc trực tiếp sau khi `git pull` repo Harmonia-Web. Nội dung các file viết bằng tiếng Anh để giữ nguyên tên API, mã lỗi và trích dẫn code; file này là bản tóm tắt tiếng Việt.

- Cập nhật lần cuối: 2026-10-25, đối chiếu với Harmonia-BE `main@42e604e`.
- Cách đọc trích dẫn: `File.cs:12-20` là đường dẫn và số dòng trong code BE ở commit trên; `src/...` là code Web.
- Web làm theo BE ở mọi chỗ BE đã quy định (trường, trạng thái, ai được làm gì, mã lỗi). Chỗ BE chưa có thì ghi là cần BE bổ sung, kèm quyết định tạm của owner.

## Đọc theo thứ tự

1. [`tbd-backlog.md`](tbd-backlog.md): **danh sách việc Web cần BE làm.** Mỗi mục có lý do, bằng chứng trong code BE, hướng làm đề xuất và trạng thái (Open / Partial / Done).
2. [`open-business-decisions.md`](open-business-decisions.md): quyết định nào của owner đã nhường cho BE, quyết định nào còn hiệu lực, việc gì còn bỏ ngỏ.
3. [`business/`](business/): Web hiểu từng luồng nghiệp vụ thế nào. Mỗi file có phần "BE contract" (đã đối chiếu code BE) và "Owner decisions still standing" (chỗ BE chưa quy định).
   - [`liturgical-program.md`](business/liturgical-program.md): sự kiện phụng vụ, mùa phụng vụ, công bố, huỷ.
   - [`song-approval.md`](business/song-approval.md): kho bài hát, đề xuất và duyệt danh sách bài hát.
   - [`roster.md`](business/roster.md): nhu cầu nhân sự, gợi ý và chốt phân công.
   - [`rehearsal-attendance.md`](business/rehearsal-attendance.md): xác nhận tham gia, buổi tập, điểm danh, báo cáo theo ca viên.
   - [`practice-submission.md`](business/practice-submission.md): bài luyện tập, bản thu, chấm bài.
   - [`choir-skills.md`](business/choir-skills.md): kỹ năng ca viên và duyệt kỹ năng.
   - [`roles-permissions.md`](business/roles-permissions.md): vai trò và quyền.
   - [`actors.md`](business/actors.md), [`domain.md`](business/domain.md): tổng quan theo Report 1.
4. [`api-conventions.md`](api-conventions.md): các giả định của Web khi gọi API (dạng lỗi, enum, ngày giờ UTC, phân trang, tải file, token). Khi BE đổi một quy ước, Web cần biết.
5. [`stitch-screen-map.md`](stitch-screen-map.md): các màn hình Web theo vai trò và route.

## Cần bàn với BE (các mục còn mở trong backlog)

| Mục | Việc cần BE làm | Ghi chú |
|---|---|---|
| B10 | Changelog hợp đồng API, quy ước "thay đổi phá vỡ", cấu hình môi trường | Đã có một phần (CORS, tên biến môi trường) |
| B24 (phần còn lại) | Số liệu tổng hợp điểm danh và luyện tập theo khoảng ngày cho Ca trưởng | Báo cáo theo ca viên đã có; Web đang tự cộng dồn ở trình duyệt |
| B25 | Tên ngày phụng vụ, mùa và bậc lễ bằng tiếng Việt | Web đang tự dịch 221 tên |
| B26 | Tên hiển thị và nhóm cho cấu hình hệ thống | Như cách BE đã trả `MinValue`/`MaxValue` |
| B27 | Danh sách cột (key, tiêu đề) cho từng báo cáo | Bảng trên Web và file xuất đang khác tiêu đề |
| B28 | Email liên hệ public, đọc được khi chưa đăng nhập | `GET /api/system-settings/public` đang bắt đăng nhập |
| B31 | Gắn nhiều tài liệu vào một bài luyện tập | Hiện chỉ một `MaterialId` |
| B32 | Tìm bài hát không phân biệt dấu ("con buoc" ra "Con Bước") | Áp dụng được cho tìm ca viên, tài liệu |
| B33 | Danh sách bài hát kèm số tài liệu theo loại và cờ "đã phân loại" | Kèm bộ lọc "chưa phân loại", "thiếu audio" |
| B34 | Số lần dùng và lần dùng gần nhất của từng bài | Hiện chỉ có trong báo cáo song-usage |
| B35 | Chặn xoá bài hát đã được dùng | Owner đã chọn: BE chặn, không làm lưu trữ hay khôi phục |
| B36 | Thay file của tài liệu mà giữ tiến độ học | Hiện phải xoá rồi tải lại |

Chi tiết và bằng chứng của từng mục nằm trong [`tbd-backlog.md`](tbd-backlog.md).

## Cách cập nhật

Phía Web cập nhật thư mục này sau khi sửa code, bằng một lệnh riêng: đối chiếu lại với commit BE mới nhất, đổi trạng thái các mục BE đã làm, thêm mục mới. Mỗi lần cập nhật đi trong một commit hoặc PR riêng, với tiêu đề bắt đầu bằng `docs(be-handoff):`. Ngày và commit BE ở đầu file này cho biết tài liệu đã đối chiếu tới đâu.
