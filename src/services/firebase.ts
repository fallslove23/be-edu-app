import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase 플래너 앱 설정
const firebasePlannerConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PLANNER_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_PLANNER_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PLANNER_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_PLANNER_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_PLANNER_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_PLANNER_APP_ID || ''
};

let firebasePlannerApp: FirebaseApp;
let firebasePlannerDb: Firestore;
let firebasePlannerAuth: Auth;

// Firebase 플래너 앱 초기화
export const initializeFirebasePlanner = () => {
  try {
    // 이미 초기화된 앱이 있는지 확인
    const existingApp = getApps().find(app => app.name === 'planner');

    if (existingApp) {
      firebasePlannerApp = existingApp;
    } else {
      firebasePlannerApp = initializeApp(firebasePlannerConfig, 'planner');
    }

    firebasePlannerDb = getFirestore(firebasePlannerApp);
    firebasePlannerAuth = getAuth(firebasePlannerApp);

    console.log('✅ Firebase Planner 초기화 성공');
    return { app: firebasePlannerApp, db: firebasePlannerDb, auth: firebasePlannerAuth };
  } catch (error) {
    console.error('❌ Firebase Planner 초기화 실패:', error);
    throw error;
  }
};

// Firebase 플래너 인스턴스 가져오기
export const getFirebasePlanner = () => {
  if (!firebasePlannerApp || !firebasePlannerDb || !firebasePlannerAuth) {
    return initializeFirebasePlanner();
  }
  return { app: firebasePlannerApp, db: firebasePlannerDb, auth: firebasePlannerAuth };
};

// Firestore 데이터베이스 인스턴스 export
export const getPlannerDb = (): Firestore => {
  const { db } = getFirebasePlanner();
  return db;
};

// Firebase Auth 인스턴스 export
export const getPlannerAuth = (): Auth => {
  const { auth } = getFirebasePlanner();
  return auth;
};

// Firebase 플래너 앱이 설정되었는지 확인
export const isPlannerConfigured = (): boolean => {
  return !!(
    firebasePlannerConfig.apiKey &&
    firebasePlannerConfig.projectId &&
    firebasePlannerConfig.authDomain
  );
};
