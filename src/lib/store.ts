import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Section = 'center' | 'assistant' | 'doctors' | 'laser' | 'search' | 'settings';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
}

export const THEMES: Record<string, ThemeColors> = {
  cyan: {
    primary: '#0891b2',
    secondary: '#06b6d4',
    accent: '#22d3ee',
    background: '#f0fdfa',
    card: '#ffffff',
    text: '#1f2937',
  },
  blue: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    background: '#eff6ff',
    card: '#ffffff',
    text: '#1f2937',
  },
  purple: {
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    accent: '#a78bfa',
    background: '#f5f3ff',
    card: '#ffffff',
    text: '#1f2937',
  },
  green: {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
    background: '#ecfdf5',
    card: '#ffffff',
    text: '#1f2937',
  },
  orange: {
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#fb923c',
    background: '#fff7ed',
    card: '#ffffff',
    text: '#1f2937',
  },
  pink: {
    primary: '#db2777',
    secondary: '#ec4899',
    accent: '#f472b6',
    background: '#fdf2f8',
    card: '#ffffff',
    text: '#1f2937',
  },
  red: {
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#f87171',
    background: '#fef2f2',
    card: '#ffffff',
    text: '#1f2937',
  },
  teal: {
    primary: '#0d9488',
    secondary: '#14b8a6',
    accent: '#2dd4bf',
    background: '#f0fdfa',
    card: '#ffffff',
    text: '#1f2937',
  },
  indigo: {
    primary: '#4f46e5',
    secondary: '#6366f1',
    accent: '#818cf8',
    background: '#eef2ff',
    card: '#ffffff',
    text: '#1f2937',
  },
  amber: {
    primary: '#d97706',
    secondary: '#f59e0b',
    accent: '#fbbf24',
    background: '#fffbeb',
    card: '#ffffff',
    text: '#1f2937',
  },
  rose: {
    primary: '#e11d48',
    secondary: '#f43f5e',
    accent: '#fb7185',
    background: '#fff1f2',
    card: '#ffffff',
    text: '#1f2937',
  },
  emerald: {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
    background: '#ecfdf5',
    card: '#ffffff',
    text: '#1f2937',
  },
};

interface AppState {
  // Navigation
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
  
  // Theme
  currentTheme: string;
  darkMode: boolean;
  setTheme: (theme: string) => void;
  toggleDarkMode: () => void;
  getThemeColors: () => ThemeColors;
  
  // Protection
  isAuthenticated: boolean;
  protectedSections: string[];
  authenticate: (password: string) => boolean;
  logout: () => void;
  setProtectedSections: (sections: string[]) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Sync status
  isOnline: boolean;
  lastSync: string | null;
  setOnline: (status: boolean) => void;
  setLastSync: (time: string) => void;
  
  // Notifications
  notifications: { id: string; message: string; type: 'success' | 'error' | 'info'; time: string }[];
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Modal states
  activeModal: string | null;
  modalData: unknown;
  openModal: (modal: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentSection: 'center',
      setCurrentSection: (section) => set({ currentSection: section }),
      
      // Theme
      currentTheme: 'cyan',
      darkMode: false,
      setTheme: (theme) => set({ currentTheme: theme }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      getThemeColors: () => {
        const theme = get().currentTheme;
        return THEMES[theme] || THEMES.cyan;
      },
      
      // Protection
      isAuthenticated: false,
      protectedSections: ['doctors', 'settings', 'photos'],
      authenticate: (password) => {
        if (password === '2137') {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false }),
      setProtectedSections: (sections) => set({ protectedSections: sections }),
      
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Sync
      isOnline: true,
      lastSync: null,
      setOnline: (status) => set({ isOnline: status }),
      setLastSync: (time) => set({ lastSync: time }),
      
      // Notifications
      notifications: [],
      addNotification: (message, type) => {
        const id = Date.now().toString();
        const time = new Date().toISOString();
        set((state) => ({
          notifications: [...state.notifications, { id, message, type, time }],
        }));
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      
      // Loading
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Modal
      activeModal: null,
      modalData: null,
      openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'almaghazy-clinic-store',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        darkMode: state.darkMode,
        protectedSections: state.protectedSections,
        lastSync: state.lastSync,
      }),
    }
  )
);
