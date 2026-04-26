import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface Settings {
  business_name: string;
  nit: string;
  currency: string;
  currency_locale: string;
  address: string;
  phone: string;
  low_stock_alert: string;
  daily_summary_email: string;
}

interface ConfigContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    business_name: 'Henry SAS',
    nit: '',
    currency: 'COP',
    currency_locale: 'es-CO',
    address: '',
    phone: '',
    low_stock_alert: '5',
    daily_summary_email: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      console.error('Error loading settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      await api.post('/settings', newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating settings', error);
      throw error;
    }
  };

  return (
    <ConfigContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within a ConfigProvider');
  return context;
};
