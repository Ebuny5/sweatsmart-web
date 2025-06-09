
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Download, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const DataManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleClearAllData = async () => {
    if (!user) return;
    
    setIsClearing(true);
    try {
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Data Cleared",
        description: "All your episode data has been successfully cleared.",
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = ['Date', 'Time', 'Severity', 'Body Areas', 'Triggers', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...data.map(episode => {
        const date = new Date(episode.date).toLocaleDateString();
        const time = new Date(episode.date).toLocaleTimeString();
        const severity = episode.severity || 'Not specified';
        const bodyAreas = Array.isArray(episode.body_areas) ? episode.body_areas.join('; ') : 'Not specified';
        const triggers = Array.isArray(episode.triggers) ? 
          episode.triggers.map((t: any) => {
            if (typeof t === 'string') {
              try {
                const parsed = JSON.parse(t);
                return parsed.label || parsed.value || t;
              } catch {
                return t;
              }
            }
            return t.label || t.value || 'Unknown trigger';
          }).join('; ') : 'Not specified';
        const notes = episode.notes || '';

        // Escape commas and quotes in CSV
        const escapeCSV = (field: string) => {
          if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };

        return [date, time, severity, escapeCSV(bodyAreas), escapeCSV(triggers), escapeCSV(notes)].join(',');
      })
    ].join('\n');

    return csvContent;
  };

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "You don't have any episodes to export yet.",
          variant: "destructive",
        });
        return;
      }

      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = `sweatsmart-episodes-${new Date().toISOString().split('T')[0]}.csv`;

      // Check if we're on mobile and can use native sharing
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'text/csv' });
        
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'SweatSmart Episode Data',
              text: 'Your exported SweatSmart episode data',
              files: [file]
            });
            
            toast({
              title: "Data Exported",
              description: "Your data has been shared successfully.",
            });
            return;
          } catch (shareError) {
            console.log('Share was cancelled or failed:', shareError);
            // Fall back to download if share is cancelled
          }
        }
      }

      // Fallback to traditional download for desktop or if sharing fails
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your data has been downloaded as a CSV file.",
      });

    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Data Management
        </CardTitle>
        <CardDescription>
          Manage your SweatSmart data - export or clear your episode history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export My Data"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Clear All Episode Data
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your episode data, including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All logged episodes</li>
                    <li>Episode insights and recommendations</li>
                    <li>Trigger and body area data</li>
                    <li>Historical trends and patterns</li>
                  </ul>
                  <br />
                  Consider exporting your data first if you want to keep a backup.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAllData}
                  disabled={isClearing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isClearing ? "Clearing..." : "Clear All Data"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Important Note</p>
              <p className="text-amber-700">
                Clearing your data will reset all analytics, trends, and insights. This action is irreversible.
                We recommend exporting your data first as a backup.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagement;
