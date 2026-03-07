export interface ThemeConfig {
  id: string;
  name: string;
  nameAr: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    ring: string;
  };
  gradient: string;
}

export const themeConfigs: ThemeConfig[] = [
  {
    id: 'cyan',
    name: 'Cyan',
    nameAr: 'سماوي',
    colors: {
      primary: '#0891b2',
      primaryForeground: '#ffffff',
      secondary: '#06b6d4',
      secondaryForeground: '#ffffff',
      accent: '#22d3ee',
      accentForeground: '#1f2937',
      background: '#f0fdfa',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#0891b2',
    },
    gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
  },
  {
    id: 'blue',
    name: 'Blue',
    nameAr: 'أزرق',
    colors: {
      primary: '#2563eb',
      primaryForeground: '#ffffff',
      secondary: '#3b82f6',
      secondaryForeground: '#ffffff',
      accent: '#60a5fa',
      accentForeground: '#1f2937',
      background: '#eff6ff',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#2563eb',
    },
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  },
  {
    id: 'purple',
    name: 'Purple',
    nameAr: 'بنفسجي',
    colors: {
      primary: '#7c3aed',
      primaryForeground: '#ffffff',
      secondary: '#8b5cf6',
      secondaryForeground: '#ffffff',
      accent: '#a78bfa',
      accentForeground: '#1f2937',
      background: '#f5f3ff',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#7c3aed',
    },
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
  },
  {
    id: 'green',
    name: 'Green',
    nameAr: 'أخضر',
    colors: {
      primary: '#059669',
      primaryForeground: '#ffffff',
      secondary: '#10b981',
      secondaryForeground: '#ffffff',
      accent: '#34d399',
      accentForeground: '#1f2937',
      background: '#ecfdf5',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#059669',
    },
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  },
  {
    id: 'orange',
    name: 'Orange',
    nameAr: 'برتقالي',
    colors: {
      primary: '#ea580c',
      primaryForeground: '#ffffff',
      secondary: '#f97316',
      secondaryForeground: '#ffffff',
      accent: '#fb923c',
      accentForeground: '#1f2937',
      background: '#fff7ed',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#ea580c',
    },
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
  },
  {
    id: 'pink',
    name: 'Pink',
    nameAr: 'وردي',
    colors: {
      primary: '#db2777',
      primaryForeground: '#ffffff',
      secondary: '#ec4899',
      secondaryForeground: '#ffffff',
      accent: '#f472b6',
      accentForeground: '#1f2937',
      background: '#fdf2f8',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#db2777',
    },
    gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
  },
  {
    id: 'red',
    name: 'Red',
    nameAr: 'أحمر',
    colors: {
      primary: '#dc2626',
      primaryForeground: '#ffffff',
      secondary: '#ef4444',
      secondaryForeground: '#ffffff',
      accent: '#f87171',
      accentForeground: '#1f2937',
      background: '#fef2f2',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#dc2626',
    },
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
  },
  {
    id: 'teal',
    name: 'Teal',
    nameAr: 'فيروزي',
    colors: {
      primary: '#0d9488',
      primaryForeground: '#ffffff',
      secondary: '#14b8a6',
      secondaryForeground: '#ffffff',
      accent: '#2dd4bf',
      accentForeground: '#1f2937',
      background: '#f0fdfa',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#0d9488',
    },
    gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    nameAr: 'نيلي',
    colors: {
      primary: '#4f46e5',
      primaryForeground: '#ffffff',
      secondary: '#6366f1',
      secondaryForeground: '#ffffff',
      accent: '#818cf8',
      accentForeground: '#1f2937',
      background: '#eef2ff',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#4f46e5',
    },
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
  },
  {
    id: 'amber',
    name: 'Amber',
    nameAr: 'كهرماني',
    colors: {
      primary: '#d97706',
      primaryForeground: '#ffffff',
      secondary: '#f59e0b',
      secondaryForeground: '#ffffff',
      accent: '#fbbf24',
      accentForeground: '#1f2937',
      background: '#fffbeb',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#d97706',
    },
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  },
  {
    id: 'rose',
    name: 'Rose',
    nameAr: 'جوري',
    colors: {
      primary: '#e11d48',
      primaryForeground: '#ffffff',
      secondary: '#f43f5e',
      secondaryForeground: '#ffffff',
      accent: '#fb7185',
      accentForeground: '#1f2937',
      background: '#fff1f2',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#e11d48',
    },
    gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    nameAr: 'زمرد',
    colors: {
      primary: '#059669',
      primaryForeground: '#ffffff',
      secondary: '#10b981',
      secondaryForeground: '#ffffff',
      accent: '#34d399',
      accentForeground: '#1f2937',
      background: '#ecfdf5',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      ring: '#059669',
    },
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  },
];

export const applyTheme = (themeId: string, darkMode: boolean = false) => {
  const theme = themeConfigs.find((t) => t.id === themeId) || themeConfigs[0];
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  if (darkMode) {
    root.classList.add('dark');
    root.style.setProperty('--background', '#0f172a');
    root.style.setProperty('--foreground', '#f8fafc');
    root.style.setProperty('--card', '#1e293b');
    root.style.setProperty('--cardForeground', '#f8fafc');
    root.style.setProperty('--muted', '#334155');
    root.style.setProperty('--mutedForeground', '#94a3b8');
    root.style.setProperty('--border', '#334155');
  } else {
    root.classList.remove('dark');
  }
};

export const getThemeById = (id: string): ThemeConfig => {
  return themeConfigs.find((t) => t.id === id) || themeConfigs[0];
};
