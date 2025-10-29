import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ClimateSettings from "@/components/settings/ClimateSettings";
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // This automatically gets the logged-in user's ID
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  if (!userId) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div>Please log in to access climate settings</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <ClimateSettings userId={userId} />
      </div>
    </AppLayout>
  );
};

export default Settings;
