import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Sparkles } from "lucide-react";

const SetupProfile = () => {
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed || !user) return;

    setIsLoading(true);
    try {
      // Update the profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed })
        .eq("user_id", user.id);

      if (error) {
        // Profile might not exist yet (race condition), try upsert
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({ user_id: user.id, display_name: trimmed }, { onConflict: "user_id" });

        if (upsertError) throw upsertError;
      }

      // Also update auth metadata so it persists
      await supabase.auth.updateUser({
        data: { display_name: trimmed },
      });

      toast({
        title: "Welcome, " + trimmed + "! 🎉",
        description: "Your warrior profile is ready. Let's start your journey!",
      });
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout isAuthenticated={false}>
      <div className="flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg shadow-purple-200">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black">Welcome, Warrior! 💧</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              What should we call you? This name will appear on your Warrior Badge, 
              dashboard greetings, and throughout your SweatSmart journey.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-semibold">
                  Your name or nickname
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="e.g. Lafidot, Sarah, Dr. Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                    maxLength={50}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You can change this later in Settings → Profile.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-bold py-3"
                disabled={isLoading || !displayName.trim()}
              >
                {isLoading ? "Saving..." : "Continue to SweatSmart →"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SetupProfile;
