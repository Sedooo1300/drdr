'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
  targetSection?: string;
}

export function PasswordModal({ targetSection }: PasswordModalProps) {
  const { authenticate, setCurrentSection, closeModal, activeModal } = useAppStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const isOpen = activeModal === 'password';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authenticate(password)) {
      setError('');
      setPassword('');
      setAttempts(0);
      closeModal();
      if (targetSection) {
        setCurrentSection(targetSection as 'center' | 'assistant' | 'doctors' | 'laser' | 'search' | 'settings');
      }
    } else {
      setAttempts(prev => prev + 1);
      setError('كلمة السر غير صحيحة');
      setPassword('');
      
      if (attempts >= 2) {
        setError('لقد تجاوزت عدد المحاولات المسموح');
        setTimeout(() => {
          closeModal();
          setError('');
          setAttempts(0);
        }, 2000);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            تأكيد الدخول
          </DialogTitle>
          <DialogDescription>
            هذا القسم محمي بكلمة سر. يرجى إدخال كلمة السر للدخول.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">كلمة السر</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="أدخل كلمة السر"
              className="text-center text-lg tracking-widest"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              إلغاء
            </Button>
            <Button type="submit" disabled={attempts >= 3}>
              تأكيد
            </Button>
          </DialogFooter>
        </form>

        <div className="text-xs text-muted-foreground text-center mt-4">
          للمساعدة، تواصل مع الإدارة
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProtectedRoute({ 
  children, 
  isProtected 
}: { 
  children: React.ReactNode;
  isProtected?: boolean;
}) {
  const { isAuthenticated, protectedSections, currentSection, openModal } = useAppStore();

  if (isProtected && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">هذا القسم محمي</h3>
        <p className="text-muted-foreground">يرجى إدخال كلمة السر للوصول</p>
        <Button onClick={() => openModal('password', { targetSection: currentSection })}>
          إدخال كلمة السر
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
