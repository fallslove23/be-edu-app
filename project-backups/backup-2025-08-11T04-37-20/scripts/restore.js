#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function listBackups() {
  const backupsDir = path.join(rootDir, 'project-backups');
  
  if (!fs.existsSync(backupsDir)) {
    console.log('❌ 백업 디렉토리가 존재하지 않습니다.');
    return [];
  }
  
  const backups = fs.readdirSync(backupsDir)
    .filter(item => fs.statSync(path.join(backupsDir, item)).isDirectory())
    .map(name => {
      const backupPath = path.join(backupsDir, name);
      const infoPath = path.join(backupPath, 'backup-info.json');
      let info = null;
      
      if (fs.existsSync(infoPath)) {
        try {
          info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        } catch (e) {
          // ignore
        }
      }
      
      return {
        name,
        path: backupPath,
        info,
        mtime: fs.statSync(backupPath).mtime
      };
    })
    .sort((a, b) => b.mtime - a.mtime);
  
  return backups;
}

function copyFileSync(source, target) {
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(source, target);
}

function copyDirectorySync(source, target) {
  if (!fs.existsSync(source)) return;
  
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  
  for (const file of files) {
    if (file === 'backup-info.json') continue; // 백업 정보 파일은 복원하지 않음
    
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyDirectorySync(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

function main() {
  const backupName = process.argv[2];
  
  if (!backupName) {
    console.log('📦 사용 가능한 백업 목록:');
    console.log('');
    
    const backups = listBackups();
    
    if (backups.length === 0) {
      console.log('❌ 백업이 없습니다. 먼저 백업을 생성해주세요.');
      console.log('   npm run backup 또는 npm run backup:quick');
      return;
    }
    
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name}`);
      if (backup.info) {
        console.log(`   📅 ${new Date(backup.info.timestamp).toLocaleString('ko-KR')}`);
        console.log(`   📝 ${backup.info.description}`);
        console.log(`   📊 파일 ${backup.info.files?.length || 0}개, 디렉토리 ${backup.info.directories?.length || 0}개`);
      } else {
        console.log(`   📅 ${backup.mtime.toLocaleString('ko-KR')}`);
      }
      console.log('');
    });
    
    console.log('사용법:');
    console.log('  npm run restore <백업명>');
    console.log('  또는');
    console.log('  node scripts/restore.js <백업명>');
    return;
  }
  
  const backupPath = path.join(rootDir, 'project-backups', backupName);
  
  if (!fs.existsSync(backupPath)) {
    console.log(`❌ 백업 '${backupName}'을 찾을 수 없습니다.`);
    return;
  }
  
  console.log(`🔄 백업 '${backupName}' 복원을 시작합니다...`);
  
  // 백업 정보 읽기
  const infoPath = path.join(backupPath, 'backup-info.json');
  let backupInfo = null;
  
  if (fs.existsSync(infoPath)) {
    try {
      backupInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      console.log(`📝 ${backupInfo.description}`);
    } catch (e) {
      console.log('⚠️  백업 정보를 읽을 수 없습니다. 계속 진행합니다...');
    }
  }
  
  // 현재 백업 생성 (복원 전)
  console.log('💾 복원 전 현재 상태를 백업합니다...');
  try {
    const { execSync } = await import('child_process');
    execSync('npm run backup:quick', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  현재 상태 백업에 실패했지만 복원을 계속 진행합니다...');
  }
  
  // 복원 실행
  console.log('📁 파일 및 디렉토리 복원 중...');
  
  const items = fs.readdirSync(backupPath);
  let restoredCount = 0;
  
  for (const item of items) {
    if (item === 'backup-info.json') continue;
    
    const sourcePath = path.join(backupPath, item);
    const targetPath = path.join(rootDir, item);
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyDirectorySync(sourcePath, targetPath);
      console.log(`  ✅ ${item}/`);
    } else {
      copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ ${item}`);
    }
    restoredCount++;
  }
  
  console.log('✨ 복원 완료!');
  console.log(`📊 복원된 항목: ${restoredCount}개`);
  console.log('');
  console.log('🔧 다음 단계:');
  console.log('  1. npm install (필요한 경우)');
  console.log('  2. npm run dev (개발 서버 시작)');
  console.log('  3. 프로젝트 상태 확인');
}

main();