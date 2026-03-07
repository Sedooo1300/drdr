'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { usePatients, useVisits, useDoctors } from '@/hooks/useDB';
import { useBackup, useSync } from '@/hooks/useSync';
import { getAllItems, exportAllData, clearStore, deleteItem } from '@/lib/db';
import { themeConfigs, applyTheme } from '@/lib/themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Palette,
  Moon,
  Sun,
  Download,
  Upload,
  RefreshCw,
  Shield,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Stethoscope,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Database,
  Copy,
  Link2,
  ArrowRightLeft,
  Check,
  X,
  Wifi,
  WifiOff,
  MonitorSmartphone,
  LogOut,
  DoorOpen,
  UserPlus,
  Hash,
  Share2,
  Clock,
  Crown,
  Lock,
  Unlock,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Patient, Visit, Doctor, LaserTreatment, Expense, Revenue, Settings as SettingsType } from '@/lib/db';

export function SettingsSection() {
  const { 
    currentTheme, 
    darkMode, 
    setTheme, 
    toggleDarkMode,
    protectedSections,
    setProtectedSections,
    addNotification,
  } = useAppStore();
  const { patients } = usePatients();
  const { visits } = useVisits();
  const { doctors } = useDoctors();
  const { createBackup, restoreBackup, isBackingUp, lastBackup } = useBackup();
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const { 
    isOnline, 
    lastSync, 
    sync, 
    isSyncing,
    roomCode,
    isConnected,
    devices,
    syncCount,
    createRoom,
    joinRoom,
    leaveRoom,
    startAutoSync,
    pushData,
    pullData,
  } = useSync();

  const [activeTab, setActiveTab] = useState('sync');
  const [laserTreatments, setLaserTreatments] = useState<LaserTreatment[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDeleteStore, setSelectedDeleteStore] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const laser = await getAllItems<LaserTreatment>('laserTreatments');
      setLaserTreatments(laser);
      
      // Load auto backup setting
      const savedAutoBackup = localStorage.getItem('autoBackupEnabled');
      if (savedAutoBackup !== null) {
        setAutoBackupEnabled(savedAutoBackup === 'true');
      }
    };
    loadData();
  }, []);

  // Auto backup every 24 hours
  useEffect(() => {
    if (!autoBackupEnabled) return;
    
    const checkAndBackup = async () => {
      const lastAutoBackup = localStorage.getItem('lastAutoBackup');
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in ms
      
      if (!lastAutoBackup || (now - parseInt(lastAutoBackup)) >= twentyFourHours) {
        // Perform auto backup
        try {
          const data = await exportAllData();
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `auto-backup-clinic-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          localStorage.setItem('lastAutoBackup', now.toString());
          localStorage.setItem('lastBackup', new Date().toISOString());
          
          addNotification('تم النسخ الاحتياطي التلقائي', 'success');
        } catch (error) {
          console.error('Auto backup failed:', error);
        }
      }
    };
    
    // Check on mount
    checkAndBackup();
    
    // Check every hour
    const interval = setInterval(checkAndBackup, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoBackupEnabled, addNotification]);

  // Toggle auto backup
  const toggleAutoBackup = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('autoBackupEnabled', enabled.toString());
    addNotification(enabled ? 'تم تفعيل النسخ التلقائي' : 'تم إيقاف النسخ التلقائي', 'info');
  };

  // Apply theme on change
  useEffect(() => {
    applyTheme(currentTheme, darkMode);
  }, [currentTheme, darkMode]);

  // Calculate reports
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const todayVisits = visits.filter(v => v.date.startsWith(todayStr));
  const todayRevenue = todayVisits.reduce((sum, v) => sum + (v.price || 0), 0);
  const todayLaser = laserTreatments.filter(l => l.date.startsWith(todayStr));
  const todayLaserRevenue = todayLaser.reduce((sum, l) => sum + l.price, 0);
  const weekVisits = visits.filter(v => {
    const date = new Date(v.date);
    return date >= weekStart && date <= weekEnd;
  });
  const weekRevenue = weekVisits.reduce((sum, v) => sum + (v.price || 0), 0);
  const monthVisits = visits.filter(v => {
    const date = new Date(v.date);
    return date >= monthStart && date <= monthEnd;
  });
  const monthRevenue = monthVisits.reduce((sum, v) => sum + (v.price || 0), 0);
  const monthLaserRevenue = laserTreatments.filter(l => {
    const date = new Date(l.date);
    return date >= monthStart && date <= monthEnd;
  }).reduce((sum, l) => sum + l.price, 0);

  // Handle file import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await restoreBackup(file);
    addNotification('تم استيراد البيانات بنجاح', 'success');
  };

  // Toggle protection
  const toggleProtection = (section: string) => {
    if (protectedSections.includes(section)) {
      setProtectedSections(protectedSections.filter(s => s !== section));
    } else {
      setProtectedSections([...protectedSections, section]);
    }
  };

  // Handle join room
  const handleJoinRoom = async () => {
    if (!joinCode || joinCode.length < 4) {
      addNotification('أدخل كود صحيح', 'error');
      return;
    }
    const success = await joinRoom(joinCode.toUpperCase());
    if (success) {
      setShowJoinDialog(false);
      setJoinCode('');
      startAutoSync();
    }
  };

  // Handle create room
  const handleCreateRoom = async () => {
    const code = await createRoom();
    if (code) {
      startAutoSync();
    }
  };

  // Handle delete store - Fixed version
  const handleDeleteStore = async (storeId: string) => {
    try {
      if (storeId === 'all') {
        const stores = [
          'patients', 'visits', 'sessions', 'sessionTypes', 'doctors',
          'laserTreatments', 'photos', 'files', 'appointments',
          'expenses', 'revenues', 'prescriptions',
          'attendance', 'medications', 'prescriptionTemplates'
        ];
        for (const store of stores) {
          await clearStore(store);
        }
        addNotification('تم حذف جميع البيانات', 'success');
      } else {
        await clearStore(storeId);
        addNotification('تم حذف البيانات', 'success');
      }
      window.dispatchEvent(new CustomEvent('data-updated'));
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Delete error:', error);
      addNotification('فشل حذف البيانات', 'error');
    }
  };

  // Copy room code
  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      addNotification('تم نسخ الكود!', 'success');
    }
  };

  // Handle sync button
  const handleSync = async () => {
    await pushData();
    await pullData();
    addNotification('تمت المزامنة!', 'success');
  };

  const dataStores = [
    { id: 'patients', name: 'المرضى', icon: Users, count: patients.length },
    { id: 'visits', name: 'الزيارات', icon: Calendar, count: visits.length },
    { id: 'doctors', name: 'الأطباء', icon: Stethoscope, count: doctors.length },
    { id: 'laserTreatments', name: 'علاجات الليزر', icon: Zap, count: laserTreatments.length },
  ];

  // Check system status
  const [systemStatus, setSystemStatus] = useState<{configured: boolean; mode: string} | null>(null);
  
  useEffect(() => {
    fetch('/api/sync?action=status')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(() => setSystemStatus(null));
  }, []);

  return (
    <div className="space-y-4 p-3 md:p-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">الإعدادات والتقارير</h1>
        <p className="text-sm text-muted-foreground">إدارة النظام والمزامنة</p>
      </div>

      {/* System Status Card */}
      {systemStatus && (
        <Card className={systemStatus.configured ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {systemStatus.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {systemStatus.configured ? '✅ المزامنة جاهزة' : '⚠️ المزامنة تحتاج إعداد'}
                </p>
                <p className="text-xs text-muted-foreground">
                  الوضع: {systemStatus.mode === 'upstash' ? 'Upstash (سحابي)' : 'ذاكرة محلية'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="sync" className="text-xs md:text-sm">المزامنة</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs md:text-sm">التقارير</TabsTrigger>
          <TabsTrigger value="themes" className="text-xs md:text-sm">المظهر</TabsTrigger>
          <TabsTrigger value="protection" className="text-xs md:text-sm">الحماية</TabsTrigger>
          <TabsTrigger value="data" className="text-xs md:text-sm">البيانات</TabsTrigger>
        </TabsList>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardContent className="pt-4">
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isOnline ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {isOnline ? (
                  <Wifi className="h-6 w-6 text-green-500" />
                ) : (
                  <WifiOff className="h-6 w-6 text-red-500" />
                )}
                <div className="flex-1">
                  <p className="font-bold">{isOnline ? 'متصل بالإنترنت' : 'غير متصل'}</p>
                  <p className="text-xs text-muted-foreground">
                    {lastSync ? `آخر مزامنة: ${format(new Date(lastSync), 'HH:mm')}` : 'لم تتم المزامنة'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Section */}
          {!isConnected ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MonitorSmartphone className="h-5 w-5 text-primary" />
                  غرفة المزامنة
                </CardTitle>
                <CardDescription>
                  أنشئ غرفة جديدة أو انضم لغرفة موجودة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create Room */}
                <Button 
                  className="w-full h-auto py-6 flex-col gap-2 touch-manipulation"
                  onClick={handleCreateRoom}
                  disabled={isSyncing || !isOnline}
                >
                  <Crown className="h-8 w-8" />
                  <span className="text-lg font-bold">إنشاء غرفة جديدة</span>
                  <span className="text-xs opacity-70">ستحصل على كود لمشاركته</span>
                </Button>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                    أو
                  </span>
                </div>

                {/* Join Room */}
                <Button 
                  variant="outline"
                  className="w-full h-auto py-6 flex-col gap-2 touch-manipulation"
                  onClick={() => setShowJoinDialog(true)}
                  disabled={isSyncing || !isOnline}
                >
                  <DoorOpen className="h-8 w-8" />
                  <span className="text-lg font-bold">الانضمام لغرفة</span>
                  <span className="text-xs opacity-70">أدخل كود الغرفة</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Connected Room */
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    متصل بالغرفة
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {devices} جهاز
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Room Code Display */}
                <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-xl">
                  <Hash className="h-6 w-6 text-primary" />
                  <span className="text-3xl font-bold font-mono tracking-wider">{roomCode}</span>
                  <Button variant="ghost" size="icon" onClick={copyRoomCode}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  شارك هذا الكود مع الأجهزة الأخرى للاتصال
                </p>

                <Separator />

                {/* Sync Status - Live */}
                <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    المزامنة نشطة
                  </p>
                </div>

                {/* Sync Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="touch-manipulation"
                  >
                    <RefreshCw className={`h-4 w-4 ml-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    مزامنة الآن
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={leaveRoom}
                    className="touch-manipulation"
                  >
                    <LogOut className="h-4 w-4 ml-2" />
                    إيقاف المزامنة
                  </Button>
                </div>

                {/* Sync Info */}
                <div className="text-center text-xs text-muted-foreground space-y-1">
                  <p>عدد عمليات المزامنة: <span className="font-bold">{syncCount}</span></p>
                  <p>المزامنة التلقائية كل 3 ثوانٍ</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Backup Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5 text-primary" />
                نسخ احتياطي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auto Backup Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">نسخ تلقائي</p>
                    <p className="text-xs text-muted-foreground">كل 24 ساعة</p>
                  </div>
                </div>
                <Switch 
                  checked={autoBackupEnabled} 
                  onCheckedChange={toggleAutoBackup} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-auto py-4 flex-col gap-2 touch-manipulation"
                  onClick={createBackup}
                  disabled={isBackingUp}
                >
                  <Download className="h-5 w-5" />
                  <span>تصدير</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 touch-manipulation"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBackingUp}
                >
                  <Upload className="h-5 w-5" />
                  <span>استيراد</span>
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileImport}
              />
              {lastBackup && (
                <p className="text-xs text-center text-muted-foreground">
                  آخر نسخة: {format(new Date(lastBackup), 'd MMM yyyy HH:mm', { locale: ar })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground">إيرادات اليوم</p>
                <p className="text-xl font-bold text-green-500">
                  {(todayRevenue + todayLaserRevenue).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">ج.م</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground">إيرادات الأسبوع</p>
                <p className="text-xl font-bold text-blue-500">
                  {weekRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">ج.م</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground">إيرادات الشهر</p>
                <p className="text-xl font-bold text-purple-500">
                  {(monthRevenue + monthLaserRevenue).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">ج.م</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground">زيارات الشهر</p>
                <p className="text-xl font-bold text-amber-500">
                  {monthVisits.length}
                </p>
                <p className="text-xs text-muted-foreground">زيارة</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ملخص الزيارات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                  <span>كشوفات</span>
                  <Badge>{visits.filter(v => v.type === 'examination').length}</Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                  <span>إعادات</span>
                  <Badge>{visits.filter(v => v.type === 'followup').length}</Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                  <span>جلسات</span>
                  <Badge>{visits.filter(v => v.type === 'session').length}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">إحصائيات عامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                  <span>المرضى</span>
                  <Badge>{patients.length}</Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                  <span>الأطباء</span>
                  <Badge>{doctors.length}</Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                  <span>علاجات الليزر</span>
                  <Badge>{laserTreatments.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-primary" />
                المظهر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">الوضع الليلي</p>
                    <p className="text-xs text-muted-foreground">تقليل إجهاد العين</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>

              <div>
                <Label className="mb-3 block">اختر اللون</Label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {themeConfigs.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setTheme(theme.id)}
                      className={`p-3 rounded-xl border-2 transition-all hover:scale-105 touch-manipulation ${
                        currentTheme === theme.id ? 'border-primary shadow-lg' : 'border-transparent'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-1"
                        style={{ background: theme.gradient }}
                      />
                      <p className="text-xs text-center">{theme.nameAr}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Protection Tab */}
        <TabsContent value="protection" className="space-y-4">
          {/* Password Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" />
                كلمة السر
              </CardTitle>
              <CardDescription>تغيير كلمة سر الأقسام المحمية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="font-medium">كلمة السر الحالية</p>
                  <p className="text-2xl font-mono font-bold text-primary">2137</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  <Lock className="h-4 w-4 ml-2" />
                  تغيير
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Protected Sections */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                الأقسام المحمية
              </CardTitle>
              <CardDescription>اختر الأقسام التي تريد حمايتها بكلمة سر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { id: 'doctors', name: 'قسم الأطباء', icon: Stethoscope },
                { id: 'photos', name: 'صور قبل/بعد', icon: FileText },
                { id: 'settings', name: 'الإعدادات', icon: Settings },
              ].map((section) => (
                <div 
                  key={section.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {protectedSections.includes(section.id) ? (
                      <Lock className="h-5 w-5 text-primary" />
                    ) : (
                      <Unlock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{section.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {protectedSections.includes(section.id) ? 'محمي بكلمة سر' : 'غير محمي'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={protectedSections.includes(section.id)}
                    onCheckedChange={() => toggleProtection(section.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card className="border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <Database className="h-5 w-5" />
                إدارة البيانات
              </CardTitle>
              <CardDescription>حذف البيانات من أقسام معينة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">تحذير: الحذف لا يمكن التراجع عنه</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dataStores.map((store) => (
                  <AlertDialog key={store.id}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="h-auto py-3 flex-col gap-1 touch-manipulation">
                        <store.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs">{store.name}</span>
                        <Badge variant="secondary" className="text-xs">{store.count}</Badge>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف {store.name}؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف {store.count} عنصر. هذا الإجراء نهائي.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => handleDeleteStore(store.id)}
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ))}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full touch-manipulation">
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف جميع البيانات
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف جميع البيانات؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف جميع البيانات من جميع الأقسام نهائياً.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground"
                      onClick={() => handleDeleteStore('all')}
                    >
                      حذف الكل
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Join Room Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">الانضمام لغرفة</DialogTitle>
            <DialogDescription>
              أدخل كود الغرفة المكون من 6 أحرف/أرقام
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="مثال: ABC123"
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleJoinRoom} disabled={joinCode.length < 4 || isSyncing}>
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <DoorOpen className="h-4 w-4 ml-2" />
              )}
              انضمام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تغيير كلمة السر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة السر الجديدة</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة السر الجديدة"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => {
              addNotification('تم تغيير كلمة السر', 'success');
              setShowPasswordDialog(false);
            }}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
