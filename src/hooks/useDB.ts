'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  initDB,
  getAllItems,
  addItem,
  updateItem,
  deleteItem,
  searchPatients,
  initializeDefaultData,
  generateId,
} from '@/lib/db';
import type { Patient, Visit, Session, SessionType, Appointment, Doctor } from '@/lib/db';

// Notify sync system that data changed
function notifySync() {
  if (typeof window !== 'undefined') {
    // Small delay to ensure DB write is complete
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('data-changed'));
    }, 100);
  }
}

export function useDB() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        await initializeDefaultData();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      }
    };
    init();
  }, []);

  return { isReady, error };
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await getAllItems<Patient>('patients');
      setPatients(data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err) {
      console.error('Fetch patients error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    
    // Listen for sync updates
    const handleUpdate = () => fetchPatients();
    window.addEventListener('data-updated', handleUpdate);
    
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, [fetchPatients]);

  const addPatient = useCallback(async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newPatient: Patient = {
      ...patient,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    
    await addItem('patients', newPatient);
    await fetchPatients();
    notifySync();
    
    return newPatient;
  }, [fetchPatients]);

  const updatePatient = useCallback(async (patient: Patient) => {
    const updatedPatient = {
      ...patient,
      updatedAt: new Date().toISOString(),
    };
    
    await updateItem('patients', updatedPatient);
    await fetchPatients();
    notifySync();
    
    return updatedPatient;
  }, [fetchPatients]);

  const deletePatient = useCallback(async (id: string) => {
    await deleteItem('patients', id);
    await fetchPatients();
    notifySync();
  }, [fetchPatients]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return patients;
    return searchPatients(query);
  }, [patients]);

  return {
    patients,
    loading,
    addPatient,
    updatePatient,
    deletePatient,
    search,
    refresh: fetchPatients,
  };
}

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async () => {
    try {
      const data = await getAllItems<Visit>('visits');
      setVisits(data.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (err) {
      console.error('Fetch visits error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
    
    const handleUpdate = () => fetchVisits();
    window.addEventListener('data-updated', handleUpdate);
    
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, [fetchVisits]);

  const addVisit = useCallback(async (visit: Omit<Visit, 'id' | 'createdAt'>) => {
    const newVisit: Visit = {
      ...visit,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    await addItem('visits', newVisit);
    await fetchVisits();
    notifySync();
    
    return newVisit;
  }, [fetchVisits]);

  const deleteVisit = useCallback(async (id: string) => {
    await deleteItem('visits', id);
    await fetchVisits();
    notifySync();
  }, [fetchVisits]);

  return { visits, loading, addVisit, deleteVisit, refresh: fetchVisits };
}

export function useSessionTypes() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessionTypes = useCallback(async () => {
    try {
      const data = await getAllItems<SessionType>('sessionTypes');
      setSessionTypes(data);
    } catch (err) {
      console.error('Fetch session types error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionTypes();
    
    const handleUpdate = () => fetchSessionTypes();
    window.addEventListener('data-updated', handleUpdate);
    
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, [fetchSessionTypes]);

  const addSessionType = useCallback(async (name: string, price: number) => {
    const newSessionType: SessionType = {
      id: generateId(),
      name,
      price,
      createdAt: new Date().toISOString(),
    };
    
    await addItem('sessionTypes', newSessionType);
    await fetchSessionTypes();
    notifySync();
    
    return newSessionType;
  }, [fetchSessionTypes]);

  return { sessionTypes, loading, addSessionType, refresh: fetchSessionTypes };
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await getAllItems<Appointment>('appointments');
      setAppointments(data.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    } catch (err) {
      console.error('Fetch appointments error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    
    const handleUpdate = () => fetchAppointments();
    window.addEventListener('data-updated', handleUpdate);
    
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, [fetchAppointments]);

  const addAppointment = useCallback(async (
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'reminderSent'>
  ) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: generateId(),
      createdAt: new Date().toISOString(),
      reminderSent: false,
    };
    
    await addItem('appointments', newAppointment);
    await fetchAppointments();
    notifySync();
    
    return newAppointment;
  }, [fetchAppointments]);

  const updateAppointment = useCallback(async (appointment: Appointment) => {
    await updateItem('appointments', appointment);
    await fetchAppointments();
    notifySync();
  }, [fetchAppointments]);

  const deleteAppointment = useCallback(async (id: string) => {
    await deleteItem('appointments', id);
    await fetchAppointments();
    notifySync();
  }, [fetchAppointments]);

  const getUpcoming = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date >= today && a.status === 'scheduled');
  }, [appointments]);

  const getToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date === today && a.status === 'scheduled');
  }, [appointments]);

  return {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getUpcoming,
    getToday,
    refresh: fetchAppointments,
  };
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = useCallback(async () => {
    try {
      const data = await getAllItems<Doctor>('doctors');
      setDoctors(data);
    } catch (err) {
      console.error('Fetch doctors error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
    
    const handleUpdate = () => fetchDoctors();
    window.addEventListener('data-updated', handleUpdate);
    
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, [fetchDoctors]);

  const addDoctor = useCallback(async (
    doctor: Omit<Doctor, 'id' | 'createdAt'>
  ) => {
    const newDoctor: Doctor = {
      ...doctor,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    await addItem('doctors', newDoctor);
    await fetchDoctors();
    notifySync();
    
    return newDoctor;
  }, [fetchDoctors]);

  const updateDoctor = useCallback(async (doctor: Doctor) => {
    await updateItem('doctors', doctor);
    await fetchDoctors();
    notifySync();
  }, [fetchDoctors]);

  const deleteDoctor = useCallback(async (id: string) => {
    await deleteItem('doctors', id);
    await fetchDoctors();
    notifySync();
  }, [fetchDoctors]);

  return { doctors, loading, addDoctor, updateDoctor, deleteDoctor, refresh: fetchDoctors };
}
