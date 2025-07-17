
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSettings {
  id?: string;
  user_id: string;
  daily_reminders: boolean;
  reminder_time: string;
  trigger_alerts: boolean;
  data_sharing: boolean;
  youtube_url?: string;
  website_url?: string;
  created_at?: string;
  updated_at?: string;
}

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
      console.log('Fetching settings for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          console.log('No settings found, creating defaults');
          await createDefaultSettings();
        } else {
          setSettings(null);
        }
      } else {
        console.log('Settings fetched successfully:', data);
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const defaultSettings = {
        user_id: user.id,
        daily_reminders: true,
        reminder_time: '08:00',
        trigger_alerts: true,
        data_sharing: false,
        youtube_url: null,
        website_url: null
      };

      const { data, error } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error('Error creating default settings:', error);
      } else {
        console.log('Default settings created:', data);
        setSettings(data);
      }
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) {
      console.error('No user found for settings update');
      return false;
    }

    try {
      console.log('Updating settings with:', updates);

      // First check if settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;

      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .from('user_settings')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new settings
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            daily_reminders: true,
            reminder_time: '08:00',
            trigger_alerts: true,
            data_sharing: false,
            ...updates
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error updating settings:', result.error);
        throw result.error;
      }

      console.log('Settings updated successfully:', result.data);
      setSettings(result.data);
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
