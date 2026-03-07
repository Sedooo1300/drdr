'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { usePatients, useVisits, useDoctors } from '@/hooks/useDB';
import { getAllItems, getItemsByIndex } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  Calendar,
  Stethoscope,
  Zap,
  Phone,
  MapPin,
  Clock,
  FileText,
  Filter,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Patient, Visit, Doctor, LaserTreatment, Appointment } from '@/lib/db';

interface SearchResult {
  type: 'patient' | 'visit' | 'doctor' | 'laser' | 'appointment';
  data: Patient | Visit | Doctor | LaserTreatment | Appointment;
  relevance: number;
}

export function SearchSection() {
  const { addNotification, setCurrentSection } = useAppStore();
  const { patients } = usePatients();
  const { visits } = useVisits();
  const { doctors } = useDoctors();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [laserTreatments, setLaserTreatments] = useState<LaserTreatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Load additional data
  useEffect(() => {
    const loadData = async () => {
      const laser = await getAllItems<LaserTreatment>('laserTreatments');
      const appts = await getAllItems<Appointment>('appointments');
      setLaserTreatments(laser);
      setAppointments(appts);
    };
    loadData();
  }, []);

  // Search function
  const performSearch = async () => {
    if (!searchQuery.trim() && !dateFilter) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const query = searchQuery.toLowerCase().trim();

    // Search patients
    if (searchType === 'all' || searchType === 'patients') {
      patients.forEach(patient => {
        let relevance = 0;
        if (patient.name.toLowerCase().includes(query)) relevance += 10;
        if (patient.phone.includes(query)) relevance += 8;
        if (patient.address.toLowerCase().includes(query)) relevance += 5;
        if (patient.age.toString().includes(query)) relevance += 3;

        if (relevance > 0) {
          searchResults.push({ type: 'patient', data: patient, relevance });
        }
      });
    }

    // Search visits
    if (searchType === 'all' || searchType === 'visits') {
      visits.forEach(visit => {
        let relevance = 0;
        const patient = patients.find(p => p.id === visit.patientId);
        
        if (dateFilter && visit.date.startsWith(dateFilter)) relevance += 5;
        if (patient?.name.toLowerCase().includes(query)) relevance += 8;
        if (visit.type.includes(query)) relevance += 5;
        if (visit.notes?.toLowerCase().includes(query)) relevance += 3;

        if (relevance > 0) {
          searchResults.push({ type: 'visit', data: visit, relevance });
        }
      });
    }

    // Search doctors
    if (searchType === 'all' || searchType === 'doctors') {
      doctors.forEach(doctor => {
        let relevance = 0;
        if (doctor.name.toLowerCase().includes(query)) relevance += 10;
        if (doctor.specialization?.toLowerCase().includes(query)) relevance += 7;
        if (doctor.phone.includes(query)) relevance += 8;

        if (relevance > 0) {
          searchResults.push({ type: 'doctor', data: doctor, relevance });
        }
      });
    }

    // Search laser treatments
    if (searchType === 'all' || searchType === 'laser') {
      laserTreatments.forEach(treatment => {
        let relevance = 0;
        const patient = patients.find(p => p.id === treatment.patientId);
        
        if (treatment.area.toLowerCase().includes(query)) relevance += 8;
        if (treatment.deviceType?.toLowerCase().includes(query)) relevance += 5;
        if (patient?.name.toLowerCase().includes(query)) relevance += 7;
        if (dateFilter && treatment.date.startsWith(dateFilter)) relevance += 5;

        if (relevance > 0) {
          searchResults.push({ type: 'laser', data: treatment, relevance });
        }
      });
    }

    // Search appointments
    if (searchType === 'all' || searchType === 'appointments') {
      appointments.forEach(appointment => {
        let relevance = 0;
        
        if (appointment.patientName.toLowerCase().includes(query)) relevance += 10;
        if (appointment.type.toLowerCase().includes(query)) relevance += 5;
        if (dateFilter && appointment.date.startsWith(dateFilter)) relevance += 8;
        if (appointment.notes?.toLowerCase().includes(query)) relevance += 3;

        if (relevance > 0) {
          searchResults.push({ type: 'appointment', data: appointment, relevance });
        }
      });
    }

    // Sort by relevance
    searchResults.sort((a, b) => b.relevance - a.relevance);
    setResults(searchResults);
    setIsSearching(false);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType, dateFilter]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setDateFilter('');
    setResults([]);
  };

  // Get patient name by ID
  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || 'غير معروف';
  };

  // Render result item
  const renderResultItem = (result: SearchResult) => {
    switch (result.type) {
      case 'patient':
        const patient = result.data as Patient;
        return (
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
               onClick={() => setCurrentSection('assistant')}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium">{patient.name}</h4>
                  <p className="text-sm text-muted-foreground">{patient.phone}</p>
                </div>
              </div>
              <Badge>مريض</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {patient.age} سنة
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {patient.address}
              </span>
            </div>
          </div>
        );

      case 'visit':
        const visit = result.data as Visit;
        return (
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{getPatientName(visit.patientId)}</h4>
                <p className="text-sm text-muted-foreground">
                  {visit.type === 'examination' ? 'كشف' : 
                   visit.type === 'followup' ? 'إعادة' : 'جلسة'}
                </p>
              </div>
              <div className="text-left">
                <Badge variant="secondary">
                  {format(new Date(visit.date), 'd MMM yyyy', { locale: ar })}
                </Badge>
                {visit.price > 0 && (
                  <p className="text-sm font-medium text-primary mt-1">
                    {visit.price} ج.م
                  </p>
                )}
              </div>
            </div>
            {visit.sessions && visit.sessions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {visit.sessions.map((s, i) => (
                  <Badge key={i} variant="outline">{s.type}</Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'doctor':
        const doctor = result.data as Doctor;
        return (
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
               onClick={() => setCurrentSection('doctors')}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{doctor.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {doctor.specialization || 'طبيب عام'}
                  </p>
                </div>
              </div>
              <Badge className="bg-purple-500">طبيب</Badge>
            </div>
            <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {doctor.phone}
              </span>
              <span className="text-amber-500 font-medium">
                {doctor.percentage}%
              </span>
            </div>
          </div>
        );

      case 'laser':
        const laser = result.data as LaserTreatment;
        return (
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
               onClick={() => setCurrentSection('laser')}>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{getPatientName(laser.patientId)}</h4>
                <p className="text-sm text-muted-foreground">{laser.area}</p>
              </div>
              <Badge className="bg-amber-500">
                <Zap className="h-3 w-3 ml-1" />
                ليزر
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">الجلسات:</span>
                <span className="font-medium mr-1">{laser.currentSession}/{laser.sessions}</span>
              </div>
              <div>
                <span className="text-muted-foreground">الطاقة:</span>
                <span className="font-medium mr-1">{laser.energy}J</span>
              </div>
              <div>
                <span className="text-muted-foreground">السعر:</span>
                <span className="font-medium mr-1 text-primary">{laser.price} ج.م</span>
              </div>
            </div>
          </div>
        );

      case 'appointment':
        const appointment = result.data as Appointment;
        return (
          <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
               onClick={() => setCurrentSection('assistant')}>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{appointment.patientName}</h4>
                <p className="text-sm text-muted-foreground">{appointment.type}</p>
              </div>
              <div className="text-left">
                <Badge variant={appointment.status === 'scheduled' ? 'default' : 'secondary'}>
                  {appointment.status === 'scheduled' ? 'مجدول' : 
                   appointment.status === 'completed' ? 'مكتمل' : 'ملغي'}
                </Badge>
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(appointment.date), 'd MMM yyyy', { locale: ar })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {appointment.time}
              </span>
            </div>
          </div>
        );
    }
  };

  // Group results by type
  const groupedResults = {
    patients: results.filter(r => r.type === 'patient'),
    visits: results.filter(r => r.type === 'visit'),
    doctors: results.filter(r => r.type === 'doctor'),
    laser: results.filter(r => r.type === 'laser'),
    appointments: results.filter(r => r.type === 'appointment'),
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">البحث الشامل</h1>
        <p className="text-muted-foreground">ابحث في جميع بيانات النظام</p>
      </div>

      {/* Search Box */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم، الهاتف، العنوان، نوع العلاج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-12 text-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 -translate-y-1/2"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="patients">المرضى</SelectItem>
                  <SelectItem value="visits">الزيارات</SelectItem>
                  <SelectItem value="doctors">الأطباء</SelectItem>
                  <SelectItem value="laser">الليزر</SelectItem>
                  <SelectItem value="appointments">المواعيد</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-44"
                placeholder="فلتر التاريخ"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري البحث...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Users className="h-3 w-3 ml-1" />
              {groupedResults.patients.length} مرضى
            </Badge>
            <Badge variant="secondary">
              <Calendar className="h-3 w-3 ml-1" />
              {groupedResults.visits.length} زيارات
            </Badge>
            <Badge variant="secondary">
              <Stethoscope className="h-3 w-3 ml-1" />
              {groupedResults.doctors.length} أطباء
            </Badge>
            <Badge variant="secondary">
              <Zap className="h-3 w-3 ml-1" />
              {groupedResults.laser.length} ليزر
            </Badge>
            <Badge variant="secondary">
              <FileText className="h-3 w-3 ml-1" />
              {groupedResults.appointments.length} مواعيد
            </Badge>
          </div>

          {/* Results List */}
          <ScrollArea className="h-[60vh]">
            <div className="space-y-3 pr-4">
              {results.map((result, index) => (
                <div key={`${result.type}-${(result.data as { id: string }).id}-${index}`}>
                  {renderResultItem(result)}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : searchQuery || dateFilter ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">لا توجد نتائج</p>
          <p className="text-sm mt-2">جرب كلمات بحث مختلفة</p>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">ابدأ البحث</p>
          <p className="text-sm mt-2">أدخل كلمة البحث للعثور على النتائج</p>
        </div>
      )}
    </div>
  );
}
