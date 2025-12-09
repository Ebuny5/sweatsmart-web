
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProcessedEpisode, SeverityLevel, BodyArea } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useEpisodes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [episodes, setEpisodes] = useState<ProcessedEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setEpisodes([]);
      return;
    }

    try {
      setError(null);
      console.log('Fetching episodes for user:', user.id);
      
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching episodes:', error);
        throw error;
      }

      console.log('Raw episodes data:', data);

      const processedEpisodes: ProcessedEpisode[] = (data || []).map(ep => {
        try {
          let parsedTriggers = [];
          if (ep.triggers && Array.isArray(ep.triggers)) {
            parsedTriggers = ep.triggers.map((t: any) => {
              if (typeof t === 'string') {
                try {
                  const parsed = JSON.parse(t);
                  return {
                    type: parsed.type || 'environmental',
                    value: parsed.value || t,
                    label: parsed.label || parsed.value || t
                  };
                } catch {
                  return {
                    type: 'environmental',
                    value: t,
                    label: t
                  };
                }
              }
              return {
                type: t?.type || 'environmental',
                value: t?.value || 'Unknown',
                label: t?.label || t?.value || 'Unknown'
              };
            });
          }

          // Validate and parse dates with fallback to created_at
          const episodeDate = ep.date || ep.created_at;
          const parsedDate = new Date(episodeDate);
          const parsedCreatedAt = new Date(ep.created_at);
          
          // Check if dates are valid
          if (isNaN(parsedDate.getTime())) {
            console.warn(`Invalid date for episode ${ep.id}:`, ep.date);
            throw new Error('Invalid episode date');
          }

          return {
            id: ep.id,
            date: episodeDate,
            datetime: parsedDate,
            severity: ep.severity as SeverityLevel,
            severityLevel: ep.severity as SeverityLevel,
            body_areas: (ep.body_areas || []) as BodyArea[],
            bodyAreas: (ep.body_areas || []) as BodyArea[],
            triggers: parsedTriggers,
            notes: ep.notes || undefined,
            created_at: ep.created_at,
            createdAt: isNaN(parsedCreatedAt.getTime()) ? parsedDate : parsedCreatedAt,
            updated_at: ep.updated_at,
            userId: ep.user_id,
          };
        } catch (error) {
          console.error('Error processing episode:', ep.id, error);
          // Use created_at as fallback for datetime, but ensure we always end up with a valid Date
          let fallbackDate = ep.created_at ? new Date(ep.created_at) : new Date();
          if (isNaN(fallbackDate.getTime())) {
            fallbackDate = new Date();
          }
          
          return {
            id: ep.id,
            date: ep.date || ep.created_at,
            datetime: fallbackDate,
            severity: ep.severity as SeverityLevel,
            severityLevel: ep.severity as SeverityLevel,
            body_areas: (ep.body_areas || []) as BodyArea[],
            bodyAreas: (ep.body_areas || []) as BodyArea[],
            triggers: [],
            notes: ep.notes || undefined,
            created_at: ep.created_at,
            createdAt: fallbackDate,
            updated_at: ep.updated_at,
            userId: ep.user_id,
          };
        }
      });

      setEpisodes(processedEpisodes);
      console.log('Processed episodes:', processedEpisodes.length);
    } catch (error) {
      console.error('Failed to fetch episodes:', error);
      setError('Failed to load episodes');
      setEpisodes([]);
      toast({
        title: "Error loading episodes",
        description: "Please refresh the page to try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  return { episodes, loading, error, refetch: fetchEpisodes };
};
