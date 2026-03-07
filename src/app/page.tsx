'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { initDB, initializeDefaultData } from '@/lib/db';
import { applyTheme } from '@/lib/themes';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CenterSection } from '@/components/sections/CenterSection';
import { AssistantSection } from '@/components/sections/AssistantSection';
import { DoctorsSection } from '@/components/sections/DoctorsSection';
import { LaserSection } from '@/components/sections/LaserSection';
import { SearchSection } from '@/components/sections/SearchSection';
import { SettingsSection } from '@/components/sections/SettingsSection';
import { PhotosSection } from '@/components/sections/PhotosSection';
import { PasswordModal, ProtectedRoute } from '@/components/common/PasswordProtection';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export default function Home() {
  const { 
    currentSection, 
    currentTheme, 
    darkMode, 
    sidebarOpen,
    setCurrentSection 
  } = useAppStore();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize database and default data
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        await initializeDefaultData();
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('فشل في تحميل قاعدة البيانات');
      }
    };
    init();
  }, []);

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(currentTheme, darkMode);
  }, [currentTheme, darkMode]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((err) => {
          console.error('SW registration failed:', err);
        });
    }
  }, []);

  // Render section content
  const renderSection = () => {
    switch (currentSection) {
      case 'center':
        return <CenterSection />;
      case 'assistant':
        return <AssistantSection />;
      case 'doctors':
        return (
          <ProtectedRoute isProtected={true}>
            <DoctorsSection />
          </ProtectedRoute>
        );
      case 'laser':
        return <LaserSection />;
      case 'photos':
        return (
          <ProtectedRoute isProtected={true}>
            <PhotosSection />
          </ProtectedRoute>
        );
      case 'search':
        return <SearchSection />;
      case 'settings':
        return (
          <ProtectedRoute isProtected={true}>
            <SettingsSection />
          </ProtectedRoute>
        );
      default:
        return <CenterSection />;
    }
  };

  // Loading state
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">م</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            جاري تحميل النظام...
          </h2>
          <p className="text-muted-foreground">
            يرجى الانتظار قليلاً
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error}
          </h2>
          <p className="text-muted-foreground mb-4">
            يرجى تحديث الصفحة أو التواصل مع الدعم الفني
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            تحديث الصفحة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen bg-background text-foreground',
      darkMode && 'dark'
    )} dir="rtl">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className={cn(
        'transition-all duration-300',
        sidebarOpen ? 'md:mr-72' : 'md:mr-0'
      )}>
        <Header />
        <div className="min-h-[calc(100vh-4rem)]">
          {renderSection()}
        </div>
      </main>

      {/* Password Modal */}
      <PasswordModal />

      {/* Toaster */}
      <Toaster />
    </div>
  );
}
