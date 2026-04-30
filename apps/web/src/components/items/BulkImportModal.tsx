'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface BulkImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a valid CSV file.');
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    setParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5)); // Show first 5 rows
        setParsing(false);
      },
      error: (err) => {
        setError('Failed to parse CSV: ' + err.message);
        setParsing(false);
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ['name', 'sku', 'hsn_sac', 'unit', 'rate', 'igst_rate', 'description'];
    const csvContent = headers.join(',') + '\n' + 
      'Sample Product,SKU001,8471,Nos,15000,18,High performance laptop';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'item_master_template.csv';
    a.click();
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          if (!session) throw new Error('Not authenticated');

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/items/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(results.data)
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to import items');
          }

          onSuccess();
          onClose();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setImporting(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bulk Import Items</h2>
              <p className="text-xs text-slate-500 font-medium">Upload CSV to populate your item master</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
              />
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-lg font-bold text-slate-900">Drop your CSV here</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse from your computer</p>
              <div className="mt-8 flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <div>
                    <p className="text-sm font-bold text-indigo-900">{file.name}</p>
                    <p className="text-xs text-indigo-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setPreview([]); }}
                  className="p-2 hover:bg-indigo-100 rounded-full transition-colors text-indigo-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview (First 5 rows)</p>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          {Object.keys(preview[0]).slice(0, 4).map(h => (
                            <th key={h} className="px-4 py-2 font-bold text-slate-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0">
                            {Object.values(row).slice(0, 4).map((v: any, j) => (
                              <td key={j} className="px-4 py-2 text-slate-500">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
          <Button variant="outline" onClick={onClose} disabled={importing}>Cancel</Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || importing || parsing}
            className="px-8 min-w-[140px]"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Importing...
              </>
            ) : (
              'Start Import'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
