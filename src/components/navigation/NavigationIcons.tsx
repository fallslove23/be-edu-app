import React from 'react';
import {
  // Dashboard
  ChartBarIcon,
  Squares2X2Icon,
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
  UserCircleIcon,
  UserGroupIcon,
  IdentificationIcon,
  // Course Operation
  CogIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  // Assessment
  DocumentTextIcon,
  DocumentDuplicateIcon,
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
  BookmarkIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  MicrophoneIcon,
  PencilIcon,
  ChartPieIcon,
  SpeakerWaveIcon,
  ShieldCheckIcon,
  // Additional icons
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  FolderOpenIcon,
  ArrowUpTrayIcon,
  PaperAirplaneIcon,
  LinkIcon,
  StarIcon,
  TagIcon,
  ArchiveBoxIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';

// Heroicon component mapping
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Dashboard
  'chart-bar': ChartBarIcon,
  'squares-2x2': Squares2X2Icon,

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
  'user-circle': UserCircleIcon,
  'user-group': UserGroupIcon,
  'identification': IdentificationIcon,

  // Course Operation
  'cog': CogIcon,
  'clipboard-check': ClipboardDocumentCheckIcon,
  'clipboard-document-check': ClipboardDocumentCheckIcon,
  'clipboard-document-list': ClipboardDocumentListIcon,
  'trending-up': ArrowTrendingUpIcon,

  // Assessment
  'target': ChartBarIcon, // Using chart-bar for target
  'pencil-alt': PencilIcon,
  'beaker': BeakerIcon,
  'document-duplicate': DocumentDuplicateIcon,

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
  'bookmark': BookmarkIcon,
  'calendar-days': CalendarDaysIcon,
  'pencil-square': PencilSquareIcon,
  'microphone': MicrophoneIcon,
  'pencil': PencilIcon,
  'chart-pie': ChartPieIcon,
  'speaker-wave': SpeakerWaveIcon,
  'shield-check': ShieldCheckIcon,

  // Resource Management
  'building-office': BuildingOfficeIcon,
  'building-office-2': BuildingOffice2Icon,
  'currency-dollar': CurrencyDollarIcon,
  'tag': TagIcon,

  // System & Files
  'cog-6-tooth': Cog6ToothIcon,
  'device-phone-mobile': DevicePhoneMobileIcon,
  'folder-open': FolderOpenIcon,
  'arrow-up-tray': ArrowUpTrayIcon,
  'paper-airplane': PaperAirplaneIcon,
  'archive-box': ArchiveBoxIcon,
  'squares-plus': SquaresPlusIcon,

  // External Links
  'link': LinkIcon,
  'star': StarIcon,

  // Additional utility
  'library': BookOpenIcon, // Using book-open for library
  'backpack': UserIcon, // Using user for backpack (no exact match)
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