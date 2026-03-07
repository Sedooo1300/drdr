'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { exportAllData, importData } from '@/lib/db';

const SYNC_API = '/api/sync';
const SYNC_INTERVAL = 3000; // 3 seconds

export function useSync() {
  const { addNotification } = useAppStore();
  
  // State
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [devices, setDevices] = useState(1);
  const [syncCount, setSyncCount] = useState(0);
  
  // Refs for interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const roomRef = useRef<string | null>(null);
  const syncingRef = useRef(false);

  // Check online status
  useEffect(() => {
    const checkOnline = () => setIsOnline(navigator.onLine);
    checkOnline();
    
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);
    
    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  // Load saved room on mount
  useEffect(() => {
    const savedRoom = localStorage.getItem('sync-room-code');
    const savedLastSync = localStorage.getItem('lastSync');
    
    if (savedRoom) {
      roomRef.current = savedRoom;
      setRoomCode(savedRoom);
      setIsConnected(true);
      
      // Start auto sync
      startAutoSync(savedRoom);
    }
    
    if (savedLastSync) {
      setLastSync(savedLastSync);
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // PUSH data to server
  const pushData = useCallback(async (): Promise<boolean> => {
    if (!roomRef.current || syncingRef.current) return false;
    
    syncingRef.current = true;
    
    try {
      // Export current data
      const data = await exportAllData();
      
      const response = await fetch(SYNC_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update', 
          room: roomRef.current, 
          data 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const now = new Date().toISOString();
        localStorage.setItem('lastSync', now);
        localStorage.setItem('lastSyncTime', result.lastUpdated.toString());
        setLastSync(now);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Push error:', error);
      return false;
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // PULL data from server - SMART MERGE
  const pullData = useCallback(async (): Promise<boolean> => {
    if (!roomRef.current || syncingRef.current) return false;
    
    syncingRef.current = true;
    
    try {
      const response = await fetch(`${SYNC_API}?action=sync&room=${roomRef.current}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Check if server data is newer
        const localSyncTime = parseInt(localStorage.getItem('lastSyncTime') || '0');
        const serverTime = result.lastUpdated || 0;
        
        if (serverTime > localSyncTime) {
          // Smart merge - won't delete local data
          const stats = await importData(result.data);
          
          // Update sync time
          localStorage.setItem('lastSyncTime', serverTime.toString());
          
          const now = new Date().toISOString();
          localStorage.setItem('lastSync', now);
          setLastSync(now);
          
          // Update counter
          setSyncCount(prev => prev + 1);
          
          // Refresh UI if there were changes
          if (stats.added > 0 || stats.updated > 0) {
            window.dispatchEvent(new CustomEvent('data-updated'));
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Pull error:', error);
      return false;
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // Start continuous sync
  const startAutoSync = useCallback((code: string) => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    roomRef.current = code;
    
    // Do initial sync
    pullData();
    
    // Set up continuous sync - both push and pull
    intervalRef.current = setInterval(() => {
      pushData();
      pullData();
    }, SYNC_INTERVAL);
  }, [pushData, pullData]);

  // Create new room
  const createRoom = useCallback(async (): Promise<string | null> => {
    if (!isOnline) {
      addNotification('غير متصل بالإنترنت', 'error');
      return null;
    }
    
    try {
      setIsSyncing(true);
      
      // Generate 6-char code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Export current data
      const data = await exportAllData();
      
      const response = await fetch(SYNC_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', room: code, data }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Save to localStorage
        localStorage.setItem('sync-room-code', code);
        roomRef.current = code;
        
        setRoomCode(code);
        setIsConnected(true);
        setDevices(1);
        setSyncCount(0);
        
        // Start auto sync
        startAutoSync(code);
        
        addNotification(`تم إنشاء الغرفة: ${code}`, 'success');
        return code;
      }
      
      throw new Error(result.message || 'فشل إنشاء الغرفة');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل إنشاء الغرفة';
      addNotification(message, 'error');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, addNotification, startAutoSync]);

  // Join existing room
  const joinRoom = useCallback(async (code: string): Promise<boolean> => {
    if (!isOnline) {
      addNotification('غير متصل بالإنترنت', 'error');
      return false;
    }
    
    try {
      setIsSyncing(true);
      
      const response = await fetch(SYNC_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', room: code.toUpperCase() }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Import existing data from room (smart merge)
        if (result.data && result.data !== '') {
          try {
            const stats = await importData(result.data);
            
            if (stats.added > 0 || stats.updated > 0) {
              window.dispatchEvent(new CustomEvent('data-updated'));
              addNotification(`تم استيراد ${stats.added} سجل جديد`, 'success');
            }
          } catch (e) {
            console.error('Import error:', e);
          }
        }
        
        // Save to localStorage
        localStorage.setItem('sync-room-code', code.toUpperCase());
        roomRef.current = code.toUpperCase();
        
        setRoomCode(code.toUpperCase());
        setIsConnected(true);
        setDevices(2);
        setSyncCount(0);
        
        // Start auto sync
        startAutoSync(code.toUpperCase());
        
        addNotification(`تم الانضمام للغرفة`, 'success');
        return true;
      }
      
      throw new Error(result.message || 'كود غير صحيح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل الانضمام';
      addNotification(message, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, addNotification, startAutoSync]);

  // Leave room
  const leaveRoom = useCallback(() => {
    // Stop sync
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    roomRef.current = null;
    
    // Clear localStorage
    localStorage.removeItem('sync-room-code');
    localStorage.removeItem('lastSync');
    localStorage.removeItem('lastSyncTime');
    
    // Reset state
    setRoomCode(null);
    setIsConnected(false);
    setLastSync(null);
    setDevices(0);
    setSyncCount(0);
    
    addNotification('تم إيقاف المزامنة', 'info');
  }, [addNotification]);

  // Manual sync
  const sync = useCallback(async () => {
    if (!isOnline) {
      addNotification('غير متصل بالإنترنت', 'error');
      return;
    }
    
    setIsSyncing(true);
    
    const pushed = await pushData();
    const pulled = await pullData();
    
    setIsSyncing(false);
    
    if (pushed || pulled) {
      addNotification('تمت المزامنة بنجاح', 'success');
    } else {
      addNotification('لا توجد تحديثات جديدة', 'info');
    }
  }, [isOnline, pushData, pullData, addNotification]);

  return {
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
    pushData,
    pullData,
    startAutoSync,
  };
}

// Backup hook
export function useBackup() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('lastBackup') : null
  );

  const createBackup = useCallback(async () => {
    try {
      setIsBackingUp(true);
      
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-clinic-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const now = new Date().toISOString();
      setLastBackup(now);
      localStorage.setItem('lastBackup', now);
      
      return true;
    } catch {
      return false;
    } finally {
      setIsBackingUp(false);
    }
  }, []);

  const restoreBackup = useCallback(async (file: File) => {
    try {
      setIsBackingUp(true);
      
      const text = await file.text();
      const stats = await importData(text);
      
      const now = new Date().toISOString();
      setLastBackup(now);
      localStorage.setItem('lastBackup', now);
      
      window.dispatchEvent(new CustomEvent('data-updated'));
      
      return { success: true, stats };
    } catch {
      return { success: false, stats: { added: 0, updated: 0, skipped: 0 } };
    } finally {
      setIsBackingUp(false);
    }
  }, []);

  return { isBackingUp, lastBackup, createBackup, restoreBackup };
}

// Data deletion hook
export function useDataDeletion() {
  const { addNotification } = useAppStore();

  const deleteAllData = useCallback(async (storeName: string): Promise<boolean> => {
    try {
      const { clearStore } = await import('@/lib/db');
      await clearStore(storeName);
      addNotification('تم حذف البيانات', 'success');
      window.dispatchEvent(new CustomEvent('data-updated'));
      return true;
    } catch {
      addNotification('فشل الحذف', 'error');
      return false;
    }
  }, [addNotification]);

  const deleteAllDataAllStores = useCallback(async (): Promise<boolean> => {
    try {
      const { clearStore } = await import('@/lib/db');
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
      window.dispatchEvent(new CustomEvent('data-updated'));
      return true;
    } catch {
      addNotification('فشل الحذف', 'error');
      return false;
    }
  }, [addNotification]);

  return { deleteAllData, deleteAllDataAllStores };
}
