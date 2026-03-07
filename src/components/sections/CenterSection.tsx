'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { usePatients, useVisits, useAppointments } from '@/hooks/useDB';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  UserPlus,
  ClipboardList,
  Zap,
  FileText,
  Image as ImageIcon,
  Clock,
  ChevronLeft,
  AlertTriangle,
  Heart,
  Activity,
  Sparkles,
  Stethoscope,
  Search,
  Settings,
} from 'lucide-react';
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

export function CenterSection() {
  const { setCurrentSection, openModal } = useAppStore();
  const { patients } = usePatients();
  const { visits } = useVisits();
  const { appointments, getToday, getUpcoming } = useAppointments();

  const todayAppointments = getToday();
  const upcomingAppointments = getUpcoming();

  // Calculate statistics
  const todayVisits = visits.filter(v => isToday(new Date(v.date)));
  const weekVisits = visits.filter(v => {
    const date = new Date(v.date);
    return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
  });
  const monthVisits = visits.filter(v => {
    const date = new Date(v.date);
    return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
  });

  const todayRevenue = todayVisits.reduce((sum, v) => sum + (v.price || 0), 0);
  const weekRevenue = weekVisits.reduce((sum, v) => sum + (v.price || 0), 0);
  const monthRevenue = monthVisits.reduce((sum, v) => sum + (v.price || 0), 0);

  const quickActions: QuickAction[] = [
    {
      id: 'new-patient',
      label: 'مريض جديد',
      icon: <UserPlus className="h-5 w-5 md:h-6 md:w-6" />,
      gradient: 'from-blue-500 to-cyan-500',
      onClick: () => setCurrentSection('assistant'),
    },
    {
      id: 'new-examination',
      label: 'كشف جديد',
      icon: <ClipboardList className="h-5 w-5 md:h-6 md:w-6" />,
      gradient: 'from-green-500 to-emerald-500',
      onClick: () => setCurrentSection('assistant'),
    },
    {
      id: 'laser-case',
      label: 'حالة ليزر',
      icon: <Sparkles className="h-5 w-5 md:h-6 md:w-6" />,
      gradient: 'from-amber-500 to-orange-500',
      onClick: () => setCurrentSection('laser'),
    },
    {
      id: 'daily-report',
      label: 'تقرير يومي',
      icon: <FileText className="h-5 w-5 md:h-6 md:w-6" />,
      gradient: 'from-purple-500 to-violet-500',
      onClick: () => setCurrentSection('settings'),
    },
    {
      id: 'patient-photos',
      label: 'صور المريض',
      icon: <ImageIcon className="h-5 w-5 md:h-6 md:w-6" />,
      gradient: 'from-pink-500 to-rose-500',
      onClick: () => setCurrentSection('doctors'),
    },
    {
      id: 'search',
      label: 'بحث',
      icon: <Search className="h-5 w-5 md:h-6 md:w-6" />,
      gradient: 'from-teal-500 to-cyan-500',
      onClick: () => setCurrentSection('search'),
    },
  ];

  return (
    <div className="space-y-4 p-3 md:p-6 pb-20 md:pb-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            مرحباً بك في عيادة المغازى
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 py-1.5 md:py-2 px-3 md:px-4 text-sm">
            <Clock className="h-4 w-4" />
            {format(new Date(), 'HH:mm')}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className="h-auto py-3 md:py-4 flex-col gap-1.5 md:gap-2 hover:scale-105 transition-transform touch-manipulation"
            onClick={action.onClick}
          >
            <div className={`p-2 md:p-3 rounded-xl text-white bg-gradient-to-br ${action.gradient} shadow-lg`}>
              {action.icon}
            </div>
            <span className="text-xs md:text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-r-4 border-r-blue-500 bg-gradient-to-b from-blue-500/5 to-transparent">
          <CardHeader className="pb-1 md:pb-2 pt-3 md:pt-4 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">المرضى</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{patients.length}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 md:pb-4 px-3 md:px-6">
            <div className="flex items-center text-xs md:text-sm text-muted-foreground">
              <Users className="h-3 w-3 md:h-4 md:w-4 ml-1" />
              إجمالي المرضى
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500 bg-gradient-to-b from-green-500/5 to-transparent">
          <CardHeader className="pb-1 md:pb-2 pt-3 md:pt-4 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">زيارات اليوم</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{todayVisits.length}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 md:pb-4 px-3 md:px-6">
            <div className="flex items-center text-xs md:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 md:h-4 md:w-4 ml-1" />
              كشف وجلسات
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-amber-500 bg-gradient-to-b from-amber-500/5 to-transparent">
          <CardHeader className="pb-1 md:pb-2 pt-3 md:pt-4 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">إيرادات اليوم</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{todayRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 md:pb-4 px-3 md:px-6">
            <div className="flex items-center text-xs md:text-sm text-muted-foreground">
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 ml-1" />
              جنيه مصري
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500 bg-gradient-to-b from-purple-500/5 to-transparent">
          <CardHeader className="pb-1 md:pb-2 pt-3 md:pt-4 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">مواعيد اليوم</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{todayAppointments.length}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 md:pb-4 px-3 md:px-6">
            <div className="flex items-center text-xs md:text-sm text-muted-foreground">
              <Clock className="h-3 w-3 md:h-4 md:w-4 ml-1" />
              موعد مجدول
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule & Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                مواعيد اليوم
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCurrentSection('assistant')} className="text-xs">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-2">
                {todayAppointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground">{apt.type}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{apt.time}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد مواعيد اليوم</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              ملخص الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 md:p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <span className="text-xs md:text-sm text-muted-foreground">اليوم</span>
              <span className="text-base md:text-xl font-bold text-blue-500">
                {todayRevenue.toLocaleString()} ج.م
              </span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <span className="text-xs md:text-sm text-muted-foreground">هذا الأسبوع</span>
              <span className="text-base md:text-xl font-bold text-green-500">
                {weekRevenue.toLocaleString()} ج.م
              </span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <span className="text-xs md:text-sm text-muted-foreground">هذا الشهر</span>
              <span className="text-base md:text-xl font-bold text-purple-500">
                {monthRevenue.toLocaleString()} ج.م
              </span>
            </div>

            {/* Progress bar for monthly target */}
            <div className="pt-3 border-t">
              <div className="flex justify-between text-xs md:text-sm mb-2">
                <span className="text-muted-foreground">الهدف الشهري</span>
                <span>{Math.min(100, Math.round(monthRevenue / 50000 * 100))}%</span>
              </div>
              <Progress value={Math.min(100, monthRevenue / 50000 * 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
            المواعيد القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {upcomingAppointments.slice(0, 6).map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 md:p-4 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate">{apt.patientName}</span>
                    <Badge
                      variant={isToday(new Date(apt.date)) ? 'default' : 'secondary'}
                      className="text-xs flex-shrink-0"
                    >
                      {isToday(new Date(apt.date))
                        ? 'اليوم'
                        : isTomorrow(new Date(apt.date))
                        ? 'غداً'
                        : format(new Date(apt.date), 'EEE d MMM', { locale: ar })}
                    </Badge>
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    <p>{apt.time} - {apt.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد مواعيد قادمة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              أحدث المرضى
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentSection('assistant')} className="text-xs">
              عرض الكل
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {patients.slice(0, 6).map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3 p-2 md:p-3 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{patient.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {patient.phone} | {patient.age} سنة
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا يوجد مرضى مسجلين</p>
              <Button
                variant="link"
                onClick={() => setCurrentSection('assistant')}
                className="mt-2 text-sm"
              >
                إضافة مريض جديد
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
