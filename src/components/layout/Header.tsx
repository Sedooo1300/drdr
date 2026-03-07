'use client';

import { useAppStore } from '@/lib/store';
import { themeConfigs } from '@/lib/themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Download,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useBackup } from '@/hooks/useSync';
import { usePatients, useAppointments } from '@/hooks/useDB';
import { useState } from 'react';

export function Header() {
  const {
    currentSection,
    currentTheme,
    darkMode,
    toggleDarkMode,
    setTheme,
    setSearchQuery,
    searchQuery,
    isAuthenticated,
    logout,
    isOnline,
    lastSync,
  } = useAppStore();

  const { createBackup, isBackingUp } = useBackup();
  const { patients } = usePatients();
  const { getToday } = useAppointments();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const todayAppointments = getToday();
  const theme = themeConfigs.find((t) => t.id === currentTheme) || themeConfigs[0];

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearchQuery(value);
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      center: 'لوحة التحكم',
      assistant: 'قسم المساعد',
      doctors: 'قسم الأطباء',
      laser: 'قسم الليزر',
      search: 'البحث',
      settings: 'الإعدادات',
    };
    return titles[currentSection] || 'لوحة التحكم';
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Right side - Title and Search */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <h2 className="text-xl font-bold text-foreground">{getSectionTitle()}</h2>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Search */}
          {(currentSection === 'search' || currentSection === 'assistant' || currentSection === 'doctors') && (
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="بحث..."
                value={localSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-64 pr-10 bg-muted/50"
              />
            </div>
          )}
        </div>

        {/* Left side - Actions */}
        <div className="flex items-center gap-2">
          {/* Stats badges */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {patients.length} مريض
            </Badge>
            {todayAppointments.length > 0 && (
              <Badge variant="default" className="gap-1">
                {todayAppointments.length} موعد اليوم
              </Badge>
            )}
          </div>

          {/* Backup button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => createBackup()}
            disabled={isBackingUp}
            title="نسخ احتياطي"
          >
            <Download className={`h-5 w-5 ${isBackingUp ? 'animate-bounce' : ''}`} />
          </Button>

          {/* Sync status */}
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className={`h-3 w-3 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
            {lastSync && (
              <span>
                آخر مزامنة: {new Date(lastSync).toLocaleTimeString('ar-EG')}
              </span>
            )}
          </div>

          {/* Dark mode toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {todayAppointments.length > 0 && (
                  <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {todayAppointments.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {todayAppointments.length > 0 ? (
                todayAppointments.map((apt) => (
                  <DropdownMenuItem key={apt.id} className="flex flex-col items-start gap-1">
                    <span className="font-medium">{apt.patientName}</span>
                    <span className="text-xs text-muted-foreground">
                      {apt.time} - {apt.type}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>لا توجد إشعارات جديدة</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full overflow-hidden"
              >
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ background: theme.gradient }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>اختر اللون</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid grid-cols-4 gap-2 p-2">
                {themeConfigs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      currentTheme === t.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    style={{ background: t.gradient }}
                    title={t.nameAr}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout (if authenticated) */}
          {isAuthenticated && (
            <Button variant="ghost" size="icon" onClick={logout} title="تسجيل الخروج">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
