import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Keyboard, QrCode, Printer, ScanLine, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { mockAssets } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

export default function ScanPage() {
  const [tab, setTab] = useState('scan');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);
  const [cameraError, setCameraError] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [generateId, setGenerateId] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const safeStop = async () => {
    if (scanningRef.current && html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
      } catch {
        // scanner already stopped, ignore
      }
      scanningRef.current = false;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setCameraError('');
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('scanner-region');
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
          safeStop();
        },
        () => {}
      );
      scanningRef.current = true;
    } catch (err: any) {
      setCameraError(err?.message || 'Camera access denied. Please allow camera permissions.');
      setScanning(false);
      scanningRef.current = false;
    }
  };

  const stopScanner = () => {
    safeStop();
  };

  useEffect(() => {
    return () => { safeStop(); };
  }, []);

  const handleScanResult = (code: string) => {
    const asset = mockAssets.find((a) => a.assetId === code || a.tagNumber === code || a.serialNumber === code || a.id === code);
    if (asset) {
      toast({ title: 'Asset Found!', description: asset.name });
      navigate(`/assets/${asset.id}`);
    } else {
      toast({ title: 'Asset Not Found', description: `No asset found for code: ${code}`, variant: 'destructive' });
    }
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) handleScanResult(manualCode.trim());
  };

  const handleGenerateQr = () => {
    if (!generateId.trim()) return;
    setQrValue(generateId.trim());
    setQrDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold md:text-2xl">Scan & QR</h1>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); stopScanner(); }}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="scan"><Camera className="mr-1 h-4 w-4" /> Scan</TabsTrigger>
          <TabsTrigger value="manual"><Keyboard className="mr-1 h-4 w-4" /> Manual</TabsTrigger>
          <TabsTrigger value="generate"><QrCode className="mr-1 h-4 w-4" /> Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div
                id="scanner-region"
                ref={scannerRef}
                className="mx-auto aspect-square max-w-sm rounded-lg bg-muted overflow-hidden"
              >
                {!scanning && !cameraError && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ScanLine className="h-16 w-16 mb-3 opacity-30" />
                    <p className="text-sm">Tap to start scanning</p>
                  </div>
                )}
              </div>
              {cameraError && (
                <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{cameraError}</span>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                {!scanning ? (
                  <Button onClick={startScanner} className="flex-1 h-14 text-base bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Camera className="mr-2 h-5 w-5" /> Start Scanning
                  </Button>
                ) : (
                  <Button onClick={stopScanner} variant="destructive" className="flex-1 h-14 text-base">
                    Stop Scanner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Enter Code Manually</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Enter the asset ID, serial number, or tag number</p>
              <Input
                placeholder="e.g. BANK-000001 or TAG-00001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                className="h-12 text-base"
              />
              <Button onClick={handleManualSearch} className="w-full h-12">
                Search Asset
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Generate QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Enter an asset ID to generate its QR code</p>
              <Input
                placeholder="e.g. BANK-000001"
                value={generateId}
                onChange={(e) => setGenerateId(e.target.value)}
                className="h-12"
              />
              <Button onClick={handleGenerateQr} className="w-full h-12">
                <QrCode className="mr-2 h-4 w-4" /> Generate QR
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>QR Code for {qrValue}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-card p-4 rounded-lg border">
              <QRCodeSVG value={qrValue} size={200} />
            </div>
            <p className="text-sm text-muted-foreground font-mono">{qrValue}</p>
            <Button className="w-full" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
