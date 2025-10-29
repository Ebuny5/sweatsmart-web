 import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import ClimateSettings from "@/components/settings/ClimateSettings";

const Settings = () => {
  // You'll need to get the actual userId from your auth context
  const userId = "user-id-here"; // Replace with actual user ID

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <ClimateSettings userId={userId} />
      </div>
    </AppLayout>
  );
};

export default Settings;
