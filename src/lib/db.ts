// IndexedDB Database Setup for Offline PWA
const DB_NAME = 'almaghazy_clinic_db';
const DB_VERSION = 1;

export interface Patient {
  id: string;
  name: string;
  age: number;
  address: string;
  phone: string;
  visitType: 'examination' | 'followup' | 'session';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  examinationNotes?: string; // ملاحظات الفحص
  diagnosis?: string; // التشخيص
  treatment?: string; // العلاج الموصوف
  lastExaminationDate?: string; // تاريخ آخر فحص
}

export interface Session {
  id: string;
  patientId: string;
  type: string;
  price: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  patientId: string;
  type: 'examination' | 'followup' | 'session';
  sessions?: Session[];
  price: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  percentage: number;
  createdAt: string;
}

export interface LaserTreatment {
  id: string;
  patientId: string;
  area: string;
  deviceType: string;
  energy: number;
  pulses: number;
  sessions: number;
  currentSession: number;
  price: number;
  date: string;
  nextDate?: string;
  notes?: string;
  photos?: { before: string[]; after: string[] };
  createdAt: string;
}

export interface Photo {
  id: string;
  patientId: string;
  type: 'before' | 'after' | 'general' | 'analysis';
  url: string;
  date: string;
  notes?: string;
}

export interface FileRecord {
  id: string;
  patientId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  category: 'analysis' | 'prescription' | 'other';
  date: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

export interface Revenue {
  id: string;
  patientId?: string;
  description: string;
  amount: number;
  type: 'examination' | 'session' | 'laser' | 'other';
  doctorId?: string;
  date: string;
  createdAt: string;
}

export interface Settings {
  id: string;
  theme: string;
  darkMode: boolean;
  password: string;
  protectionEnabled: boolean;
  whatsappEnabled: boolean;
  autoBackup: boolean;
  syncEnabled: boolean;
  lastBackup?: string;
  lastSync?: string;
}

export interface Backup {
  id: string;
  date: string;
  size: number;
  type: 'auto' | 'manual';
  data: string;
}

export interface SessionType {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medications: { name: string; dosage: string; frequency: string }[];
  notes?: string;
  date: string;
}

export interface Attendance {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: 'checkin' | 'checkout';
}

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Patients store
      if (!database.objectStoreNames.contains('patients')) {
        const patientStore = database.createObjectStore('patients', { keyPath: 'id' });
        patientStore.createIndex('name', 'name', { unique: false });
        patientStore.createIndex('phone', 'phone', { unique: false });
        patientStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Visits store
      if (!database.objectStoreNames.contains('visits')) {
        const visitStore = database.createObjectStore('visits', { keyPath: 'id' });
        visitStore.createIndex('patientId', 'patientId', { unique: false });
        visitStore.createIndex('date', 'date', { unique: false });
      }

      // Sessions store
      if (!database.objectStoreNames.contains('sessions')) {
        const sessionStore = database.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('patientId', 'patientId', { unique: false });
        sessionStore.createIndex('type', 'type', { unique: false });
      }

      // Session types store
      if (!database.objectStoreNames.contains('sessionTypes')) {
        database.createObjectStore('sessionTypes', { keyPath: 'id' });
      }

      // Doctors store
      if (!database.objectStoreNames.contains('doctors')) {
        const doctorStore = database.createObjectStore('doctors', { keyPath: 'id' });
        doctorStore.createIndex('name', 'name', { unique: false });
      }

      // Laser treatments store
      if (!database.objectStoreNames.contains('laserTreatments')) {
        const laserStore = database.createObjectStore('laserTreatments', { keyPath: 'id' });
        laserStore.createIndex('patientId', 'patientId', { unique: false });
        laserStore.createIndex('date', 'date', { unique: false });
      }

      // Photos store
      if (!database.objectStoreNames.contains('photos')) {
        const photoStore = database.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('patientId', 'patientId', { unique: false });
        photoStore.createIndex('type', 'type', { unique: false });
      }

      // Files store
      if (!database.objectStoreNames.contains('files')) {
        const fileStore = database.createObjectStore('files', { keyPath: 'id' });
        fileStore.createIndex('patientId', 'patientId', { unique: false });
        fileStore.createIndex('category', 'category', { unique: false });
      }

      // Appointments store
      if (!database.objectStoreNames.contains('appointments')) {
        const appointmentStore = database.createObjectStore('appointments', { keyPath: 'id' });
        appointmentStore.createIndex('patientId', 'patientId', { unique: false });
        appointmentStore.createIndex('date', 'date', { unique: false });
        appointmentStore.createIndex('status', 'status', { unique: false });
      }

      // Expenses store
      if (!database.objectStoreNames.contains('expenses')) {
        const expenseStore = database.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('date', 'date', { unique: false });
        expenseStore.createIndex('category', 'category', { unique: false });
      }

      // Revenues store
      if (!database.objectStoreNames.contains('revenues')) {
        const revenueStore = database.createObjectStore('revenues', { keyPath: 'id' });
        revenueStore.createIndex('date', 'date', { unique: false });
        revenueStore.createIndex('type', 'type', { unique: false });
      }

      // Settings store
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' });
      }

      // Backups store
      if (!database.objectStoreNames.contains('backups')) {
        const backupStore = database.createObjectStore('backups', { keyPath: 'id' });
        backupStore.createIndex('date', 'date', { unique: false });
      }

      // Prescriptions store
      if (!database.objectStoreNames.contains('prescriptions')) {
        const prescriptionStore = database.createObjectStore('prescriptions', { keyPath: 'id' });
        prescriptionStore.createIndex('patientId', 'patientId', { unique: false });
        prescriptionStore.createIndex('doctorId', 'doctorId', { unique: false });
      }

