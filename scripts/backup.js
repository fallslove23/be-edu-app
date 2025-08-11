#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const isQuickBackup = process.argv.includes('--quick');

// 백업할 중요한 파일들 정의
const importantFiles = [
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'eslint.config.js',
  'index.html',
  '.gitignore'
];

const importantDirectories = [
  'src/components',
  'src/types',
  'src/contexts',
  'src/config',
  'src/services',
  'src/hooks'
];

// 전체 백업용 디렉토리 (quick 모드가 아닐 때)
const fullBackupDirectories = [
  'src',
  'public',
  'scripts'
];

function createBackupName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `backup-${timestamp}${isQuickBackup ? '-quick' : ''}`;
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
  const backupName = createBackupName();
  const backupDir = path.join(rootDir, 'project-backups', backupName);
  
  console.log(`🚀 ${isQuickBackup ? '빠른' : '전체'} 백업을 시작합니다...`);
  console.log(`📁 백업 디렉토리: ${backupName}`);
  
  // 백업 디렉토리 생성
  fs.mkdirSync(backupDir, { recursive: true });
  
  // 중요한 파일들 백업
  console.log('📄 중요 설정 파일들 백업 중...');
  for (const file of importantFiles) {
    const sourcePath = path.join(rootDir, file);
    const targetPath = path.join(backupDir, file);
    
    if (fs.existsSync(sourcePath)) {
      copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ ${file}`);
    }
  }
  
  // 디렉토리 백업
  const directoriesToBackup = isQuickBackup ? importantDirectories : fullBackupDirectories;
  
  console.log(`📁 ${isQuickBackup ? '중요' : '전체'} 디렉토리 백업 중...`);
  for (const dir of directoriesToBackup) {
    const sourcePath = path.join(rootDir, dir);
    const targetPath = path.join(backupDir, dir);
    
    if (fs.existsSync(sourcePath)) {
      copyDirectorySync(sourcePath, targetPath);
      console.log(`  ✅ ${dir}/`);
    }
  }
  
  // 백업 정보 파일 생성
  const backupInfo = {
    timestamp: new Date().toISOString(),
    type: isQuickBackup ? 'quick' : 'full',
    files: importantFiles.filter(file => fs.existsSync(path.join(rootDir, file))),
    directories: directoriesToBackup.filter(dir => fs.existsSync(path.join(rootDir, dir))),
    description: `${isQuickBackup ? '빠른' : '전체'} 백업 - ${new Date().toLocaleString('ko-KR')}`
  };
  
  fs.writeFileSync(
    path.join(backupDir, 'backup-info.json'),
    JSON.stringify(backupInfo, null, 2)
  );
  
  console.log('✨ 백업 완료!');
  console.log(`📊 백업된 파일: ${backupInfo.files.length}개`);
  console.log(`📊 백업된 디렉토리: ${backupInfo.directories.length}개`);
  console.log(`💾 백업 위치: project-backups/${backupName}`);
  
  // 오래된 백업 정리 (최근 10개만 보관)
  const backupsDir = path.join(rootDir, 'project-backups');
  const backups = fs.readdirSync(backupsDir)
    .filter(item => fs.statSync(path.join(backupsDir, item)).isDirectory())
    .sort((a, b) => {
      const statA = fs.statSync(path.join(backupsDir, a));
      const statB = fs.statSync(path.join(backupsDir, b));
      return statB.mtime - statA.mtime;
    });
  
  if (backups.length > 10) {
    const toDelete = backups.slice(10);
    console.log(`🗑️  오래된 백업 ${toDelete.length}개 삭제 중...`);
    
    for (const oldBackup of toDelete) {
      const oldBackupPath = path.join(backupsDir, oldBackup);
      fs.rmSync(oldBackupPath, { recursive: true, force: true });
      console.log(`  🗑️  ${oldBackup}`);
    }
  }
}

main();