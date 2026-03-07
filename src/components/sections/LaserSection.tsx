'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { usePatients } from '@/hooks/useDB';
import { generateId, addItem, getAllItems, updateItem, deleteItem, getItemsByIndex } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  Zap,
  UserPlus,
  Search,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Users,
  Camera,
  Activity,
  Target,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Eye,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Patient, LaserTreatment, Photo } from '@/lib/db';

const LASER_DEVICES = [
  'Soprano Ice Platinum',
  'Soprano Titanium',
  'Lightsheer Desire',
  'GentleLase Pro',
  'Candela GentleMax',
  'Lumenis LightSheer',
  'Fotona Dynamis',
  'Alma Harmony',
  'Sciton BBL',
  'Other',
];

const BODY_AREAS = [
  'الوجه كامل',
  'الذقن',
  'الشارب',
  'السوالف',
  'الرقبة',
  'الإبط',
  'الذراعين كامل',
  'الساعدين',
  'الصدر',
  'الظهر كامل',
  'الظهر العلوي',
  'الظهر السفلي',
  'البطن',
  'البيكيني كامل',
  'البيكيني خطوط',
  'الفخذين كامل',
  'أسفل الركبة',
  'الساقين كامل',
  'القدمين',
  'كامل الجسم',
];

export function LaserSection() {
  const { searchQuery, addNotification } = useAppStore();
  const { patients } = usePatients();

  // State
  const [activeTab, setActiveTab] = useState('treatments');
  const [laserTreatments, setLaserTreatments] = useState<LaserTreatment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(patients);
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<LaserTreatment | null>(null);
  const [viewingTreatment, setViewingTreatment] = useState<LaserTreatment | null>(null);
  const [photos, setPhotos] = useState<{ before: string[]; after: string[] }>({ before: [], after: [] });

  // Form state
  const [treatmentForm, setTreatmentForm] = useState({
    area: '',
    deviceType: '',
    energy: '',
    pulses: '',
    sessions: '',
    currentSession: '',
    price: '',
    nextDate: '',
    notes: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPhotoType, setCurrentPhotoType] = useState<'before' | 'after'>('before');
  const [tempPhotos, setTempPhotos] = useState<{ before: string[]; after: string[] }>({ before: [], after: [] });

  // Load treatments function
  const loadTreatments = async () => {
    const data = await getAllItems<LaserTreatment>('laserTreatments');
    setLaserTreatments(data.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  };

  // Load treatments on mount
  useEffect(() => {
    loadTreatments();
  }, []);

  // Filter patients
  useEffect(() => {
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      setFilteredPatients(patients.filter(p => 
        p.name.toLowerCase().includes(lower) ||
        p.phone.includes(searchQuery)
      ));
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  // Load patient treatments
  const loadPatientTreatments = async (patientId: string) => {
    const data = await getItemsByIndex<LaserTreatment>('laserTreatments', 'patientId', patientId);
    return data.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Load patient photos
  const loadPatientPhotos = async (patientId: string) => {
    const photosData = await getItemsByIndex<Photo>('photos', 'patientId', patientId);
    const before = photosData.filter(p => p.type === 'before').map(p => p.url);
    const after = photosData.filter(p => p.type === 'after').map(p => p.url);
    setPhotos({ before, after });
  };

  // Handle form submit
  const handleTreatmentSubmit = async () => {
    if (!selectedPatient || !treatmentForm.area) {
      addNotification('يرجى ملء البيانات المطلوبة', 'error');
      return;
    }

    const treatment: LaserTreatment = {
      id: editingTreatment?.id || generateId(),
      patientId: selectedPatient.id,
      area: treatmentForm.area,
      deviceType: treatmentForm.deviceType,
      energy: parseFloat(treatmentForm.energy) || 0,
      pulses: parseInt(treatmentForm.pulses) || 0,
      sessions: parseInt(treatmentForm.sessions) || 1,
      currentSession: editingTreatment ? treatmentForm.currentSession : '1',
      price: parseFloat(treatmentForm.price) || 0,
      date: editingTreatment?.date || new Date().toISOString(),
      nextDate: treatmentForm.nextDate || undefined,
      notes: treatmentForm.notes,
      photos: tempPhotos,
      createdAt: editingTreatment?.createdAt || new Date().toISOString(),
    };

    if (editingTreatment) {
      await updateItem('laserTreatments', treatment);
      addNotification('تم تحديث العلاج بنجاح', 'success');
    } else {
      await addItem('laserTreatments', treatment);
      addNotification('تم إضافة العلاج بنجاح', 'success');
    }

    // Save photos
    for (const url of tempPhotos.before) {
      const photo: Photo = {
        id: generateId(),
        patientId: selectedPatient.id,
        type: 'before',
        url,
        date: new Date().toISOString(),
      };
      await addItem('photos', photo);
    }
    for (const url of tempPhotos.after) {
      const photo: Photo = {
        id: generateId(),
        patientId: selectedPatient.id,
        type: 'after',
        url,
        date: new Date().toISOString(),
      };
      await addItem('photos', photo);
    }

    await loadTreatments();
    resetForm();
    setShowTreatmentDialog(false);
  };

  // Reset form
  const resetForm = () => {
    setTreatmentForm({
      area: '',
      deviceType: '',
      energy: '',
      pulses: '',
      sessions: '',
      currentSession: '',
      price: '',
      nextDate: '',
      notes: '',
    });
    setTempPhotos({ before: [], after: [] });
    setEditingTreatment(null);
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Compress image
        const compressed = await compressImage(base64, 800, 0.8);
        
        setTempPhotos(prev => ({
          ...prev,
          [currentPhotoType]: [...prev[currentPhotoType], compressed],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Compress image
  const compressImage = (base64: string, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  // Delete treatment
  const handleDeleteTreatment = async (id: string) => {
    await deleteItem('laserTreatments', id);
    await loadTreatments();
    addNotification('تم حذف العلاج', 'success');
  };

  // Get treatments for selected patient
  const getPatientTreatments = () => {
    if (!selectedPatient) return [];
    return laserTreatments.filter(t => t.patientId === selectedPatient.id);
  };

  // Get upcoming sessions
  const getUpcomingSessions = () => {
    const today = new Date().toISOString().split('T')[0];
    return laserTreatments.filter(t => 
      t.nextDate && t.nextDate >= today && parseInt(t.currentSession) < t.sessions
    );
  };

  // Calculate progress
  const calculateProgress = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">قسم الليزر</h1>
          <p className="text-muted-foreground">إدارة علاجات إزالة الشعر بالليزر</p>
        </div>
        <Button onClick={() => {
          if (!selectedPatient) {
            addNotification('يرجى اختيار مريض أولاً', 'error');
            return;
          }
          resetForm();
          setShowTreatmentDialog(true);
        }}>
          <Plus className="h-4 w-4 ml-2" />
          علاج جديد
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{laserTreatments.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي العلاجات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {laserTreatments.filter(t => parseInt(t.currentSession) >= t.sessions).length}
                </p>
                <p className="text-sm text-muted-foreground">مكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{getUpcomingSessions().length}</p>
                <p className="text-sm text-muted-foreground">جلسات قادمة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {laserTreatments.reduce((sum, t) => sum + t.price, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">ج.م إجمالي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن مريض..."
                value={searchQuery}
                onChange={(e) => useAppStore.getState().setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredPatients.map((patient) => {
                  const patientTreatments = laserTreatments.filter(t => t.patientId === patient.id);
                  return (
                    <div
                      key={patient.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPatient?.id === patient.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedPatient(patient);
                        loadPatientPhotos(patient.id);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">{patient.phone}</p>
                        </div>
                        {patientTreatments.length > 0 && (
                          <Badge variant="secondary">{patientTreatments.length}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredPatients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا يوجد مرضى</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Treatment Details */}
        <Card className="md:col-span-2">
          {selectedPatient ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {selectedPatient.name}
                  </span>
                  <Button onClick={() => {
                    resetForm();
                    setShowTreatmentDialog(true);
                  }}>
                    <Plus className="h-4 w-4 ml-2" />
                    علاج جديد
                  </Button>
                </CardTitle>
                <CardDescription>
                  {selectedPatient.phone} | {selectedPatient.age} سنة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {getPatientTreatments().map((treatment) => (
                      <div
                        key={treatment.id}
                        className="p-4 rounded-lg border hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{treatment.area}</h4>
                            <p className="text-sm text-muted-foreground">
                              {treatment.deviceType || 'غير محدد'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              parseInt(treatment.currentSession) >= treatment.sessions
                                ? 'default'
                                : 'secondary'
                            }>
                              {treatment.currentSession}/{treatment.sessions}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingTreatment(treatment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingTreatment(treatment);
                                setTreatmentForm({
                                  area: treatment.area,
                                  deviceType: treatment.deviceType,
                                  energy: treatment.energy.toString(),
                                  pulses: treatment.pulses.toString(),
                                  sessions: treatment.sessions.toString(),
                                  currentSession: treatment.currentSession,
                                  price: treatment.price.toString(),
                                  nextDate: treatment.nextDate || '',
                                  notes: treatment.notes || '',
                                });
                                setTempPhotos(treatment.photos || { before: [], after: [] });
                                setShowTreatmentDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTreatment(treatment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">الطاقة:</span>
                            <span className="font-medium mr-1">{treatment.energy} J</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">النبضات:</span>
                            <span className="font-medium mr-1">{treatment.pulses}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">السعر:</span>
                            <span className="font-medium mr-1 text-primary">{treatment.price} ج.م</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Progress
                            value={calculateProgress(parseInt(treatment.currentSession), treatment.sessions)}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">
                            {calculateProgress(parseInt(treatment.currentSession), treatment.sessions)}%
                          </span>
                        </div>

                        {treatment.nextDate && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              الجلسة القادمة: {format(new Date(treatment.nextDate), 'd MMM yyyy', { locale: ar })}
                            </span>
                          </div>
                        )}

                        {treatment.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {treatment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                    {getPatientTreatments().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>لا توجد علاجات لهذا المريض</p>
                        <Button className="mt-4" onClick={() => {
                          resetForm();
                          setShowTreatmentDialog(true);
                        }}>
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة علاج
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Zap className="h-16 w-16 mb-4 opacity-50" />
              <p>اختر مريض من القائمة</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Treatment Dialog */}
      <Dialog open={showTreatmentDialog} onOpenChange={setShowTreatmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? 'تعديل العلاج' : 'علاج ليزر جديد'}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المنطقة *</Label>
                <Select
                  value={treatmentForm.area}
                  onValueChange={(v) => setTreatmentForm({ ...treatmentForm, area: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنطقة" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>جهاز الليزر</Label>
                <Select
                  value={treatmentForm.deviceType}
                  onValueChange={(v) => setTreatmentForm({ ...treatmentForm, deviceType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجهاز" />
                  </SelectTrigger>
                  <SelectContent>
                    {LASER_DEVICES.map((device) => (
                      <SelectItem key={device} value={device}>
                        {device}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الطاقة (J)</Label>
                <Input
                  type="number"
                  value={treatmentForm.energy}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, energy: e.target.value })}
                  placeholder="مثال: 20"
                />
              </div>
              <div className="space-y-2">
                <Label>عدد النبضات</Label>
                <Input
                  type="number"
                  value={treatmentForm.pulses}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, pulses: e.target.value })}
                  placeholder="مثال: 500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>عدد الجلسات</Label>
                <Input
                  type="number"
                  value={treatmentForm.sessions}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, sessions: e.target.value })}
                  placeholder="مثال: 6"
                />
              </div>
              {editingTreatment && (
                <div className="space-y-2">
                  <Label>الجلسة الحالية</Label>
                  <Input
                    type="number"
                    value={treatmentForm.currentSession}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, currentSession: e.target.value })}
                    placeholder="مثال: 1"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>السعر (ج.م)</Label>
                <Input
                  type="number"
                  value={treatmentForm.price}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, price: e.target.value })}
                  placeholder="مثال: 1500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>تاريخ الجلسة القادمة</Label>
              <Input
                type="date"
                value={treatmentForm.nextDate}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, nextDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={treatmentForm.notes}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                placeholder="ملاحظات العلاج..."
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <Label>الصور</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={currentPhotoType === 'before' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPhotoType('before')}
                >
                  قبل
                </Button>
                <Button
                  type="button"
                  variant={currentPhotoType === 'after' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPhotoType('after')}
                >
                  بعد
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {tempPhotos[currentPhotoType].map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-1 left-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setTempPhotos(prev => ({
                          ...prev,
                          [currentPhotoType]: prev[currentPhotoType].filter((_, idx) => idx !== i),
                        }));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTreatmentDialog(false);
              resetForm();
            }}>
              إلغاء
            </Button>
            <Button onClick={handleTreatmentSubmit}>
              {editingTreatment ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Treatment Dialog */}
      <Dialog open={!!viewingTreatment} onOpenChange={() => setViewingTreatment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل العلاج</DialogTitle>
          </DialogHeader>
          {viewingTreatment && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">{viewingTreatment.area}</h4>
                <p className="text-sm text-muted-foreground">{viewingTreatment.deviceType}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">الطاقة:</span>
                  <span className="font-medium mr-1">{viewingTreatment.energy} J</span>
                </div>
                <div>
                  <span className="text-muted-foreground">النبضات:</span>
                  <span className="font-medium mr-1">{viewingTreatment.pulses}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">الجلسات:</span>
                  <span className="font-medium mr-1">{viewingTreatment.currentSession}/{viewingTreatment.sessions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">السعر:</span>
                  <span className="font-medium mr-1 text-primary">{viewingTreatment.price} ج.م</span>
                </div>
              </div>

              {viewingTreatment.nextDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>الجلسة القادمة: {format(new Date(viewingTreatment.nextDate), 'd MMM yyyy', { locale: ar })}</span>
                </div>
              )}

              {viewingTreatment.notes && (
                <div>
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <p className="text-sm mt-1">{viewingTreatment.notes}</p>
                </div>
              )}

              {viewingTreatment.photos && (viewingTreatment.photos.before.length > 0 || viewingTreatment.photos.after.length > 0) && (
                <div>
                  <Label className="mb-2 block">الصور</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingTreatment.photos.before.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">قبل</p>
                        <div className="grid grid-cols-2 gap-1">
                          {viewingTreatment.photos.before.map((url, i) => (
                            <img key={i} src={url} alt="" className="w-full h-16 object-cover rounded" />
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingTreatment.photos.after.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">بعد</p>
                        <div className="grid grid-cols-2 gap-1">
                          {viewingTreatment.photos.after.map((url, i) => (
                            <img key={i} src={url} alt="" className="w-full h-16 object-cover rounded" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
