# Tài liệu Web cho nhóm BE

Thư mục này giúp nhóm BE biết Web đang làm gì và cần bàn gì với BE, đọc trực tiếp sau khi `git pull` repo Harmonia-Web. Nội dung các file viết bằng tiếng Anh để giữ nguyên tên API, mã lỗi và trích dẫn code; file này là bản tóm tắt tiếng Việt.

- Cập nhật lần cuối: 2026-11-10, đối chiếu với Harmonia-BE `main@d74096c`. Thay đổi hợp đồng phía BE ghi ở `docs/api-changelog.md` của repo BE.
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
| B49 | Ca trưởng đọc được setting `Rehearsal.AttendanceStartCheckEnabled` | Khi Admin tắt kiểm tra, điểm danh được bất cứ lúc nào, nhưng Web không biết nên vẫn khoá bảng điểm danh trước giờ tập. Đề xuất: đặt setting là public hoặc trả kèm buổi tập |

Các việc BE cần xem (không phải mục backlog, chi tiết ở cuối `tbd-backlog.md`):

- `POST api/event-participations/confirm-all` không kiểm tra sự kiện đã qua (có chủ ý, để demo); ngoài demo, Ca trưởng có thể xác nhận hộ cả sự kiện đã diễn ra.
- Trên API đã deploy (2026-11-07), mọi bài tập hiện có đều chưa gắn bản mẫu MIDI nên chấm tự động trả `PRACTICE_REFERENCE_MISSING`; cần một bài tập có MIDI để thử điểm thật.
- Trên API đã deploy, ngày phụng vụ nào cũng còn `color = null`; cần Cha xứ đồng bộ lại năm 2026 thì Web mới hiện màu theo ngày.
- Trích lời bằng AI: BE đã tăng thời gian chờ và ghi lỗi Gemini vào log (`e6cf8dd`); Web chưa thử lại trên API đã deploy.

Owner đã chốt ngày 2026-10-27 (ghi ở `open-business-decisions.md`): giữ thứ tự gợi ý bài như BE; giữ cho khai bè S/A/T/B ở vai cả buổi lễ; đề nghị BE chặn phân công trùng giờ (B40, BE đã làm).

- Đã xong ở `d74096c` (2026-11-10): B42 (lời theo mốc thời gian cho audio/score); thumbnail trang đầu bản nhạc trong `SongDto`; `MusicMaterialDto.fileRevision`; notes schema v2 cho bản nhạc tương tác; upload audio hỏng trả `MATERIAL_AUDIO_INVALID`. Web chưa nối các trường và endpoint mới này.
- Đã xong ở `f449a4b` đến `717e8d1` (2026-11-07 đến 09): chat Cha xứ–Ca trưởng trả danh sách mọi Ca trưởng đang hoạt động, nên B48 đã có nguồn dữ liệu; đăng ký gia nhập công khai; đề cử, đào tạo và bổ nhiệm Ca trưởng. Web hiện mới dùng chat, chưa có các màn đăng ký/đề cử.
- Thay đổi bàn giao Ca trưởng ở `9f89eea` (2026-11-10): đổi role hoặc vô hiệu hoá người còn phụ trách trả `USER_STILL_DIRECTING`; `NotificationType` thêm `ChoirChanged`.
- Đã xong ở `d550665` (2026-11-07): sự kiện bắt buộc ca đoàn và ca đoàn phụ trách; lý do khi gỡ ca đoàn khỏi sự kiện đã công bố; ca trưởng thay thế cho một sự kiện; xác nhận hộ lời mời; chấm điểm tự động bản thu (Web `504a506`, `b906d14`, `2c6ed1f`); bản nhạc tương tác MusicXML và setting chặn điểm danh trước giờ tập thêm ở BE, Web chưa dùng (B49). `docs/api-changelog.md` của BE nay đã ghi mục 2026-11-03, API ảnh đại diện và các thay đổi quyền của `c091c07`.
- Đã xong ở `9b1f587` (2026-11-03): B46 (vai trò hiện tại trên từng hồ sơ ca viên; hồ sơ của người đã chuyển vai trò được giữ, ngừng hoạt động, không sửa được); thêm minh chứng ghi âm hoặc clip cho kỹ năng khai báo. Web nối hết ở #289.
- Đã xong ở `90af733` (2026-11-01): B39 (thiếu người trả rỗng), B41 (Ca trưởng đọc tình hình chuẩn bị), B43 (thu âm buổi tập, BE tự quyết: Ca trưởng thu, ca viên nghe trên mobile), B44 (hạn gửi danh sách bài), B45 (màu phụng vụ theo ngày); thêm API mọi phiên bản danh sách bài và ảnh đại diện. Web nối hết ở #265.
- Đã xong ở `d394db4` và `c8ba80f` (2026-10-27 đến 30): B40 (chặn trùng giờ), lời bài hát dạng `.docx` hoặc gõ thẳng, MIDI, trích lời bằng AI, tìm bài theo lời. Web nối hết ở #254, kèm ghi chú từng bài của buổi tập và đăng xuất mọi thiết bị (BE có từ trước). BE đã bổ sung changelog cho đợt này ở `eba5bc9`.
- Đã xong ở `d1ca63e` (2026-10-27): phân loại bài theo phần phụng vụ, cây chủ đề, số người; gợi ý bài; phân công 3 tầng. Web nối ở #223, #225, #227.
- Đã xong ở `c091c07` (2026-10-26): B37 (Cha xứ đọc danh sách ca đoàn), B38 (Admin tìm ca viên). Web nối ở #219.
- Đã xong ở `718696c` (2026-10-25): B10, B24–B28, B31–B36. Web đã dùng hết (B27 ở #215, B31 ở #211).

Chi tiết và bằng chứng của từng mục nằm trong [`tbd-backlog.md`](tbd-backlog.md).

## Cách cập nhật

Phía Web cập nhật thư mục này sau khi sửa code, bằng một lệnh riêng: đối chiếu lại với commit BE mới nhất, đổi trạng thái các mục BE đã làm, thêm mục mới. Mỗi lần cập nhật đi trong một commit hoặc PR riêng, với tiêu đề bắt đầu bằng `docs(be-handoff):`. Ngày và commit BE ở đầu file này cho biết tài liệu đã đối chiếu tới đâu.
