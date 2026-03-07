'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Home,
  UserPlus,
  Stethoscope,
  Zap,
  Search,
  Settings,
  ChevronRight,
  Wifi,
  WifiOff,
  Menu,
  X,
  Building2,
  Sparkles,
  Heart,
  Activity,
  ClipboardList,
  Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const menuItems = [
  {
    id: 'center',
    label: 'قسم المركز',
    icon: Building2,
    description: 'لوحة التحكم الرئيسية',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-500',
  },
  {
    id: 'assistant',
    label: 'قسم المساعد',
    icon: UserPlus,
    description: 'تسجيل المرضى والحجوزات',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-500',
    protected: false,
  },
  {
    id: 'doctors',
    label: 'قسم الأطباء',
    icon: Stethoscope,
    description: 'إدارة الأطباء والروشتات',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-500',
    protected: true,
  },
  {
    id: 'photos',
    label: 'صور قبل/بعد',
    icon: Image,
    description: 'متابعة تقدم العلاج',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-500/20',
    textColor: 'text-teal-500',
    protected: true,
  },
  {
    id: 'laser',
    label: 'قسم الليزر',
    icon: Sparkles,
    description: 'علاجات إزالة الشعر',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-500',
    protected: false,
  },
  {
    id: 'search',
    label: 'قسم البحث',
    icon: Search,
    description: 'البحث الشامل',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/20',
    textColor: 'text-pink-500',
    protected: false,
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: Settings,
    description: 'إعدادات النظام والتقارير',
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-500/20',
    textColor: 'text-slate-500',
    protected: true,
  },
] as const;

export function Sidebar() {
  const {
    currentSection,
    setCurrentSection,
    sidebarOpen,
    toggleSidebar,
    isOnline,
    protectedSections,
    isAuthenticated,
    openModal,
  } = useAppStore();

  const handleSectionClick = (sectionId: string, isProtected: boolean) => {
    if (isProtected && protectedSections.includes(sectionId) && !isAuthenticated) {
      openModal('password', { targetSection: sectionId });
      return;
    }
    setCurrentSection(sectionId as typeof currentSection);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 md:hidden bg-background/80 backdrop-blur-sm shadow-lg touch-manipulation"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed right-0 top-0 h-full w-72 md:w-72 bg-gradient-to-b from-background via-background to-muted/20 border-l border-border z-50 transition-transform duration-300 ease-in-out shadow-xl',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-border bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-2xl font-bold text-white">م</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">عيادة المغازى</h1>
              <p className="text-xs text-muted-foreground">نظام الإدارة المتكامل</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="px-3 md:px-4 py-2">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
              isOnline
                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                : 'bg-red-500/10 text-red-600 border border-red-500/20'
            )}
          >
            {isOnline ? (
              <>
                <div className="relative">
                  <Wifi className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <span>متصل بالإنترنت</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>وضع أوفلاين</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 md:px-3 py-2">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentSection === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionClick(item.id, item.protected || false)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-right transition-all duration-200 group touch-manipulation',
                    isActive
                      ? `bg-gradient-to-l ${item.color} bg-opacity-10 shadow-md`
                      : 'hover:bg-muted/50 active:bg-muted'
                  )}
                  style={isActive ? { background: `linear-gradient(to left, var(--tw-gradient-stops))` } : {}}
                >
                  <div
                    className={cn(
                      'p-2.5 rounded-xl transition-all duration-200',
                      isActive
                        ? `bg-gradient-to-br ${item.color} text-white shadow-lg`
                        : `${item.bgColor} ${item.textColor} group-hover:scale-110`
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'block font-medium text-sm truncate',
                      isActive ? 'text-foreground' : 'text-foreground/90'
                    )}>
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground truncate block">
                      {item.description}
                    </span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-transform flex-shrink-0',
                      isActive ? 'rotate-90 text-primary' : 'text-muted-foreground group-hover:translate-x-1'
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 md:p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            <div className="text-center text-xs text-muted-foreground">
              <p className="font-medium">إدارة عيادة المغازى</p>
              <p className="text-[10px]">الإصدار 1.1.0 - PWA</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
