// DEV FIXTURE – không phải API contract. Only UI review data for the practice room prototype.
import type { PracticeRoomView } from '../practiceRoomTypes'

export const rehearsalPracticeFixture: PracticeRoomView = {
  rehearsalId: 'rehearsal-demo-1',
  title: 'Buổi tập chuẩn bị Lễ Các Thánh',
  startAt: '2026-10-31T19:00:00+07:00',
  endAt: '2026-10-31T20:30:00+07:00',
  locationName: 'Phòng sinh hoạt giáo xứ',
  programName: 'Lễ Các Thánh',
  note: 'Ôn lại điệp khúc 2 và phần kết.',
  songs: [
    {
      id: 'song-1', title: 'Ca nhập lễ', section: 'Ca nhập lễ', durationSeconds: 240,
      localState: 'inProgress',
      lyrics: [
        { id: 'l1', text: 'Lạy Chúa, xin thương con', startSeconds: 0, endSeconds: 6 },
        { id: 'l2', text: 'Và nhận lời con khấn nguyện', startSeconds: 6, endSeconds: 13 },
        { id: 'l3', text: 'Xin Chúa lắng nghe tiếng ca của chúng con', startSeconds: 13, endSeconds: 22 },
      ],
    },
    { id: 'song-2', title: 'Đáp ca', section: 'Đáp ca', durationSeconds: 195, localState: 'notStarted', lyrics: [] },
    { id: 'song-3', title: 'Alleluia', section: 'Alleluia', durationSeconds: 210, localState: 'listened', lyrics: [] },
    { id: 'song-4', title: 'Dâng lễ', section: 'Dâng lễ', durationSeconds: 260, localState: 'notStarted', lyrics: [] },
  ],
}
