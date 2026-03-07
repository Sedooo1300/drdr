'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { usePatients, useDoctors } from '@/hooks/useDB';
import { generateId, addItem, getAllItems, updateItem, deleteItem, getItemsByIndex } from '@/lib/db';
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
  Stethoscope,
  UserPlus,
  Search,
  Plus,
  Trash2,
  Edit,
  Image as ImageIcon,
  FileText,
  Users,
  Camera,
  Percent,
  Pill,
  ClipboardList,
  Eye,
  Download,
  Upload,
  X,
  ZoomIn,
  Smartphone,
  ImagePlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Patient, Doctor, Photo, Prescription } from '@/lib/db';

interface PhotoGallery {
  before: string[];
  after: string[];
}

export function DoctorsSection() {
  const { isAuthenticated, searchQuery, addNotification, openModal, activeModal, closeModal } = useAppStore();
  const { patients, loading: patientsLoading, updatePatient } = usePatients();
  const { doctors, addDoctor, updateDoctor, deleteDoctor, loading: doctorsLoading } = useDoctors();

  // State
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(patients);
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [photos, setPhotos] = useState<PhotoGallery>({ before: [], after: [] });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  
  // Doctor form
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialization: '',
    phone: '',
    percentage: '',
  });

  // Prescription form
  const [prescriptionForm, setPrescriptionForm] = useState({
    medications: [{ name: '', dosage: '', frequency: '' }],
    notes: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [currentPhotoType, setCurrentPhotoType] = useState<'before' | 'after'>('before');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Examination notes state
  const [showExaminationDialog, setShowExaminationDialog] = useState(false);
  const [examinationForm, setExaminationForm] = useState({
    examinationNotes: '',
    diagnosis: '',
    treatment: '',
  });

  // Filter patients
  useEffect(() => {
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      setFilteredPatients(patients.filter(p => 
        p.name.toLowerCase().includes(lower) ||
        p.phone.includes(searchQuery) ||
        p.address.toLowerCase().includes(lower)
      ));
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  // Load patient photos
  const loadPatientPhotos = async (patientId: string) => {
    const photosData = await getItemsByIndex<Photo>('photos', 'patientId', patientId);
    const before = photosData.filter(p => p.type === 'before').map(p => p.url);
    const after = photosData.filter(p => p.type === 'after').map(p => p.url);
    setPhotos({ before, after });
  };

  // Load patient prescriptions
  const loadPatientPrescriptions = async (patientId: string) => {
    const scripts = await getItemsByIndex<Prescription>('prescriptions', 'patientId', patientId);
    setPrescriptions(scripts);
  };

  // Handle doctor submit
  const handleDoctorSubmit = async () => {
    if (!doctorForm.name) {
      addNotification('يرجى إدخال اسم الطبيب', 'error');
      return;
    }

    if (editingDoctor) {
      await updateDoctor({
        ...editingDoctor,
        name: doctorForm.name,
        specialization: doctorForm.specialization,
        phone: doctorForm.phone,
        percentage: parseFloat(doctorForm.percentage) || 0,
      });
      addNotification('تم تحديث بيانات الطبيب', 'success');
    } else {
      await addDoctor({
        name: doctorForm.name,
        specialization: doctorForm.specialization,
        phone: doctorForm.phone,
        percentage: parseFloat(doctorForm.percentage) || 0,
      });
      addNotification('تم إضافة الطبيب بنجاح', 'success');
    }

    setDoctorForm({ name: '', specialization: '', phone: '', percentage: '' });
    setEditingDoctor(null);
    setShowDoctorDialog(false);
  };

  // Compress image - improved for mobile
  const compressImage = useCallback((base64: string, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Limit size for mobile performance
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          // Ensure minimum dimensions
          width = Math.max(1, Math.round(width));
          height = Math.max(1, Math.round(height));

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = base64;
    });
  }, []);

  // Handle photo upload - works on both mobile and desktop
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedPatient || files.length === 0) return;

    setIsUploading(true);
    addNotification('جاري رفع الصور...', 'info');

    try {
      for (const file of Array.from(files)) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          addNotification(`الصورة ${file.name} كبيرة جداً (الحد الأقصى 10MB)`, 'error');
          continue;
        }

        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              const base64 = event.target?.result as string;
              if (!base64) {
                resolve();
                return;
              }
              
              // Compress image for better performance
              const compressed = await compressImage(base64, 800, 0.8);
              
              const photo: Photo = {
                id: generateId(),
                patientId: selectedPatient.id,
                type: currentPhotoType,
                url: compressed,
                date: new Date().toISOString(),
              };

              await addItem('photos', photo);
              resolve();
            } catch (err) {
              console.error('Error processing image:', err);
              reject(err);
            }
          };
          
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }

      await loadPatientPhotos(selectedPatient.id);
      addNotification(`تم رفع ${files.length} صورة بنجاح`, 'success');
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      
    } catch (err) {
      console.error('Upload error:', err);
      addNotification('حدث خطأ أثناء رفع الصور', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [selectedPatient, currentPhotoType, compressImage, addNotification]);

  // Handle prescription submit
  const handlePrescriptionSubmit = async () => {
    if (!selectedPatient) return;

    const prescription: Prescription = {
      id: generateId(),
      patientId: selectedPatient.id,
      doctorId: 'current-doctor',
      medications: prescriptionForm.medications.filter(m => m.name),
      notes: prescriptionForm.notes,
      date: new Date().toISOString(),
    };

    await addItem('prescriptions', prescription);
    await loadPatientPrescriptions(selectedPatient.id);
    
    addNotification('تم حفظ الروشتة بنجاح', 'success');
    setPrescriptionForm({ medications: [{ name: '', dosage: '', frequency: '' }], notes: '' });
    setShowPrescriptionDialog(false);
  };

  // Add medication to prescription
  const addMedication = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medications: [...prescriptionForm.medications, { name: '', dosage: '', frequency: '' }],
    });
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...prescriptionForm.medications];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptionForm({ ...prescriptionForm, medications: updated });
  };

  const removeMedication = (index: number) => {
    setPrescriptionForm({
      ...prescriptionForm,
      medications: prescriptionForm.medications.filter((_, i) => i !== index),
    });
  };

  // Select patient and load data
  const selectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    await loadPatientPhotos(patient.id);
    await loadPatientPrescriptions(patient.id);
    
    // Load examination notes
    setExaminationForm({
      examinationNotes: patient.examinationNotes || '',
      diagnosis: patient.diagnosis || '',
      treatment: patient.treatment || '',
    });
  };

  // Save examination notes
  const saveExaminationNotes = async () => {
    if (!selectedPatient) return;
    
    try {
      const updatedPatient: Patient = {
        ...selectedPatient,
        examinationNotes: examinationForm.examinationNotes,
        diagnosis: examinationForm.diagnosis,
        treatment: examinationForm.treatment,
        lastExaminationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await updateItem('patients', updatedPatient);
      
      // Update local state
      setSelectedPatient(updatedPatient);
      
      // Notify sync
      window.dispatchEvent(new CustomEvent('data-changed'));
      
      setShowExaminationDialog(false);
      addNotification('تم حفظ ملاحظات الفحص', 'success');
    } catch (error) {
      console.error('Error saving examination notes:', error);
      addNotification('فشل حفظ الملاحظات', 'error');
    }
  };

  // Delete photo
  const deletePhoto = async (photoUrl: string, type: 'before' | 'after') => {
    if (!selectedPatient) return;

    const photosData = await getItemsByIndex<Photo>('photos', 'patientId', selectedPatient.id);
    const photo = photosData.find(p => p.url === photoUrl && p.type === type);
    
    if (photo) {
      await deleteItem('photos', photo.id);
      await loadPatientPhotos(selectedPatient.id);
      addNotification('تم حذف الصورة', 'success');
    }
  };

  // Touch-friendly photo viewer
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;
    
    // Swipe up/down to close
    if (Math.abs(deltaY) > 100 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setViewingPhoto(null);
    }
    
    setTouchStart(null);
  };

  return (
    <div className="space-y-4 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">قسم الأطباء</h1>
          <p className="text-sm md:text-base text-muted-foreground">إدارة الأطباء والروشتات والصور</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDoctorDialog(true)} className="flex-1 sm:flex-none">
            <UserPlus className="h-4 w-4 ml-2" />
            إضافة طبيب
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="patients" className="text-xs md:text-sm">المرضى</TabsTrigger>
          <TabsTrigger value="doctors" className="text-xs md:text-sm">الأطباء</TabsTrigger>
          <TabsTrigger value="photos" className="text-xs md:text-sm">الصور</TabsTrigger>
          <TabsTrigger value="prescriptions" className="text-xs md:text-sm">الروشتات</TabsTrigger>
        </TabsList>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Patient List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
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
                <ScrollArea className="h-64 md:h-96">
                  <div className="space-y-2">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors touch-manipulation ${
                          selectedPatient?.id === patient.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50 active:bg-muted'
                        }`}
                        onClick={() => selectPatient(patient)}
                      >
                        <p className="font-medium text-sm md:text-base">{patient.name}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{patient.phone}</p>
                      </div>
                    ))}
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

            {/* Patient Details */}
            <Card className="lg:col-span-2">
              {selectedPatient ? (
                <>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <Users className="h-5 w-5 text-primary" />
                      {selectedPatient.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <Label className="text-xs md:text-sm text-muted-foreground">السن</Label>
                        <p className="font-medium text-sm md:text-base">{selectedPatient.age} سنة</p>
                      </div>
                      <div>
                        <Label className="text-xs md:text-sm text-muted-foreground">الهاتف</Label>
                        <p className="font-medium text-sm md:text-base">{selectedPatient.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs md:text-sm text-muted-foreground">العنوان</Label>
                        <p className="font-medium text-sm md:text-base">{selectedPatient.address}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Photo Gallery */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm md:text-base">معرض الصور</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentPhotoType('before');
                            setShowPhotoDialog(true);
                          }}
                          className="touch-manipulation"
                        >
                          <Camera className="h-4 w-4 ml-2" />
                          <span className="hidden sm:inline">إضافة صورة</span>
                          <span className="sm:hidden">صورة</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <p className="text-xs md:text-sm font-medium mb-2">قبل العلاج ({photos.before.length})</p>
                          <div className="grid grid-cols-3 gap-1 md:gap-2">
                            {photos.before.map((url, i) => (
                              <div key={i} className="relative group aspect-square">
                                <img
                                  src={url}
                                  alt={`قبل ${i + 1}`}
                                  className="w-full h-full object-cover rounded-lg cursor-pointer touch-manipulation"
                                  onClick={() => setViewingPhoto(url)}
                                />
                                <button
                                  className="absolute top-1 left-1 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-70 group-hover:opacity-100 transition-opacity touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePhoto(url, 'before');
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm font-medium mb-2">بعد العلاج ({photos.after.length})</p>
                          <div className="grid grid-cols-3 gap-1 md:gap-2">
                            {photos.after.map((url, i) => (
                              <div key={i} className="relative group aspect-square">
                                <img
                                  src={url}
                                  alt={`بعد ${i + 1}`}
                                  className="w-full h-full object-cover rounded-lg cursor-pointer touch-manipulation"
                                  onClick={() => setViewingPhoto(url)}
                                />
                                <button
                                  className="absolute top-1 left-1 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-70 group-hover:opacity-100 transition-opacity touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePhoto(url, 'after');
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowExaminationDialog(true)}
                        className="touch-manipulation"
                      >
                        <FileText className="h-4 w-4 ml-2" />
                        ملاحظات الفحص
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPhotoType('before');
                          setShowPhotoDialog(true);
                        }}
                        className="touch-manipulation"
                      >
                        <Camera className="h-4 w-4 ml-2" />
                        صورة قبل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPhotoType('after');
                          setShowPhotoDialog(true);
                        }}
                        className="touch-manipulation"
                      >
                        <Camera className="h-4 w-4 ml-2" />
                        صورة بعد
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowPrescriptionDialog(true)}
                        className="touch-manipulation"
                      >
                        <ClipboardList className="h-4 w-4 ml-2" />
                        روشتة
                      </Button>
                    </div>
                    
                    {/* Examination Notes Preview */}
                    {(selectedPatient.examinationNotes || selectedPatient.diagnosis || selectedPatient.treatment) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            ملاحظات الفحص
                          </h4>
                          {selectedPatient.lastExaminationDate && (
                            <p className="text-xs text-muted-foreground">
                              آخر فحص: {format(new Date(selectedPatient.lastExaminationDate), 'd MMMM yyyy', { locale: ar })}
                            </p>
                          )}
                          {selectedPatient.diagnosis && (
                            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">التشخيص:</p>
                              <p className="text-sm mt-1">{selectedPatient.diagnosis}</p>
                            </div>
                          )}
                          {selectedPatient.examinationNotes && (
                            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">الملاحظات:</p>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{selectedPatient.examinationNotes}</p>
                            </div>
                          )}
                          {selectedPatient.treatment && (
                            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium">العلاج:</p>
                              <p className="text-sm mt-1">{selectedPatient.treatment}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex flex-col items-center justify-center h-64 md:h-96 text-muted-foreground">
                  <Users className="h-16 w-16 mb-4 opacity-50" />
                  <p>اختر مريض من القائمة</p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <Card key={doctor.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    {doctor.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Stethoscope className="h-4 w-4" />
                    <span>{doctor.specialization || 'طبيب عام'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    <span>{doctor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-amber-500">{doctor.percentage}%</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="touch-manipulation flex-1"
                      onClick={() => {
                        setEditingDoctor(doctor);
                        setDoctorForm({
                          name: doctor.name,
                          specialization: doctor.specialization,
                          phone: doctor.phone,
                          percentage: doctor.percentage.toString(),
                        });
                        setShowDoctorDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="touch-manipulation flex-1"
                      onClick={() => {
                        deleteDoctor(doctor.id);
                        addNotification('تم حذف الطبيب', 'success');
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {doctors.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Stethoscope className="h-16 w-16 mb-4 opacity-50" />
                  <p>لا يوجد أطباء مسجلين</p>
                  <Button className="mt-4" onClick={() => setShowDoctorDialog(true)}>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة طبيب
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                معرض الصور
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPatient ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="font-medium">{selectedPatient.name}</span>
                    <Badge>قبل: {photos.before.length}</Badge>
                    <Badge variant="secondary">بعد: {photos.after.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-sm md:text-base">صور قبل العلاج</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.before.map((url, i) => (
                          <div key={i} className="relative group aspect-square">
                            <img
                              src={url}
                              alt={`قبل ${i + 1}`}
                              className="w-full h-full object-cover rounded-lg cursor-pointer touch-manipulation"
                              onClick={() => setViewingPhoto(url)}
                            />
                            <button
                              className="absolute top-1 left-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-70 group-hover:opacity-100 transition-opacity touch-manipulation"
                              onClick={() => deletePhoto(url, 'before')}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-sm md:text-base">صور بعد العلاج</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.after.map((url, i) => (
                          <div key={i} className="relative group aspect-square">
                            <img
                              src={url}
                              alt={`بعد ${i + 1}`}
                              className="w-full h-full object-cover rounded-lg cursor-pointer touch-manipulation"
                              onClick={() => setViewingPhoto(url)}
                            />
                            <button
                              className="absolute top-1 left-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-70 group-hover:opacity-100 transition-opacity touch-manipulation"
                              onClick={() => deletePhoto(url, 'after')}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>اختر مريض أولاً</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Pill className="h-5 w-5 text-primary" />
                  الروشتات
                </CardTitle>
                {selectedPatient && (
                  <Button size="sm" onClick={() => setShowPrescriptionDialog(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    روشتة جديدة
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedPatient ? (
                <div className="space-y-4">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="p-3 md:p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="text-xs">
                          {format(new Date(rx.date), 'd MMM yyyy', { locale: ar })}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {rx.medications.map((med, i) => (
                          <div key={i} className="p-2 rounded bg-muted/50">
                            <p className="font-medium text-sm">{med.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {med.dosage} - {med.frequency}
                            </p>
                          </div>
                        ))}
                      </div>
                      {rx.notes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          ملاحظات: {rx.notes}
                        </p>
                      )}
                    </div>
                  ))}
                  {prescriptions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد روشتات لهذا المريض</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>اختر مريض أولاً</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Doctor Dialog */}
      <Dialog open={showDoctorDialog} onOpenChange={setShowDoctorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingDoctor ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">الاسم *</Label>
              <Input
                value={doctorForm.name}
                onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                placeholder="اسم الطبيب"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">التخصص</Label>
              <Input
                value={doctorForm.specialization}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                placeholder="التخصص"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">الهاتف</Label>
              <Input
                value={doctorForm.phone}
                onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">النسبة المئوية</Label>
              <Input
                type="number"
                value={doctorForm.percentage}
                onChange={(e) => setDoctorForm({ ...doctorForm, percentage: e.target.value })}
                placeholder="النسبة %"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDoctorDialog(false);
              setEditingDoctor(null);
              setDoctorForm({ name: '', specialization: '', phone: '', percentage: '' });
            }}>
              إلغاء
            </Button>
            <Button onClick={handleDoctorSubmit}>
              {editingDoctor ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog - Mobile Friendly */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">إضافة صورة {currentPhotoType === 'before' ? 'قبل' : 'بعد'} العلاج</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={currentPhotoType === 'before' ? 'default' : 'outline'}
                className="flex-1 touch-manipulation"
                onClick={() => setCurrentPhotoType('before')}
              >
                قبل العلاج
              </Button>
              <Button
                variant={currentPhotoType === 'after' ? 'default' : 'outline'}
                className="flex-1 touch-manipulation"
                onClick={() => setCurrentPhotoType('after')}
              >
                بعد العلاج
              </Button>
            </div>

            {/* Camera Button for Mobile */}
            <div className="space-y-3">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              
              <Button
                className="w-full h-auto py-6 flex-col gap-2 touch-manipulation"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
              >
                <Smartphone className="h-8 w-8" />
                <span>التقاط صورة بالكاميرا</span>
                <span className="text-xs opacity-70">للموبايل</span>
              </Button>

              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
              
              <Button
                variant="outline"
                className="w-full h-auto py-6 flex-col gap-2 touch-manipulation"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImagePlus className="h-8 w-8" />
                <span>اختيار من المعرض</span>
                <span className="text-xs opacity-70">للكمبيوتر والموبايل</span>
              </Button>
            </div>

            {isUploading && (
              <div className="text-center text-sm text-muted-foreground">
                جاري رفع الصور...
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhotoDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">روشتة جديدة</DialogTitle>
            <DialogDescription>
              {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {prescriptionForm.medications.map((med, index) => (
              <div key={index} className="p-3 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">دواء {index + 1}</span>
                  {prescriptionForm.medications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="touch-manipulation"
                      onClick={() => removeMedication(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  value={med.name}
                  onChange={(e) => updateMedication(index, 'name', e.target.value)}
                  placeholder="اسم الدواء"
                  className="text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    placeholder="الجرعة"
                    className="text-sm"
                  />
                  <Input
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    placeholder="الاستخدام"
                    className="text-sm"
                  />
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full touch-manipulation" onClick={addMedication}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة دواء
            </Button>

            <div className="space-y-2">
              <Label className="text-sm">ملاحظات</Label>
              <Textarea
                value={prescriptionForm.notes}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handlePrescriptionSubmit}>حفظ الروشتة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog - Touch Friendly */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {viewingPhoto && (
            <div 
              className="relative touch-manipulation"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={viewingPhoto}
                alt="صورة مكبرة"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 left-4 touch-manipulation"
                onClick={() => setViewingPhoto(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-3 py-1 rounded-full">
                اسحب للأسفل للإغلاق
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Examination Notes Dialog */}
      <Dialog open={showExaminationDialog} onOpenChange={setShowExaminationDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              ملاحظات الفحص
            </DialogTitle>
            <DialogDescription>
              {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Diagnosis */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">التشخيص</Label>
              <Input
                value={examinationForm.diagnosis}
                onChange={(e) => setExaminationForm({ ...examinationForm, diagnosis: e.target.value })}
                placeholder="التشخيص الطبي..."
                className="text-sm"
              />
            </div>
            
            {/* Examination Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">ملاحظات الفحص</Label>
              <Textarea
                value={examinationForm.examinationNotes}
                onChange={(e) => setExaminationForm({ ...examinationForm, examinationNotes: e.target.value })}
                placeholder="اكتب ملاحظاتك هنا..."
                className="text-sm min-h-[120px]"
              />
            </div>
            
            {/* Treatment */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">العلاج الموصوف</Label>
              <Textarea
                value={examinationForm.treatment}
                onChange={(e) => setExaminationForm({ ...examinationForm, treatment: e.target.value })}
                placeholder="العلاج والأدوية الموصوفة..."
                className="text-sm min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExaminationDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={saveExaminationNotes}>
              <FileText className="h-4 w-4 ml-2" />
              حفظ الملاحظات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
