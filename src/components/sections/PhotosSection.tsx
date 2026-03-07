'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { getAllItems, getItemsByIndex, deleteItem, addItem, generateId } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Camera,
  ImagePlus,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Trash2,
  Download,
  ArrowRightLeft,
  Grid3X3,
  Columns,
  Search,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Patient, Photo } from '@/lib/db';

interface PhotoWithPatient extends Photo {
  patientName?: string;
}

export function PhotosSection() {
  const { addNotification, searchQuery } = useAppStore();
  
  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [photos, setPhotos] = useState<PhotoWithPatient[]>([]);
  const [beforePhotos, setBeforePhotos] = useState<PhotoWithPatient[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<PhotoWithPatient[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<PhotoWithPatient | null>(null);
  const [viewMode, setViewMode] = useState<'compare' | 'grid'>('compare');
  const [isUploading, setIsUploading] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<'before' | 'after'>('before');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load patients
  useEffect(() => {
    const loadPatients = async () => {
      const data = await getAllItems<Patient>('patients');
      setPatients(data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    };
    loadPatients();
    
    const handleUpdate = () => loadPatients();
    window.addEventListener('data-updated', handleUpdate);
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, []);

  // Load photos for selected patient
  useEffect(() => {
    const loadPhotos = async () => {
      if (selectedPatient) {
        const data = await getItemsByIndex<Photo>('photos', 'patientId', selectedPatient.id);
        const photosWithNames = data.map(p => ({ ...p, patientName: selectedPatient.name }));
        setPhotos(photosWithNames);
        setBeforePhotos(photosWithNames.filter(p => p.type === 'before').sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
        setAfterPhotos(photosWithNames.filter(p => p.type === 'after').sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      } else {
        // Load all photos
        const allPhotos = await getAllItems<Photo>('photos');
        const photosWithNames = await Promise.all(
          allPhotos.map(async (p) => {
            const patient = patients.find(pat => pat.id === p.patientId);
            return { ...p, patientName: patient?.name || 'غير معروف' };
          })
        );
        setPhotos(photosWithNames.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
        setBeforePhotos(photosWithNames.filter(p => p.type === 'before'));
        setAfterPhotos(photosWithNames.filter(p => p.type === 'after'));
      }
    };
    loadPhotos();
  }, [selectedPatient, patients]);

  // Filter patients - search by name, phone, address, or diagnosis
  const filteredPatients = patients.filter(p => {
    const query = localSearchQuery || searchQuery;
    if (!query) return true;
    const lower = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(lower) ||
      p.phone.includes(query) ||
      p.address.toLowerCase().includes(lower) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(lower))
    );
  });

  // Compress image
  const compressImage = useCallback((base64: string, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = Math.max(1, Math.round(width));
          canvas.height = Math.max(1, Math.round(height));

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64;
    });
  }, []);

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!selectedPatient) {
      addNotification('اختر مريض أولاً', 'error');
      return;
    }

    setIsUploading(true);
    addNotification('جاري رفع الصور...', 'info');

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          addNotification(`الصورة ${file.name} كبيرة جداً`, 'error');
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
              
              const compressed = await compressImage(base64, 1200, 0.85);
              
              const photo: Photo = {
                id: generateId(),
                patientId: selectedPatient.id,
                type: currentPhotoType,
                url: compressed,
                date: new Date().toISOString(),
                notes: '',
              };

              await addItem('photos', photo);
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }

      // Reload photos
      const data = await getItemsByIndex<Photo>('photos', 'patientId', selectedPatient.id);
      const photosWithNames = data.map(p => ({ ...p, patientName: selectedPatient.name }));
      setPhotos(photosWithNames);
      setBeforePhotos(photosWithNames.filter(p => p.type === 'before'));
      setAfterPhotos(photosWithNames.filter(p => p.type === 'after'));
      
      addNotification(`تم رفع ${files.length} صورة`, 'success');
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      
      // Notify sync
      window.dispatchEvent(new CustomEvent('data-changed'));
      
    } catch (err) {
      console.error('Upload error:', err);
      addNotification('حدث خطأ أثناء رفع الصور', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [selectedPatient, currentPhotoType, compressImage, addNotification]);

  // Delete photo
  const deletePhoto = async (photo: PhotoWithPatient) => {
    try {
      await deleteItem('photos', photo.id);
      
      // Reload
      if (selectedPatient) {
        const data = await getItemsByIndex<Photo>('photos', 'patientId', selectedPatient.id);
        const photosWithNames = data.map(p => ({ ...p, patientName: selectedPatient.name }));
        setPhotos(photosWithNames);
        setBeforePhotos(photosWithNames.filter(p => p.type === 'before'));
        setAfterPhotos(photosWithNames.filter(p => p.type === 'after'));
      }
      
      addNotification('تم حذف الصورة', 'success');
      setViewingPhoto(null);
      
      window.dispatchEvent(new CustomEvent('data-changed'));
    } catch {
      addNotification('فشل حذف الصورة', 'error');
    }
  };

  // Download photo
  const downloadPhoto = (photo: PhotoWithPatient) => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `${photo.patientName}_${photo.type}_${format(new Date(photo.date), 'yyyy-MM-dd')}.jpg`;
    a.click();
  };

  // Navigate photos
  const currentPhotos = viewingPhoto?.type === 'before' ? beforePhotos : afterPhotos;
  const currentIndex = viewingPhoto ? currentPhotos.findIndex(p => p.id === viewingPhoto.id) : -1;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setViewingPhoto(currentPhotos[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < currentPhotos.length - 1) {
      setViewingPhoto(currentPhotos[currentIndex + 1]);
    }
  };

  // Photo stats
  const totalPhotos = beforePhotos.length + afterPhotos.length;
  const patientsWithPhotos = new Set(photos.map(p => p.patientId)).size;

  return (
    <div className="space-y-4 p-3 md:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">📸 صور قبل وبعد</h1>
          <p className="text-sm text-muted-foreground">متابعة تقدم العلاج بالصور</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'compare' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('compare')}
          >
            <ArrowRightLeft className="h-4 w-4 ml-1" />
            مقارنة
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4 ml-1" />
            شبكة
          </Button>
        </div>
      </div>

      {/* Search Field */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، الهاتف، العنوان، أو التشخيص..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-primary/5">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalPhotos}</p>
            <p className="text-xs text-muted-foreground">إجمالي الصور</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-green-500">{beforePhotos.length}</p>
            <p className="text-xs text-muted-foreground">قبل</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{afterPhotos.length}</p>
            <p className="text-xs text-muted-foreground">بعد</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Patient List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">المرضى</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant={selectedPatient === null ? 'default' : 'outline'}
              className="w-full mb-3 justify-start"
              onClick={() => setSelectedPatient(null)}
            >
              <Grid3X3 className="h-4 w-4 ml-2" />
              جميع الصور ({totalPhotos})
            </Button>
            
            <Separator className="my-3" />
            
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredPatients.map((patient) => {
                  const patientPhotos = photos.filter(p => p.patientId === patient.id);
                  const beforeCount = patientPhotos.filter(p => p.type === 'before').length;
                  const afterCount = patientPhotos.filter(p => p.type === 'after').length;
                  
                  return (
                    <div
                      key={patient.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors touch-manipulation ${
                        selectedPatient?.id === patient.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">{patient.phone}</p>
                        </div>
                        <div className="flex gap-1">
                          {beforeCount > 0 && (
                            <Badge variant="secondary" className="text-xs">{beforeCount}</Badge>
                          )}
                          {afterCount > 0 && (
                            <Badge className="text-xs">{afterCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredPatients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا يوجد مرضى</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Photos Area */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedPatient ? selectedPatient.name : 'جميع الصور'}
              </CardTitle>
              
              {selectedPatient && (
                <div className="flex gap-2">
                  <Select value={currentPhotoType} onValueChange={(v) => setCurrentPhotoType(v as 'before' | 'after')}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">قبل</SelectItem>
                      <SelectItem value="after">بعد</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <ImagePlus className="h-4 w-4 ml-1" />
                    رفع
                  </Button>
                  
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {viewMode === 'compare' ? (
              /* Compare View */
              <div className="grid grid-cols-2 gap-4">
                {/* Before */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">قبل العلاج</Badge>
                    <span className="text-sm text-muted-foreground">({beforePhotos.length})</span>
                  </div>
                  
                  <ScrollArea className="h-80">
                    <div className="grid grid-cols-2 gap-2">
                      {beforePhotos.slice(0, 10).map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group aspect-square rounded-lg overflow-hidden border cursor-pointer"
                          onClick={() => setViewingPhoto(photo)}
                        >
                          <img
                            src={photo.url}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                            <p className="text-xs text-white truncate">
                              {format(new Date(photo.date), 'd MMM yyyy', { locale: ar })}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {beforePhotos.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>لا توجد صور</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                
                {/* After */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>بعد العلاج</Badge>
                    <span className="text-sm text-muted-foreground">({afterPhotos.length})</span>
                  </div>
                  
                  <ScrollArea className="h-80">
                    <div className="grid grid-cols-2 gap-2">
                      {afterPhotos.slice(0, 10).map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group aspect-square rounded-lg overflow-hidden border cursor-pointer"
                          onClick={() => setViewingPhoto(photo)}
                        >
                          <img
                            src={photo.url}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                            <p className="text-xs text-white truncate">
                              {format(new Date(photo.date), 'd MMM yyyy', { locale: ar })}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {afterPhotos.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>لا توجد صور</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              /* Grid View */
              <ScrollArea className="h-96">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group aspect-square rounded-lg overflow-hidden border cursor-pointer"
                      onClick={() => setViewingPhoto(photo)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.type}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute top-1 right-1">
                        <Badge variant={photo.type === 'before' ? 'secondary' : 'default'} className="text-xs">
                          {photo.type === 'before' ? 'قبل' : 'بعد'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                        <p className="text-xs text-white truncate">
                          {photo.patientName}
                        </p>
                        <p className="text-xs text-white/70">
                          {format(new Date(photo.date), 'd MMM', { locale: ar })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {photos.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mx-auto mb-3 opacity-50" />
                      <p>لا توجد صور</p>
                      <p className="text-sm mt-1">اختر مريض لرفع صور</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {viewingPhoto && (
            <div className="relative">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <Badge variant={viewingPhoto.type === 'before' ? 'secondary' : 'default'}>
                      {viewingPhoto.type === 'before' ? 'قبل العلاج' : 'بعد العلاج'}
                    </Badge>
                    <p className="font-medium mt-1">{viewingPhoto.patientName}</p>
                    <p className="text-sm opacity-80">
                      {format(new Date(viewingPhoto.date), 'd MMMM yyyy', { locale: ar })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => downloadPhoto(viewingPhoto)}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => deletePhoto(viewingPhoto)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => setViewingPhoto(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              {currentIndex > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}
              {currentIndex < currentPhotos.length - 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              
              {/* Image */}
              <img
                src={viewingPhoto.url}
                alt={viewingPhoto.type}
                className="w-full max-h-[85vh] object-contain bg-black"
              />
              
              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Badge variant="secondary" className="bg-black/50">
                  {currentIndex + 1} / {currentPhotos.length}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
