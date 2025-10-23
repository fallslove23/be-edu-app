import React from 'react';
import {
  // Dashboard
  ChartBarIcon,
  // Course Management
  AcademicCapIcon,
  PlusCircleIcon,
  CalendarIcon,
  FolderIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  // Student Management  
  UsersIcon,
  UserIcon,
  UserPlusIcon,
  // Course Operation
  CogIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  // Assessment
  DocumentTextIcon,
  BeakerIcon,
  // Completion
  TrophyIcon,
  // Analytics
  MagnifyingGlassIcon,
  DocumentIcon,
  // System Management
  WrenchScrewdriverIcon,
  LockClosedIcon,
  MegaphoneIcon,
  ServerStackIcon,
  ComputerDesktopIcon,
  // Student Specific
  BookOpenIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  MicrophoneIcon,
  PencilIcon,
  ChartPieIcon,
  SpeakerWaveIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

// Heroicon component mapping
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Dashboard
  'chart-bar': ChartBarIcon,
  
  // Course Management
  'academic-cap': AcademicCapIcon,
  'plus-circle': PlusCircleIcon,
  'calendar': CalendarIcon,
  'folder': FolderIcon,
  'cloud-arrow-up': CloudArrowUpIcon,
  'cloud-arrow-down': CloudArrowDownIcon,
  
  // Student Management
  'users': UsersIcon,
  'user': UserIcon,
  'user-plus': UserPlusIcon,
  
  // Course Operation
  'cog': CogIcon,
  'clipboard-check': ClipboardDocumentCheckIcon,
  'trending-up': ArrowTrendingUpIcon,
  
  // Assessment
  'target': ChartBarIcon, // Using chart-bar for target
  'pencil-alt': PencilIcon,
  'beaker': BeakerIcon,
  
  // Completion
  'trophy': TrophyIcon,
  'document-text': DocumentTextIcon,
  
  // Analytics
  'magnifying-glass': MagnifyingGlassIcon,
  'document': DocumentIcon,
  'chart-bar-square': ChartBarIcon, // Survey management icon
  
  // System Management
  'wrench-screwdriver': WrenchScrewdriverIcon,
  'lock-closed': LockClosedIcon,
  'megaphone': MegaphoneIcon,
  'server-stack': ServerStackIcon,
  'computer-desktop': ComputerDesktopIcon,
  
  // Student Specific
  'book-open': BookOpenIcon,
  'calendar-days': CalendarDaysIcon,
  'pencil-square': PencilSquareIcon,
  'microphone': MicrophoneIcon,
  'pencil': PencilIcon,
  'chart-pie': ChartPieIcon,
  'speaker-wave': SpeakerWaveIcon,
  'shield-check': ShieldCheckIcon,
};

interface NavigationIconProps {
  iconName: string;
  className?: string;
}

export const NavigationIcon: React.FC<NavigationIconProps> = ({ iconName, className = "h-5 w-5" }) => {
  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    // Fallback to chart-bar icon if not found
    return <ChartBarIcon className={className} />;
  }
  
  return <IconComponent className={className} />;
};