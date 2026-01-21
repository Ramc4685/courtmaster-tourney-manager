import React, { useState, useEffect, useCallback } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Server, Wifi, WifiOff, Database, Cloud, AlertTriangle } from 'lucide-react';

const HealthCheck: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<Record<string, { status: string; details: any }>>({
    web: { status: 'pending', details: {} },
    appwrite: { status: 'pending', details: {} },
    worker: { status: 'pending', details: {} },
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const { 
    isOnline, 
    pendingStats, 
    conflicts, 
    syncNow, 
    clearPendingActions, 
    storageInfo, 
    lastSyncTime 
  } = useOfflineSync({ entityType: 'health', collectionId: 'health' });

  const checkServiceHealth = useCallback(async () => {
    const newErrors: string[] = [];
    const check = async (name: string, url: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) throw new Error(`Status: ${response.status}`);

          // Check content type and handle accordingly
          const contentType = response.headers.get('content-type');
          let data;

          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else {
            // Handle HTML or plain text responses
            const text = await response.text();
            data = { status: 'healthy', message: text.slice(0, 100) }; // Truncate long responses
          }

          return { status: 'healthy', details: data };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error: any) {
        newErrors.push(`${name}: ${error.message}`);
        return { status: 'unhealthy', details: { error: error.message } };
      }
    };

    const [web, appwrite, worker] = await Promise.all([
      check('Web', '/health'),
      check('Appwrite', `${import.meta.env.VITE_APPWRITE_ENDPOINT}/health`),
      check('Worker', `${import.meta.env.VITE_WORKER_URL}/health`),
    ]);

    setServiceStatus({ web, appwrite, worker });
    setErrors(newErrors);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [checkServiceHealth]);

  const handleManualSync = async () => {
    try {
      await syncNow();
    } catch (error: any) {
      setErrors(prev => [...prev, `Manual Sync Failed: ${error.message}`]);
    }
  };

  const handleExportDiagnostics = () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      serviceStatus,
      isOnline,
      pendingStats,
      conflicts,
      storageInfo,
      lastSyncTime,
      errors,
    };
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courtmaster-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = (status: string) => (
    <Badge variant={status === 'healthy' ? 'default' : 'destructive'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>System Health Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Service Status */}
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Server className="mr-2" />Service Status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(serviceStatus).map(([name, s]) => (
                <div key={name} className="flex justify-between items-center">
                  <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                  {renderStatusBadge(s.status)}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Offline Sync Status */}
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Cloud className="mr-2" />Offline Sync</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Pending Operations:</span> <Badge>{pendingStats.total}</Badge></div>
              <div className="flex justify-between"><span>Conflicts:</span> <Badge variant={conflicts.length > 0 ? 'destructive' : 'default'}>{conflicts.length}</Badge></div>
              <div className="flex justify-between"><span>Last Sync:</span> <span>{lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}</span></div>
            </CardContent>
          </Card>

          {/* Network & Storage */}
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Database className="mr-2" />Connectivity & Storage</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Network:</span>
                <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center">
                  {isOnline ? <Wifi className="mr-1" /> : <WifiOff className="mr-1" />} {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div>
                <span>Local Storage:</span>
                <Progress value={(storageInfo.used / storageInfo.available) * 100} className="mt-1" />
                <p className="text-sm text-muted-foreground">
                  {`${~~(storageInfo.used / 1024 / 1024)}MB / ${~~(storageInfo.available / 1024 / 1024)}MB`}
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Manual Actions */}
      <Card>
        <CardHeader><CardTitle>Manual Actions</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleManualSync} disabled={!isOnline}>Sync Now</Button>
          <Button onClick={clearPendingActions} variant="destructive">Clear Queue</Button>
          <Button onClick={checkServiceHealth}>Refresh Status</Button>
          <Button onClick={handleExportDiagnostics} variant="outline">Export Diagnostics</Button>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground text-center">
        Last checked: {lastChecked ? lastChecked.toLocaleString() : 'Never'}
      </p>
    </div>
  );
};

export default HealthCheck;
