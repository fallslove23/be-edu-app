import React from 'react';
import {
  // Dashboard
  LayoutGrid, // squares-2x2
  BarChart2, // chart-bar

  // Course Management
  GraduationCap, // academic-cap
  PlusCircle, // plus-circle
  Calendar, // calendar
  Folder, // folder
  CloudUpload, // cloud-arrow-up
  CloudDownload, // cloud-arrow-down

  // Student Management
  Users, // users
  User, // user
  UserPlus, // user-plus
  UserCircle, // user-circle
  UsersRound, // user-group
  Contact, // identification

  // Course Operation
  Settings, // cog
  ClipboardCheck, // clipboard-check
  ClipboardList, // clipboard-document-list
  TrendingUp, // trending-up

  // Assessment
  FileText, // document-text
  Copy, // document-duplicate
  FlaskConical, // beaker
  Target, // target

  // Completion
  Trophy, // trophy

  // Analytics
  Search, // magnifying-glass
  File, // document
  PieChart, // chart-pie

  // System Management
  Wrench, // wrench-screwdriver
  Lock, // lock-closed
  Megaphone, // megaphone
  Server, // server-stack
  Monitor, // computer-desktop

  // Student Specific
  BookOpen, // book-open
  Bookmark, // bookmark
  CalendarDays, // calendar-days
  PenSquare, // pencil-square
  Mic, // microphone
  Pen, // pencil
  AudioWaveform, // speaker-wave
  ShieldCheck, // shield-check

  // Resource Management
  Building2, // building-office
  Building, // building-office-2
  DollarSign, // currency-dollar
  Tag, // tag

  // System & Files
  Settings2, // cog-6-tooth
  Smartphone, // device-phone-mobile
  FolderOpen, // folder-open
  Upload, // arrow-up-tray
  Send, // paper-airplane
  Archive, // archive-box
  PlusSquare, // squares-plus

  // External Links
  Link, // link
  Star, // star

  // Additional utility
  Library, // library
  Backpack, // backpack

  // Fallback
  HelpCircle
} from 'lucide-react';

// Icon component mapping
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Dashboard
  'chart-bar': BarChart2,
  'squares-2x2': LayoutGrid,

  // Course Management
  'academic-cap': GraduationCap,
  'plus-circle': PlusCircle,
  'calendar': Calendar,
  'folder': Folder,
  'cloud-arrow-up': CloudUpload,
  'cloud-arrow-down': CloudDownload,

  // Student Management
  'users': Users,
  'user': User,
  'user-plus': UserPlus,
  'user-circle': UserCircle,
  'user-group': UsersRound,
  'identification': Contact,

  // Course Operation
  'cog': Settings,
  'clipboard-check': ClipboardCheck,
  'clipboard-document-check': ClipboardCheck,
  'clipboard-document-list': ClipboardList,
  'trending-up': TrendingUp,

  // Assessment
  'target': Target,
  'pencil-alt': Pen,
  'beaker': FlaskConical,
  'document-duplicate': Copy,

  // Completion
  'trophy': Trophy,
  'document-text': FileText,

  // Analytics
  'magnifying-glass': Search,
  'document': File,
  'chart-bar-square': BarChart2, // Survey management icon

  // System Management
  'wrench-screwdriver': Wrench,
  'lock-closed': Lock,
  'megaphone': Megaphone,
  'server-stack': Server,
  'computer-desktop': Monitor,

  // Student Specific
  'book-open': BookOpen,
  'bookmark': Bookmark,
  'calendar-days': CalendarDays,
  'pencil-square': PenSquare,
  'microphone': Mic,
  'pencil': Pen,
  'chart-pie': PieChart,
  'speaker-wave': AudioWaveform,
  'shield-check': ShieldCheck,

  // Resource Management
  'building-office': Building2,
  'building-office-2': Building,
  'currency-dollar': DollarSign,
  'tag': Tag,

  // System & Files
  'cog-6-tooth': Settings2,
  'device-phone-mobile': Smartphone,
  'folder-open': FolderOpen,
  'arrow-up-tray': Upload,
  'paper-airplane': Send,
  'archive-box': Archive,
  'squares-plus': PlusSquare,

  // External Links
  'link': Link,
  'star': Star,

  // Additional utility
  'library': Library,
  'backpack': Backpack,
};

interface NavigationIconProps {
  iconName: string;
  className?: string;
}

export const NavigationIcon: React.FC<NavigationIconProps> = ({ iconName, className = "h-5 w-5" }) => {
  const IconComponent = iconMap[iconName];

  if (!IconComponent) {
    // Fallback icon if not found
    return <HelpCircle className={className} />;
  }

  return <IconComponent className={className} />;
};