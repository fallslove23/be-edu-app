/**
 * 과정 차수와 일정 캘린더 동기화 스크립트
 *
 * 사용법:
 *   npx tsx scripts/sync-course-schedules.ts
 */

import { CourseScheduleSyncService } from '../src/services/course-schedule-sync.service';

async function main() {
  console.log('🔄 과정 일정 동기화 시작...\n');

  try {
    // 현재부터 1년 후까지의 모든 과정을 동기화
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);

    const startDate = today.toISOString().split('T')[0];
    const endDate = oneYearLater.toISOString().split('T')[0];

    console.log(`기간: ${startDate} ~ ${endDate}\n`);

    await CourseScheduleSyncService.syncAllCoursesInPeriod(startDate, endDate);

    console.log('\n✅ 동기화 완료!');
  } catch (error) {
    console.error('\n❌ 동기화 실패:', error);
    process.exit(1);
  }
}

main();
