
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import Papa from "papaparse";

interface BulkRegistrationProps {
  onUpload: (players: any[]) => Promise<void>;
}

export const BulkRegistrationForm: React.FC<BulkRegistrationProps> = ({ onUpload }) => {
  const [error, setError] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          await onUpload(results.data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to process file");
        }
      },
      error: (err) => {
        setError(err.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bulk Player Registration</h3>
          <p className="text-sm text-muted-foreground">Upload CSV file with player details</p>
        </div>
      </div>
      
      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-muted-foreground">CSV files only (max 10MB)</p>
          </div>
        </label>
      </div>
      
      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}
      
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => window.open("/template.csv")}>
          Download Template
        </Button>
      </div>
    </div>
  );
};
