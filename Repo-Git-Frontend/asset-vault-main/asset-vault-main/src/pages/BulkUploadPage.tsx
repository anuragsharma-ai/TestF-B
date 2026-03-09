import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

interface UploadPreview {
  headers: string[];
  rows: string[][];
  errors: { row: number; message: string }[];
}

export default function BulkUploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<UploadPreview | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // Mock preview
    setPreview({
      headers: ['Asset ID', 'Serial Number', 'Tag Number', 'Name', 'Category', 'Location'],
      rows: [
        ['BANK-000281', 'SN-100001', 'TAG-00281', 'Dell Monitor 24"', 'Computer', 'Mumbai'],
        ['BANK-000282', 'SN-100002', 'TAG-00282', 'Office Chair', 'Furniture', 'Delhi'],
        ['BANK-000283', '', 'TAG-00283', 'HP Printer', 'Office Equipment', 'Mumbai'],
        ['BANK-000284', 'SN-100004', 'TAG-00284', 'Cisco Router', 'Networking', 'Bangalore'],
      ],
      errors: [{ row: 3, message: 'Missing Serial Number' }],
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(API_ENDPOINTS.assets.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const pct = Math.round((event.loaded / event.total) * 100);
          setProgress(pct);
        },
      });
      toast({ title: 'Upload Complete', description: 'File uploaded successfully.' });
    } catch {
      toast({ title: 'Upload Failed', description: 'Unable to upload file.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-bold">Bulk Asset Upload</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Upload CSV/Excel File</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-medium">{file.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">Click to upload CSV or Excel file</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum 10,000 rows per upload</p>
              </>
            )}
          </div>
          <input id="file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />

          <Button variant="outline" size="sm">Download Template</Button>
        </CardContent>
      </Card>

      {preview && (
        <>
          {preview.errors.length > 0 && (
            <Card className="border-warning/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-warning mb-2">
                  <AlertTriangle className="h-4 w-4" /> {preview.errors.length} validation error(s)
                </div>
                {preview.errors.map((err) => (
                  <p key={err.row} className="text-xs text-muted-foreground">Row {err.row}: {err.message}</p>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Preview ({preview.rows.length} rows)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      {preview.headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row, i) => {
                      const hasError = preview.errors.some((e) => e.row === i + 1);
                      return (
                        <TableRow key={i} className={hasError ? 'bg-destructive/5' : ''}>
                          <TableCell className="text-xs">{i + 1}</TableCell>
                          {row.map((cell, j) => (
                            <TableCell key={j} className={`text-xs ${!cell ? 'text-destructive' : ''}`}>{cell || '—'}</TableCell>
                          ))}
                          <TableCell>
                            {hasError ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {uploading && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Uploading assets...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          )}

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : `Upload ${preview.rows.length - preview.errors.length} Valid Assets`}
          </Button>
        </>
      )}
    </div>
  );
}
