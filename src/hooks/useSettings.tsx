
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserSettings } from '@/types';

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        setSettings(null);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
};
