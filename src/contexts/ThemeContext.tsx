import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrandingColors, Settings } from '../types';
import { DEFAULT_COLORS, DEFAULT_MENU_CATEGORIES } from '../config/constants';
import { settingsService } from '../services/settings.service';

interface ThemeContextType {
  colors: BrandingColors;
  logo: string | null;
  restaurantName: string;
  menuCategories: string[];
  updateTheme: (settings: Partial<Settings>) => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colors, setColors] = useState<BrandingColors>(DEFAULT_COLORS);
  const [logo, setLogo] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [menuCategories, setMenuCategories] = useState<string[]>(DEFAULT_MENU_CATEGORIES);

  const applySettings = (settings: Partial<Settings>) => {
    if (settings.colors) {
      setColors(settings.colors);
    }
    if (settings.logo !== undefined) {
      setLogo(settings.logo ?? null);
    }
    if (settings.restaurantName) {
      setRestaurantName(settings.restaurantName);
    }
    if (settings.menuCategories && settings.menuCategories.length > 0) {
      setMenuCategories(settings.menuCategories);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const data = await settingsService.get();
        if (!isMounted) return;
        applySettings(data);
      } catch (error) {
        console.error('Failed to load branding settings', error);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateTheme = (settings: Partial<Settings>) => {
    applySettings(settings);
  };

  const refreshTheme = async () => {
    const latest = await settingsService.get();
    applySettings(latest);
  };

  return (
    <ThemeContext.Provider
      value={{ colors, logo, restaurantName, menuCategories, updateTheme, refreshTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
