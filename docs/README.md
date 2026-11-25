# Tài liệu Web cho nhóm BE

Thư mục này giúp nhóm BE biết Web đang làm gì và cần bàn gì với BE, đọc trực tiếp sau khi `git pull` repo Harmonia-Web. Nội dung các file viết bằng tiếng Anh để giữ nguyên tên API, mã lỗi và trích dẫn code; file này là bản tóm tắt tiếng Việt.

- Cập nhật lần cuối: 2026-11-25, đối chiếu với Harmonia-BE `main@1040339`. Thay đổi hợp đồng phía BE ghi ở `docs/api-changelog.md` của repo BE.
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
6. [`practice-score-player.md`](practice-score-player.md): phòng luyện tập bản nhạc MusicXML chạy theo âm thanh: kiến trúc, nguồn bản nhạc (`ApiScoreSource` đã nối `GET api/music-materials/{id}/score`), giới hạn đã biết, việc còn lại.

## Cần bàn với BE (các mục còn mở hoặc đang nối phía Web)

| Mục | Việc cần BE làm | Ghi chú |
|---|---|---|
| B57 | Mã dòng phân công làm hỏng việc chốt, dưới dạng một trường | Vẫn mở ở `1040339`: mã dòng chỉ nằm trong câu thông báo tiếng Anh; Web phải tách ra từ câu đó để nêu tên ca viên |
| B58 | Sửa phân công sau khi đã chốt | Một phần ở `1040339`: BE tự mở lại phân công đã chốt khi ca viên rút lui, đổi trạng thái hoặc đổi vai trò. Còn thiếu: thay người hoặc điền chỗ trống khi đã chốt, và mở lại theo yêu cầu |
| B62 | Biết người gọi có được sửa buổi tập không, trên cả trang chi tiết | Một phần: danh sách buổi tập đã có `canManage`, `isPassed`; `GET api/schedule/rehearsals/{id}` thì chưa. Web giữ giá trị đọc từ danh sách |
| B65 | Ca trưởng đọc được chi tiết lễ đã huỷ của ca đoàn mình | Mới: danh sách có lễ đã huỷ nhưng `GET api/schedule/events/{id}` chỉ trả lễ đã công bố, mở ra báo 404. Web tạm đưa thông báo huỷ về danh sách chương trình |
| B66 | Hạn nộp bài luyện không sau giờ lễ mà bài đó chuẩn bị | Mới: BE chỉ chặn hạn trong quá khứ; chạy thật thì lễ 05/12 vẫn nhận hạn 20/12 |
| B52 | (BE đã xong) Câu trả lời tham gia đến ngay | SignalR `ReceiveParticipationChangedAsync` đã có; Web chưa nối, trang xác nhận tham gia vẫn hiện số liệu lúc tải |
| B53 | (BE đã xong) Liệt kê ca viên mời được theo sự kiện | Bộ lọc `eventId` trên `GET api/member-profiles` đã có; Web chưa nối |

Các việc BE cần xem (không phải mục backlog, chi tiết ở cuối `tbd-backlog.md`):

- `POST api/event-participations/confirm-all` không kiểm tra sự kiện đã qua (có chủ ý, để demo); ngoài demo, Ca trưởng có thể xác nhận hộ cả sự kiện đã diễn ra.
- Changelog BE (`docs/api-changelog.md`, mục mới nhất 2026-11-18) còn thiếu: bỏ `level` kỹ năng, thêm `gender` kỹ năng, yêu cầu vào ca đoàn, duyệt nhiều/gán kỹ năng, `preferredChoirId`, `isPassed`, `PRACTICE_ASSIGNMENT_NO_RECIPIENTS`, và các thay đổi của `1040339` (huỷ lễ xoá buổi tập/bài luyện, gỡ ca viên khỏi lễ sắp tới, ghi chú duyệt tối đa 1000 ký tự).
- Trên API đã deploy (2026-11-07), mọi bài tập hiện có đều chưa gắn bản mẫu MIDI nên chấm tự động trả `PRACTICE_REFERENCE_MISSING`; cần một bài tập có MIDI để thử điểm thật.
- Trên API đã deploy, ngày phụng vụ nào cũng còn `color = null`; cần Cha xứ đồng bộ lại năm 2026 thì Web mới hiện màu theo ngày.
- Trích lời bằng AI: BE đã tăng thời gian chờ và ghi lỗi Gemini vào log (`e6cf8dd`); Web chưa thử lại trên API đã deploy.

