# Tài liệu Web cho nhóm BE

Thư mục này giúp nhóm BE biết Web đang làm gì và cần bàn gì với BE, đọc trực tiếp sau khi `git pull` repo Harmonia-Web. Nội dung các file viết bằng tiếng Anh để giữ nguyên tên API, mã lỗi và trích dẫn code; file này là bản tóm tắt tiếng Việt.

- Cập nhật lần cuối: 2026-10-31, đối chiếu với Harmonia-BE `main@d394db4`. Thay đổi hợp đồng phía BE ghi ở `doc/api-changelog.md` của repo BE.
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
| B39 | `GET api/service-rosters/shortages` trả danh sách rỗng khi sự kiện chưa có vị trí nào cần người | Hiện trả 409 `ROSTER_SONG_LIST_NOT_APPROVED`; Web đang tự đổi thành rỗng. Ưu tiên thấp |
| B41 | Cho Ca trưởng đọc `GET …/preparation-status` của sự kiện ca đoàn mình phục vụ | Hiện chỉ Cha xứ; Web phải gọi 4 API rồi tự cộng. Ưu tiên thấp |
| B42 | Lời bài hát có mốc thời gian từng câu, chạy theo audio mẫu | Cho phòng luyện tập. Chờ owner quyết ai nhập mốc thời gian |
| B43 | Thu âm trong phòng luyện tập của buổi tập | BE chỉ nhận bản thu của ca viên khi nộp bài tập. Chờ owner quyết ai thu và có lưu lại không |
| B44 | Hạn chót nộp danh sách bài hát của một sự kiện | Tổng quan Ca trưởng muốn ghi hạn chót cạnh mỗi việc; hiện chỉ có ngày cử hành. Chờ owner quyết cách tính hạn |
| B45 | Màu phụng vụ theo ngày, hoặc Tam Nhật Vượt Qua là một mùa riêng | BE gộp Tam Nhật vào Mùa Chay và không trả màu, nên Web chưa hiện được ngày đỏ và ngày hồng. Ưu tiên thấp |

Hai việc BE cần xem (không phải mục backlog, chi tiết ở cuối `tbd-backlog.md`):

- `doc/api-changelog.md` chưa ghi các thay đổi tư liệu ngày 29–30/10, trong đó có hai thay đổi làm hỏng client: lời bài hát bỏ `.pdf`/`.png`/`.jpg`, và `fileName`/`fileUrl` có thể `null`.
- Trên API đã deploy, trích lời bằng AI (`POST …/extract-lyrics`) luôn trả `502 EXTERNAL_AI_FAILED` trong chưa tới một giây. Nên kiểm tra cấu hình `Gemini__*` trên Azure; gợi ý phân công dùng cùng khoá nhưng lỗi thì tự chuyển sang quy tắc nên không lộ ra.

Owner đã chốt ngày 2026-10-27 (ghi ở `open-business-decisions.md`): giữ thứ tự gợi ý bài như BE; giữ cho khai bè S/A/T/B ở vai cả buổi lễ; đề nghị BE chặn phân công trùng giờ (B40, BE đã làm).

- Đã xong ở `d394db4` và `c8ba80f` (2026-10-27 đến 30): B40 (chặn trùng giờ), lời bài hát dạng `.docx` hoặc gõ thẳng, MIDI, trích lời bằng AI, tìm bài theo lời. Web nối hết ở #254, kèm ghi chú từng bài của buổi tập và đăng xuất mọi thiết bị (BE có từ trước).
- Đã xong ở `d1ca63e` (2026-10-27): phân loại bài theo phần phụng vụ, cây chủ đề, số người; gợi ý bài; phân công 3 tầng. Web nối ở #223, #225, #227.
- Đã xong ở `c091c07` (2026-10-26): B37 (Cha xứ đọc danh sách ca đoàn), B38 (Admin tìm ca viên). Web nối ở #219.
- Đã xong ở `718696c` (2026-10-25): B10, B24–B28, B31–B36. Web đã dùng hết (B27 ở #215, B31 ở #211).
- Ghi chú cho BE: `c091c07` chưa có dòng nào trong `doc/api-changelog.md`.

Chi tiết và bằng chứng của từng mục nằm trong [`tbd-backlog.md`](tbd-backlog.md).

## Cách cập nhật

Phía Web cập nhật thư mục này sau khi sửa code, bằng một lệnh riêng: đối chiếu lại với commit BE mới nhất, đổi trạng thái các mục BE đã làm, thêm mục mới. Mỗi lần cập nhật đi trong một commit hoặc PR riêng, với tiêu đề bắt đầu bằng `docs(be-handoff):`. Ngày và commit BE ở đầu file này cho biết tài liệu đã đối chiếu tới đâu.
