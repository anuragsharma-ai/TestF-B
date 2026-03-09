import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TEMPLATE_HEADERS = [
  'Entity', 'Asset ID', 'Serial Number', 'Sub Number', 'Tag Number', 'Asset Class',
  'Asset Type', 'Sub Asset Type', 'Cost Center', 'Int. Order', 'Supplier', 'Currency',
  'Purchase Value', 'Useful Life', 'Useful Life in Periods', 'Capitalized On',
  'Asset Description', 'Location', 'Sub Location',
  'APC FY Start', 'Acquisition', 'Retirement', 'Transfer', 'Post-Capital.', 'Current APC',
  'Dep. FY Start', 'Dep. for Year', 'Dep. Retirement', 'Dep. Transfer', 'Write-ups',
  'Dep. Post-Cap.', 'Accumulated Dep.', 'Bk. Val. FY Start', 'Current Book Value', 'Deactivation On',
  'WFH UID', 'WFH User Name', 'WFH User Email', 'WFH Location',
];

// Show a subset in the preview table for readability
const PREVIEW_COLUMNS = ['Entity', 'Asset ID', 'Serial Number', 'Asset Type', 'Sub Asset Type', 'Location', 'Sub Location'];

interface UploadPreview {
  rows: Record<string, string>[];
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
    setPreview({
      rows: [
        { Entity: 'Admin Entity', 'Asset ID': 'BANK-000281', 'Serial Number': 'SN-100001', 'Asset Type': 'Computer', 'Sub Asset Type': 'Desktop', Location: 'Mumbai', 'Sub Location': 'Server Room' },
        { Entity: 'Operations', 'Asset ID': 'BANK-000282', 'Serial Number': 'SN-100002', 'Asset Type': 'Furniture', 'Sub Asset Type': 'Chair', Location: 'Delhi', 'Sub Location': 'Floor 2' },
        { Entity: 'Technology', 'Asset ID': 'BANK-000283', 'Serial Number': '', 'Asset Type': 'Office Equipment', 'Sub Asset Type': 'Printer', Location: 'Mumbai', 'Sub Location': '' },
        { Entity: 'Finance', 'Asset ID': 'BANK-000284', 'Serial Number': 'SN-100004', 'Asset Type': 'Networking', 'Sub Asset Type': 'Switch', Location: 'Bangalore', 'Sub Location': 'DC Wing' },
      ],
      errors: [{ row: 3, message: 'Missing Serial Number' }],
    });
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Template Downloaded', description: 'Fill in the CSV and upload it back.' });
  };

  const handleUpload = async () => {
    setUploading(true);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress(i);
    }
    setUploading(false);
    toast({ title: 'Upload Complete', description: `${(preview?.rows.length ?? 0) - (preview?.errors.length ?? 0)} assets uploaded. ${preview?.errors.length ?? 0} skipped.` });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-bold">Bulk Asset Upload</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Upload CSV / Excel File</CardTitle></CardHeader>
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
                <p className="text-xs text-muted-foreground mt-1">Template must match the Register Asset fields ({TEMPLATE_HEADERS.length} columns)</p>
              </>
            )}
          </div>
          <input id="file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />

          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template ({TEMPLATE_HEADERS.length} columns)
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <>
          {preview.errors.length > 0 && (
            <Card className="border-destructive/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
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
                      {PREVIEW_COLUMNS.map((h) => <TableHead key={h} className="text-xs">{h}</TableHead>)}
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row, i) => {
                      const hasError = preview.errors.some((e) => e.row === i + 1);
                      return (
                        <TableRow key={i} className={hasError ? 'bg-destructive/5' : ''}>
                          <TableCell className="text-xs">{i + 1}</TableCell>
                          {PREVIEW_COLUMNS.map((col) => (
                            <TableCell key={col} className={`text-xs ${!row[col] ? 'text-destructive' : ''}`}>{row[col] || '—'}</TableCell>
                          ))}
                          <TableCell>
                            {hasError ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
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
