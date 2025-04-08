
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
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
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => window.open("/template.csv")}>
          Download Template
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}
    </div>
  );
};
