import { useState } from 'react';
import { toast } from 'sonner';
import { exportData, importData } from '../api';

const DataImportExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportData();
      
      // Convert to string for download
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      link.download = `fitness-tracker-backup-${dateStr}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      
      // Read file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Confirm import
          if (window.confirm(`Are you sure you want to import this data? This will replace all your current data.`)) {
            await importData(data);
            toast.success('Data imported successfully');
            // Reload the page to show the imported data
            window.location.reload();
          }
        } catch (parseError) {
          console.error('Parse error:', parseError);
          toast.error('Invalid backup file');
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsImporting(false);
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import data');
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Backup and Restore</h2>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Export Data'}
        </button>
        
        <div className="relative">
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            className="hidden"
          />
          <label
            htmlFor="import-file"
            className={`inline-block bg-secondary text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isImporting ? 'Importing...' : 'Import Data'}
          </label>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Export:</strong> Download a backup file of all your fitness data.</p>
        <p><strong>Import:</strong> Restore your data from a previous backup file.</p>
        <p className="mt-2 text-orange-600">⚠️ Warning: Importing data will replace all your current data.</p>
      </div>
    </div>
  );
};

export default DataImportExport;