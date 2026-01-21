import { offlineManager } from '@/lib/offline/OfflineManager';
import { pilotConfig } from '@/lib/pilot/PilotConfig';

interface BackupData {
  timestamp: number;
  version: string;
  data: Record<string, any>;
}

class BackupManager {
  private static readonly BACKUP_PREFIX = 'courtmaster-backup-';

  constructor() {
    this.initAutomatedBackups();
  }

  private initAutomatedBackups() {
    const backupConfig = pilotConfig.getConfig().backup;
    if (backupConfig.autoBackup) {
      setInterval(() => {
        this.createBackup('auto');
      }, backupConfig.backupFrequency * 60 * 60 * 1000);
    }
  }

  public async createBackup(type: 'auto' | 'manual'): Promise<string | null> {
    try {
      const allData = await offlineManager.getAllData();
      const backup: BackupData = {
        timestamp: Date.now(),
        version: '1.0.0', // This could come from package.json
        data: allData,
      };

      // TODO: Implement compression to save space
      const backupString = JSON.stringify(backup);
      const backupName = `${BackupManager.BACKUP_PREFIX}${type}-${Date.now()}.json`;
      
      localStorage.setItem(backupName, backupString);
      console.log(`Backup created: ${backupName}`);

      this.cleanupOldBackups();
      return backupName;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  public async restoreFromBackup(backupName: string): Promise<boolean> {
    try {
      const backupString = localStorage.getItem(backupName);
      if (!backupString) throw new Error('Backup not found');

      const backup: BackupData = JSON.parse(backupString);

      // TODO: Add more robust validation here
      if (!backup.timestamp || !backup.data) {
        throw new Error('Invalid backup file');
      }

      await offlineManager.clearOfflineData();

      for (const [collection, data] of Object.entries(backup.data)) {
        await offlineManager.storeData(collection, data);
      }

      console.log(`Restored from backup: ${backupName}`);
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  public listBackups(): string[] {
    return Object.keys(localStorage).filter(key => key.startsWith(BackupManager.BACKUP_PREFIX));
  }

  public async exportData(format: 'json' | 'csv' = 'json'): Promise<void> {
    const allData = await offlineManager.getAllData();
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      this.downloadBlob(blob, `courtmaster-export-${Date.now()}.json`);
    } else {
      // TODO: Implement CSV export
      console.warn('CSV export is not yet implemented.');
    }
  }

  private cleanupOldBackups() {
    const backupConfig = pilotConfig.getConfig().backup;
    const backups = this.listBackups();
    const cutoff = Date.now() - (backupConfig.backupRetentionDays * 24 * 60 * 60 * 1000);

    backups.forEach(backupName => {
      const timestamp = parseInt(backupName.split('-').pop()?.replace('.json', '') || '0', 10);
      if (timestamp < cutoff) {
        localStorage.removeItem(backupName);
        console.log(`Deleted old backup: ${backupName}`);
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Add a method to OfflineManager to get all data
(offlineManager as any).getAllData = async function() {
  if (!this.db) return {};
  const allData: Record<string, any> = {};
  const collections = ['tournaments', 'teams', 'matches', 'registrations', 'pilot-config'];
  for (const collection of collections) {
    allData[collection] = await this.getData(collection);
  }
  return allData;
};

export const backupManager = new BackupManager();