Owner đã chốt ngày 2026-10-27 (ghi ở `open-business-decisions.md`): giữ thứ tự gợi ý bài như BE; giữ cho khai bè S/A/T/B ở vai cả buổi lễ; đề nghị BE chặn phân công trùng giờ (B40, BE đã làm).

- Đã xong ở `1040339` (2026-11-25): huỷ lễ thì xoá buổi tập chưa diễn ra và bài luyện chưa ai nộp, danh sách buổi tập ẩn buổi của lễ đã huỷ, không huỷ được lễ đã bắt đầu; ca viên chuyển sang không sinh hoạt hoặc đổi vai trò thì bị gỡ khỏi xác nhận tham gia và phân công các lễ sắp tới (phân công đã chốt mở lại, Ca trưởng phụ trách được báo); ghi chú duyệt danh sách bài hát tối đa 1000 ký tự. Web báo trước các hệ quả này ở hộp huỷ lễ, form trạng thái ca viên và form đổi vai trò (PR #333).

- Đã xong ở `8b1de6f` (2026-11-18 đến 21):
  - **Web đã nối xong:** B49 (`14dabd3`, 2 setting mở điểm danh là public), B55 (sinh sự kiện gắn `choirIds`/`leadChoirId`), B56 (`463279d`, dòng điểm danh có `isActive`), B61 (Cha xứ đọc `GET api/event-participations`), B64 (`a395ce0`, mùa phụng vụ gắn `calendarKey`), khoá danh sách bài hát khi lễ đã qua hoặc huỷ (`61b3aa6`), kỹ năng có `gender` (`1e2f8f8`) và bỏ `level` (`d497b1d`), chặn tạo buổi tập trong quá khứ (`ac4a7bb`), giới hạn 429 cho đăng nhập/quên/đặt lại mật khẩu (`14dabd3`), mã lỗi `PRACTICE_ASSIGNMENT_NO_RECIPIENTS` (`a3b6b30`).
  - **Web nối ở PR #333 (2026-11-25):** B54 (ca đoàn của ca viên: Ca trưởng chỉ mời người chưa có ca đoàn, đề cử trong ca đoàn mình, hồ sơ hiện ca đoàn), B59 (sửa và thu hồi bài luyện), B63 (thu hồi kỹ năng trong hồ sơ ca viên), `preferredChoirId` (ô "Ca đoàn mong muốn" ở form đăng ký, `GET api/choirs/public`).
  - **BE đã xong, Web chưa nối:** B52 (SignalR `ReceiveParticipationChangedAsync`), B53 (bộ lọc `eventId`), màn yêu cầu/lời mời vào ca đoàn (`api/choir-join-requests`), duyệt nhiều/gán kỹ năng.

- Đã xong ở `088f30a` (2026-11-13): Cha xứ gọi được `POST api/event-participations`; ca trưởng nhận thông báo vai trò ca đoàn lúc công bố, không còn lúc sự kiện là bản nháp. Web đã nối: công bố xong là mời ca viên của các ca đoàn phục vụ.
- Đã xong ở `e18e49b` và `6c10d65` (2026-11-11 đến 12): B50 (Cha xứ tìm ca viên toàn giáo xứ), B51 (job trích lời bằng AI được lưu), `saintName` trên tài khoản, hồ sơ và đăng ký gia nhập.
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
