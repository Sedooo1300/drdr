'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  usePatients, 
  useVisits, 
  useSessionTypes, 
  useAppointments 
} from '@/hooks/useDB';
import { generateId } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Calendar,
  Phone,
  MapPin,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit,
  FileText,
  Users,
  ClipboardList,
  CheckCircle,
  XCircle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Patient, Visit, Session, SessionType, Appointment } from '@/lib/db';

interface PatientFormData {
  name: string;
  age: string;
  address: string;
  phone: string;
  visitType: 'examination' | 'followup' | 'session';
  notes: string;
}

interface SessionFormData {
  typeId: string;
  price: string;
  notes: string;
}

const initialPatientForm: PatientFormData = {
  name: '',
  age: '',
  address: '',
  phone: '',
  visitType: 'examination',
  notes: '',
};

export function AssistantSection() {
  const { searchQuery, addNotification } = useAppStore();
  const { 
    patients, 
    addPatient, 
    updatePatient, 
    deletePatient, 
    search,
    loading: patientsLoading 
  } = usePatients();
  const { visits, addVisit, deleteVisit, loading: visitsLoading } = useVisits();
  const { sessionTypes, addSessionType, loading: sessionTypesLoading } = useSessionTypes();
  const { 
    appointments, 
    addAppointment, 
    deleteAppointment, 
    loading: appointmentsLoading 
  } = useAppointments();

  // Form states
  const [patientForm, setPatientForm] = useState<PatientFormData>(initialPatientForm);
  const [selectedSessions, setSelectedSessions] = useState<SessionFormData[]>([]);
  const [examinationPrice, setExaminationPrice] = useState('');
  const [followupPrice, setFollowupPrice] = useState(''); // New: سعر الإعادة
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('register');
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [newSessionType, setNewSessionType] = useState({ name: '', price: '' });
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    patientName: '',
    date: '',
    time: '',
    type: '',
    notes: '',
  });

  // Filtered patients based on search
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(patients);

  useEffect(() => {
    if (searchQuery) {
      search(searchQuery).then(setFilteredPatients);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients, search]);

  // Handle patient form submission
  const handlePatientSubmit = async () => {
    if (!patientForm.name || !patientForm.phone) {
      addNotification('يرجى ملء الاسم ورقم الهاتف', 'error');
      return;
    }

    try {
      let patient: Patient;
      
      if (editingPatient) {
        patient = await updatePatient({
          ...editingPatient,
          name: patientForm.name,
          age: parseInt(patientForm.age) || 0,
          address: patientForm.address,
          phone: patientForm.phone,
          visitType: patientForm.visitType,
          notes: patientForm.notes,
        });
      } else {
        patient = await addPatient({
          name: patientForm.name,
          age: parseInt(patientForm.age) || 0,
          address: patientForm.address,
          phone: patientForm.phone,
          visitType: patientForm.visitType,
          notes: patientForm.notes,
        });
      }

      // Create visit record
      let totalPrice = 0;
      const sessions: Session[] = [];

      if (patientForm.visitType === 'examination') {
        totalPrice = parseInt(examinationPrice) || 200;
      } else if (patientForm.visitType === 'followup') {
        // New: حساب سعر الإعادة
        totalPrice = parseInt(followupPrice) || 100;
      } else if (patientForm.visitType === 'session' && selectedSessions.length > 0) {
        for (const session of selectedSessions) {
          const sessionType = sessionTypes.find(s => s.id === session.typeId);
          if (sessionType) {
            sessions.push({
              id: generateId(),
              patientId: patient.id,
              type: sessionType.name,
              price: parseInt(session.price) || sessionType.price,
              date: new Date().toISOString(),
              notes: session.notes,
              createdAt: new Date().toISOString(),
            });
            totalPrice += parseInt(session.price) || sessionType.price;
          }
        }
      }

      await addVisit({
        patientId: patient.id,
        type: patientForm.visitType,
        sessions: sessions.length > 0 ? sessions : undefined,
        price: totalPrice,
        date: new Date().toISOString(),
        notes: patientForm.notes,
      });

      addNotification('تم حفظ البيانات بنجاح', 'success');
      setPatientForm(initialPatientForm);
      setSelectedSessions([]);
      setExaminationPrice('');
      setFollowupPrice('');
      setEditingPatient(null);
      setShowPatientDialog(false);
    } catch {
      addNotification('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  // Handle appointment submission
  const handleAppointmentSubmit = async () => {
    if (!appointmentForm.patientName || !appointmentForm.date || !appointmentForm.time) {
      addNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    await addAppointment({
      patientId: appointmentForm.patientId || 'walk-in',
      patientName: appointmentForm.patientName,
      date: appointmentForm.date,
      time: appointmentForm.time,
      type: appointmentForm.type || 'كشف',
      status: 'scheduled',
      notes: appointmentForm.notes,
    });

    addNotification('تم إضافة الموعد بنجاح', 'success');
    setAppointmentForm({
      patientId: '',
      patientName: '',
      date: '',
      time: '',
      type: '',
      notes: '',
    });
    setShowAppointmentDialog(false);
  };

  // Add new session type
  const handleAddSessionType = async () => {
    if (!newSessionType.name || !newSessionType.price) {
      addNotification('يرجى إدخال اسم وسعر الجلسة', 'error');
      return;
    }

    await addSessionType(newSessionType.name, parseInt(newSessionType.price));
    addNotification('تم إضافة نوع الجلسة بنجاح', 'success');
    setNewSessionType({ name: '', price: '' });
    setShowSessionDialog(false);
  };

  // Add session to visit
  const addSessionToVisit = () => {
    setSelectedSessions([
      ...selectedSessions,
      { typeId: '', price: '', notes: '' },
    ]);
  };

  const updateSessionInVisit = (index: number, field: keyof SessionFormData, value: string) => {
    const updated = [...selectedSessions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill price when session type is selected
    if (field === 'typeId') {
      const sessionType = sessionTypes.find(s => s.id === value);
      if (sessionType) {
        updated[index].price = sessionType.price.toString();
      }
    }
    
    setSelectedSessions(updated);
  };

  const removeSessionFromVisit = (index: number) => {
    setSelectedSessions(selectedSessions.filter((_, i) => i !== index));
  };

  // Get patient visits
  const getPatientVisits = (patientId: string) => {
    return visits.filter(v => v.patientId === patientId);
  };

  // WhatsApp reminder
  const sendWhatsAppReminder = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/2${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-4 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">قسم المساعد</h1>
          <p className="text-sm md:text-base text-muted-foreground">تسجيل المرضى والحجوزات</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPatientDialog(true)} className="flex-1 sm:flex-none">
            <UserPlus className="h-4 w-4 ml-2" />
            مريض جديد
          </Button>
          <Button variant="outline" onClick={() => setShowAppointmentDialog(true)} className="flex-1 sm:flex-none">
            <Calendar className="h-4 w-4 ml-2" />
            حجز موعد
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="register" className="text-xs md:text-sm">التسجيل</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs md:text-sm">المواعيد</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs md:text-sm">الحضور</TabsTrigger>
          <TabsTrigger value="records" className="text-xs md:text-sm">السجلات</TabsTrigger>
        </TabsList>

        {/* Registration Tab */}
        <TabsContent value="register" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{patients.length}</p>
                    <p className="text-xs text-muted-foreground">المرضى</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{visits.length}</p>
                    <p className="text-xs text-muted-foreground">الزيارات</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{appointments.filter(a => a.status === 'scheduled').length}</p>
                    <p className="text-xs text-muted-foreground">مواعيد</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{sessionTypes.length}</p>
                    <p className="text-xs text-muted-foreground">الجلسات</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Patients */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-lg">أحدث المرضى</CardTitle>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => useAppStore.getState().setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pr-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 md:h-96">
                {filteredPatients.length > 0 ? (
                  <div className="space-y-2">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer touch-manipulation active:bg-muted"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientForm({
                            name: patient.name,
                            age: patient.age.toString(),
                            address: patient.address,
                            phone: patient.phone,
                            visitType: patient.visitType,
                            notes: patient.notes || '',
                          });
                          setEditingPatient(patient);
                          setShowPatientDialog(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm md:text-base">{patient.name}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {patient.phone} | {patient.age} سنة
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            patient.visitType === 'examination' ? 'default' :
                            patient.visitType === 'followup' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {patient.visitType === 'examination' ? 'كشف' :
                             patient.visitType === 'followup' ? 'إعادة' : 'جلسة'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="touch-manipulation"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendWhatsAppReminder(patient.phone, 'مرحباً بك في عيادة المغازى');
                            }}
                          >
                            <Phone className="h-4 w-4 text-green-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا يوجد مرضى</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">المواعيد المجدولة</CardTitle>
                <Button size="sm" onClick={() => setShowAppointmentDialog(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  موعد جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments.filter(a => a.status === 'scheduled').map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="text-center min-w-[50px]">
                        <p className="text-xl md:text-2xl font-bold text-primary">
                          {format(new Date(apt.date), 'd')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(apt.date), 'MMM', { locale: ar })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm md:text-base">{apt.patientName}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {apt.time} - {apt.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="touch-manipulation"
                        onClick={() => {
                          const patient = patients.find(p => p.id === apt.patientId);
                          if (patient) {
                            sendWhatsAppReminder(patient.phone, 
                              `تذكير: لديك موعد في عيادة المغازى بتاريخ ${apt.date} الساعة ${apt.time}`
                            );
                          }
                        }}
                      >
                        <Phone className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="touch-manipulation"
                        onClick={() => deleteAppointment(apt.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {appointments.filter(a => a.status === 'scheduled').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد مواعيد مجدولة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">سجل الحضور اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visits.filter(v => {
                  const today = new Date().toISOString().split('T')[0];
                  return v.date.startsWith(today);
                }).map((visit) => {
                  const patient = patients.find(p => p.id === visit.patientId);
                  return (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-3 md:p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm md:text-base">{patient?.name || 'مريض غير معروف'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {visit.type === 'examination' ? 'كشف' : 
                             visit.type === 'followup' ? 'إعادة' : 'جلسة'}
                            {visit.price && ` - ${visit.price} ج.م`}
                          </p>
                        </div>
                      </div>
                      <Badge className="text-xs">{format(new Date(visit.date), 'HH:mm')}</Badge>
                    </div>
                  );
                })}
                {visits.filter(v => v.date.startsWith(new Date().toISOString().split('T')[0])).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا يوجد حضور اليوم</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">سجل الزيارات</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 md:h-96">
                <div className="space-y-3">
                  {visits.map((visit) => {
                    const patient = patients.find(p => p.id === visit.patientId);
                    return (
                      <div
                        key={visit.id}
                        className="p-3 md:p-4 rounded-lg border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm md:text-base">{patient?.name}</span>
                          <Badge className="text-xs">
                            {format(new Date(visit.date), 'd MMM yyyy', { locale: ar })}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <span>
                            {visit.type === 'examination' ? 'كشف' : 
                             visit.type === 'followup' ? 'إعادة' : 'جلسة'}
                          </span>
                          {visit.price > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-primary font-medium">
                                {visit.price} ج.م
                              </span>
                            </>
                          )}
                        </div>
                        {visit.sessions && visit.sessions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {visit.sessions.map((s, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {s.type} - {s.price} ج.م
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingPatient ? 'تعديل بيانات المريض' : 'تسجيل مريض جديد'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              أدخل بيانات المريض والزيارة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Info */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">الاسم *</Label>
                <Input
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  placeholder="اسم المريض"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">الهاتف *</Label>
                <Input
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">السن</Label>
                <Input
                  type="number"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                  placeholder="السن"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">العنوان</Label>
                <Input
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                  placeholder="العنوان"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">نوع الزيارة</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'examination', label: 'كشف', color: 'bg-primary' },
                  { value: 'followup', label: 'إعادة', color: 'bg-green-500' },
                  { value: 'session', label: 'جلسات', color: 'bg-purple-500' },
                ].map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={patientForm.visitType === type.value ? 'default' : 'outline'}
                    className={`touch-manipulation text-xs md:text-sm ${patientForm.visitType === type.value ? type.color + ' text-white' : ''}`}
                    onClick={() => setPatientForm({ ...patientForm, visitType: type.value as 'examination' | 'followup' | 'session' })}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Examination Price */}
            {patientForm.visitType === 'examination' && (
              <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Label className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  سعر الكشف (ج.م)
                </Label>
                <Input
                  type="number"
                  value={examinationPrice}
                  onChange={(e) => setExaminationPrice(e.target.value)}
                  placeholder="200"
                  className="text-sm"
                />
              </div>
            )}

            {/* Follow-up Price - NEW */}
            {patientForm.visitType === 'followup' && (
              <div className="space-y-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <Label className="text-sm flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-green-500" />
                  سعر الإعادة (ج.م)
                </Label>
                <Input
                  type="number"
                  value={followupPrice}
                  onChange={(e) => setFollowupPrice(e.target.value)}
                  placeholder="100"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  السعر الافتراضي: 100 ج.م
                </p>
              </div>
            )}

            {/* Sessions Selection */}
            {patientForm.visitType === 'session' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">الجلسات</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="touch-manipulation"
                    onClick={addSessionToVisit}
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة جلسة
                  </Button>
                </div>

                {selectedSessions.map((session, index) => (
                  <div key={index} className="p-3 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">جلسة {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="touch-manipulation h-8 w-8"
                        onClick={() => removeSessionFromVisit(index)}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        value={session.typeId}
                        onValueChange={(v) => updateSessionInVisit(index, 'typeId', v)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="نوع الجلسة" />
                        </SelectTrigger>
                        <SelectContent>
                          {sessionTypes.map((st) => (
                            <SelectItem key={st.id} value={st.id} className="text-sm">
                              {st.name} - {st.price} ج.م
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={session.price}
                        onChange={(e) => updateSessionInVisit(index, 'price', e.target.value)}
                        placeholder="السعر"
                        className="text-sm"
                      />
                    </div>
                    <Input
                      value={session.notes}
                      onChange={(e) => updateSessionInVisit(index, 'notes', e.target.value)}
                      placeholder="ملاحظات"
                      className="text-sm"
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full touch-manipulation"
                  onClick={() => setShowSessionDialog(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة نوع جلسة جديد
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm">ملاحظات</Label>
              <Textarea
                value={patientForm.notes}
                onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPatientDialog(false);
              setEditingPatient(null);
              setPatientForm(initialPatientForm);
              setFollowupPrice('');
            }}>
              إلغاء
            </Button>
            <Button onClick={handlePatientSubmit}>
              {editingPatient ? 'تحديث' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">حجز موعد جديد</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">المريض</Label>
              <Select
                value={appointmentForm.patientId}
                onValueChange={(v) => {
                  const patient = patients.find(p => p.id === v);
                  setAppointmentForm({
                    ...appointmentForm,
                    patientId: v,
                    patientName: patient?.name || '',
                  });
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="اختر المريض" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">
                      {p.name} - {p.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">التاريخ</Label>
                <Input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">الوقت</Label>
                <Input
                  type="time"
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">نوع الموعد</Label>
              <Select
                value={appointmentForm.type}
                onValueChange={(v) => setAppointmentForm({ ...appointmentForm, type: v })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="كشف">كشف</SelectItem>
                  <SelectItem value="إعادة">إعادة</SelectItem>
                  <SelectItem value="جلسة">جلسة</SelectItem>
                  <SelectItem value="ليزر">ليزر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">ملاحظات</Label>
              <Textarea
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                placeholder="ملاحظات..."
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAppointmentSubmit}>حجز</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Session Type Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">إضافة نوع جلسة جديد</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">اسم الجلسة</Label>
              <Input
                value={newSessionType.name}
                onChange={(e) => setNewSessionType({ ...newSessionType, name: e.target.value })}
                placeholder="اسم الجلسة"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">السعر (ج.م)</Label>
              <Input
                type="number"
                value={newSessionType.price}
                onChange={(e) => setNewSessionType({ ...newSessionType, price: e.target.value })}
                placeholder="السعر"
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddSessionType}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