      // Attendance store
      if (!database.objectStoreNames.contains('attendance')) {
        const attendanceStore = database.createObjectStore('attendance', { keyPath: 'id' });
        attendanceStore.createIndex('patientId', 'patientId', { unique: false });
        attendanceStore.createIndex('date', 'date', { unique: false });
      }

      // Medications store (for quick prescriptions)
      if (!database.objectStoreNames.contains('medications')) {
        database.createObjectStore('medications', { keyPath: 'id' });
      }

      // Prescription templates store
      if (!database.objectStoreNames.contains('prescriptionTemplates')) {
        database.createObjectStore('prescriptionTemplates', { keyPath: 'id' });
      }
    };
  });
};

// Generic CRUD operations
export const addItem = async <T extends { id: string }>(
  storeName: string,
  item: T
): Promise<T> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
};

export const updateItem = async <T extends { id: string }>(
  storeName: string,
  item: T
): Promise<T> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
};

export const deleteItem = async (
  storeName: string,
  id: string
): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getItem = async <T>(
  storeName: string,
  id: string
): Promise<T | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getItemsByIndex = async <T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearStore = async (storeName: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Search function
export const searchPatients = async (query: string): Promise<Patient[]> => {
  const patients = await getAllItems<Patient>('patients');
  const lowerQuery = query.toLowerCase();
  
  return patients.filter(patient => 
    patient.name.toLowerCase().includes(lowerQuery) ||
    patient.phone.includes(query) ||
    patient.address.toLowerCase().includes(lowerQuery) ||
    patient.age.toString().includes(query)
  );
};

// Get default session types
export const getDefaultSessionTypes = (): SessionType[] => [
  { id: '1', name: 'فراكشنال ليزر', price: 500, createdAt: new Date().toISOString() },
  { id: '2', name: 'أكزيمر', price: 400, createdAt: new Date().toISOString() },
  { id: '3', name: 'كي بارد', price: 300, createdAt: new Date().toISOString() },
  { id: '4', name: 'تقشير بارد', price: 350, createdAt: new Date().toISOString() },
  { id: '5', name: 'تقشير كيميائي', price: 400, createdAt: new Date().toISOString() },
  { id: '6', name: 'حقن شعر', price: 600, createdAt: new Date().toISOString() },
  { id: '7', name: 'بلازما', price: 700, createdAt: new Date().toISOString() },
];

// Initialize default data
export const initializeDefaultData = async () => {
  try {
    const existingSessionTypes = await getAllItems<SessionType>('sessionTypes');
    
    if (existingSessionTypes.length === 0) {
      const defaultTypes = getDefaultSessionTypes();
      for (const type of defaultTypes) {
        await addItem('sessionTypes', type);
      }
    }

    // Initialize settings if not exists
    const settings = await getItem<Settings>('settings', 'main');
    if (!settings) {
      await addItem('settings', {
        id: 'main',
        theme: 'cyan',
        darkMode: false,
        password: '2137',
        protectionEnabled: true,
        whatsappEnabled: true,
        autoBackup: true,
        syncEnabled: true,
      });
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// Export all data for backup/sync
export const exportAllData = async (): Promise<string> => {
  const stores = [
    'patients', 'visits', 'sessions', 'sessionTypes', 'doctors',
    'laserTreatments', 'photos', 'files', 'appointments',
    'expenses', 'revenues', 'settings', 'prescriptions',
    'attendance', 'medications', 'prescriptionTemplates'
  ];
  
  const data: Record<string, unknown[]> = {};
  
  for (const store of stores) {
    try {
      data[store] = await getAllItems(store);
    } catch {
      data[store] = [];
    }
  }
  
  // Add sync timestamp
  data['_syncTime'] = [Date.now()];
  
  return JSON.stringify(data);
};

// SMART MERGE - preserves all data from both sources
export const importData = async (jsonData: string): Promise<{ added: number; updated: number; skipped: number }> => {
  const stats = { added: 0, updated: 0, skipped: 0 };
  
  let incomingData: Record<string, unknown[]>;
  try {
    incomingData = JSON.parse(jsonData);
  } catch {
    throw new Error('Invalid JSON data');
  }
  
  // Get local sync time
  const localSyncTime = parseInt(localStorage.getItem('lastSyncTime') || '0');
  const incomingSyncTime = (incomingData['_syncTime'] as number[])?.[0] || 0;
  
  // If incoming is older than local, skip
  if (incomingSyncTime && incomingSyncTime <= localSyncTime) {
    console.log('Skipping import - local data is newer');
    return { added: 0, updated: 0, skipped: 0 };
  }
  
  for (const [storeName, incomingItems] of Object.entries(incomingData)) {
    if (storeName === '_syncTime' || !Array.isArray(incomingItems)) continue;
    
    // Get local items
    const localItems = await getAllItems(storeName);
    const localMap = new Map(localItems.map((item: any) => [item.id, item]));
    
    for (const incomingItem of incomingItems) {
      const item = incomingItem as any;
      if (!item.id) continue;
      
      const localItem = localMap.get(item.id);
      
      if (!localItem) {
        // Item doesn't exist locally - ADD it
        try {
          await addItem(storeName, item);
          stats.added++;
        } catch {
          // Might fail if already exists
        }
      } else {
        // Item exists - check which is newer
        const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
        const incomingTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
        
        if (incomingTime > localTime) {
          // Incoming is newer - UPDATE
          try {
            await updateItem(storeName, item);
            stats.updated++;
          } catch {
            // Skip on error
          }
        } else {
          stats.skipped++;
        }
      }
    }
  }
  
  // Update sync time
  if (incomingSyncTime) {
    localStorage.setItem('lastSyncTime', incomingSyncTime.toString());
  }
  
  console.log('Import stats:', stats);
  return stats;
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
