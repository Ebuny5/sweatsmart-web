import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // If we got data or a non-network error, return immediately
      if (result.data || (result.error && !isNetworkError(result.error))) {
        return result;
      }
      
      // If it's a network error and we have retries left, continue
      if (attempt < maxRetries && result.error && isNetworkError(result.error)) {
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      if (attempt < maxRetries) {
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'UNEXPECTED_ERROR',
          details: '',
          hint: ''
        } as PostgrestError
      };
    }
  }
  
  return {
    data: null,
    error: {
      message: 'Max retries exceeded',
      code: 'MAX_RETRIES_EXCEEDED',
      details: '',
      hint: ''
    } as PostgrestError
  };
}

function isNetworkError(error: PostgrestError): boolean {
  return error.message.includes('Failed to fetch') || 
         error.message.includes('Network') ||
         error.message.includes('Connection') ||
         error.code === 'PGRST301';
}

// Robust episode fetcher
export async function fetchEpisodesWithRetry(userId: string) {
  return withRetry(async () => {
    const result = await supabase
      .from('episodes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    return result;
  });
}

// Robust profile fetcher
export async function fetchProfileWithRetry(userId: string) {
  return withRetry(async () => {
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return result;
  });
}

// Robust settings fetcher
export async function fetchSettingsWithRetry(userId: string) {
  return withRetry(async () => {
    const result = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return result;
  });
}

// Robust settings updater
export async function updateSettingsWithRetry(userId: string, updates: any) {
  return withRetry(async () => {
    const result = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...updates,
      });
    return result;
  });
}