// notices 테이블 구조 확인
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdecinmapanpmohbtdbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZWNpbm1hcGFucG1vaGJ0ZGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI5ODksImV4cCI6MjA2NTAyODk4OX0.Amef6P0VDQ0hvzjUkyym9blu5OzwRa61I0nMTGpVEw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNoticesTable() {
  console.log('🔍 notices 테이블 구조 확인...\n');

  try {
    // 1. notices 테이블 존재 확인
    const { data: noticesData, error: noticesError } = await supabase
      .from('notices')
      .select('*')
      .limit(1);
    
    if (noticesError) {
      console.log('❌ notices 테이블 오류:', noticesError.message);
      
      // 테이블이 없다면 어떤 테이블들이 있는지 확인
      console.log('\n📋 사용 가능한 테이블들:');
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_table_names');
      
      if (tablesError) {
        console.log('❌ 테이블 목록 조회 실패:', tablesError.message);
      } else {
        console.log('✅ 테이블 목록:', tables);
      }
    } else {
      console.log('✅ notices 테이블 접근 가능');
      if (noticesData.length > 0) {
        console.log('📊 notices 테이블 컬럼:', Object.keys(noticesData[0]));
      } else {
        console.log('ℹ️ notices 테이블이 비어있음');
        
        // 빈 테이블이라도 구조를 알아보기 위해 간단한 삽입 시도
        const { data: insertTest, error: insertError } = await supabase
          .from('notices')
          .insert({
            title: 'test',
            content: 'test content'
          })
          .select();
        
        if (insertError) {
          console.log('🔍 테이블 구조 힌트 (삽입 오류):', insertError.message);
        } else {
          console.log('✅ 기본 삽입 성공, 컬럼:', Object.keys(insertTest[0]));
          // 테스트 데이터 삭제
          await supabase.from('notices').delete().eq('title', 'test');
        }
      }
    }

    // 2. 다른 알림 관련 테이블 확인
    console.log('\n📋 관련 테이블들 확인:');
    const possibleTables = ['notifications', 'announcements', 'news', 'alerts'];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${tableName} 테이블 존재`);
          if (data.length > 0) {
            console.log(`   컬럼: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        // 테이블이 없으면 무시
      }
    }

  } catch (error) {
    console.error('❌ 전체 오류:', error);
  }
}

checkNoticesTable();