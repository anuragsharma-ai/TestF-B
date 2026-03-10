import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScanLine, Package, MapPin, Camera, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertTriangle, PlusCircle } from 'lucide-react';
import { mockAssets } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import LocationHierarchySelector from '@/components/LocationHierarchySelector';
import { LocationPath } from '@/types';

type Step = 'scan' | 'details' | 'location' | 'photo' | 'confirm' | 'success' | 'not_found' | 'add_asset';

export default function ReconciliationPage() {
  const [step, setStep] = useState<Step>('scan');
  const [code, setCode] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<typeof mockAssets[0] | null>(null);
  const [locationPath, setLocationPath] = useState<LocationPath>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isThirdParty = user?.role === 'third_party';

  // New asset form fields (third-party)
  const [newAssetName, setNewAssetName] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newAssetType, setNewAssetType] = useState('');

  const steps: Step[] = ['scan', 'details', 'location', 'photo', 'confirm', 'success'];
  const currentIndex = steps.indexOf(step);

  const handleSearch = () => {
    const asset = mockAssets.find((a) => a.assetId === code || a.tagNumber === code || a.serialNumber === code);
    if (asset) {
      setSelectedAsset(asset);
      setStep('details');
    } else {
      if (isThirdParty) {
        setStep('not_found');
      } else {
        toast({ title: 'Not Found', description: 'No asset matches that code.', variant: 'destructive' });
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setStep('success');
  };

  const handleSubmitNewAsset = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    toast({
      title: 'Asset Submitted for Approval',
      description: 'A temporary reference ID has been generated. Admin will review.',
    });
    setStep('success');
  };

  const resetFlow = () => {
    setStep('scan');
    setCode('');
    setSelectedAsset(null);
    setLocationPath({});
    setNotes('');
    setNewAssetName('');
    setNewSerialNumber('');
    setNewAssetType('');
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{isThirdParty ? 'Verify / Add Asset' : 'Reconciliation'}</h1>

      {step !== 'success' && step !== 'not_found' && step !== 'add_asset' && (
        <div className="flex items-center gap-1 mb-4">
          {steps.slice(0, -1).map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`h-1.5 w-full rounded-full ${i <= currentIndex ? 'bg-accent' : 'bg-muted'}`} />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'scan' && (
          <motion.div key="scan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-6 space-y-4 text-center">
                <ScanLine className="h-16 w-16 mx-auto text-accent" />
                <div>
                  <h2 className="text-lg font-semibold">Step 1: Scan Asset</h2>
                  <p className="text-sm text-muted-foreground">Scan the barcode or enter the asset ID</p>
                </div>
                <Input
                  placeholder="Enter Asset ID, Tag, or Serial #"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12 text-base text-center"
                />
                <Button onClick={handleSearch} className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <ScanLine className="mr-2 h-4 w-4" /> Find Asset
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/scan')}>
                  <Camera className="mr-2 h-4 w-4" /> Use Camera Scanner
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'not_found' && (
          <motion.div key="not_found" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-6 space-y-4 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto text-warning" />
                <div>
                  <h2 className="text-lg font-semibold">Asset Not Found</h2>
                  <p className="text-sm text-muted-foreground">No asset found for code: <span className="font-mono font-bold">{code}</span></p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setStep('add_asset')} className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Asset Entry
                  </Button>
                  <Button variant="outline" onClick={resetFlow} className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Try Another Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'add_asset' && (
          <motion.div key="add_asset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <PlusCircle className="h-12 w-12 mx-auto text-accent mb-2" />
                  <h2 className="text-lg font-semibold">Add New Asset</h2>
                  <p className="text-sm text-muted-foreground">This will be submitted for admin approval</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Asset Name <span className="text-xs text-muted-foreground">(if known)</span></Label>
                    <Input placeholder="e.g. HP Printer" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Serial Number <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <Input placeholder="e.g. SN-123456" value={newSerialNumber} onChange={(e) => setNewSerialNumber(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Asset Type <span className="text-destructive">*</span></Label>
                    <Select value={newAssetType} onValueChange={setNewAssetType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {['Computer', 'Furniture', 'Vehicle', 'Networking', 'Security', 'Office Equipment', 'ATM', 'Safe Deposit'].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Location <span className="text-destructive">*</span></Label>
                    <LocationHierarchySelector value={locationPath} onChange={setLocationPath} />
                  </div>

                  <div className="space-y-1">
                    <Label>Photo <span className="text-destructive">*</span></Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Tap to take photo (mandatory)</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Remarks</Label>
                    <Textarea placeholder="Any observations about the asset..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('not_found')} className="flex-1">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={handleSubmitNewAsset}
                    disabled={!newAssetType || Object.keys(locationPath).length === 0 || isSubmitting}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Submit for Approval
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'details' && selectedAsset && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-accent mb-2" />
                  <h2 className="text-lg font-semibold">Step 2: Verify Details</h2>
                </div>
                <div className="space-y-2 bg-muted rounded-lg p-4 text-sm">
                  {[
                    ['Asset ID', selectedAsset.assetId],
                    ['Name', selectedAsset.name],
                    ['Serial', selectedAsset.serialNumber],
                    ['Category', selectedAsset.category],
                    ...(isThirdParty ? [] : [['Assigned To', selectedAsset.assignedToName]]),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                  {selectedAsset.locationBreadcrumb && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Location:</p>
                      <p className="text-xs font-medium leading-relaxed">{selectedAsset.locationBreadcrumb}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('scan')} className="flex-1"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep('location')} className="flex-1">Confirm <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'location' && (
          <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto text-accent mb-2" />
                  <h2 className="text-lg font-semibold">Step 3: Confirm Location</h2>
                  <p className="text-sm text-muted-foreground">Select the asset's current location</p>
                </div>
                <LocationHierarchySelector value={locationPath} onChange={setLocationPath} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('details')} className="flex-1"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep('photo')} disabled={Object.keys(locationPath).length === 0} className="flex-1">Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'photo' && (
          <motion.div key="photo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-accent mb-2" />
                  <h2 className="text-lg font-semibold">Step 4: Upload Photo</h2>
                  <p className="text-sm text-muted-foreground">Take a photo of the asset for verification</p>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tap to take photo or upload</p>
                </div>
                <Label>Notes (optional)</Label>
                <Textarea placeholder="Any observations..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('location')} className="flex-1"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep('confirm')} className="flex-1">Review <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'confirm' && selectedAsset && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-center">Step 5: Confirm Submission</h2>
                <div className="space-y-2 bg-muted rounded-lg p-4 text-sm">
                  {[
                    ['Asset', selectedAsset.name],
                    ['ID', selectedAsset.assetId],
                    ['Photo', 'Uploaded ✓'],
                    ['Notes', notes || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('photo')} className="flex-1"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-success hover:bg-success/90 text-success-foreground">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-10 w-10 text-success animate-check-bounce" />
                </div>
                <h2 className="text-xl font-bold">
                  {isThirdParty && !selectedAsset ? 'Submission Sent!' : 'Verification Complete!'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isThirdParty && !selectedAsset
                    ? 'Your new asset entry has been submitted for admin approval.'
                    : 'Asset has been successfully reconciled.'}
                </p>
                {isThirdParty && !selectedAsset && (
                  <div className="rounded-lg bg-muted p-3 text-xs">
                    <p className="font-medium">Temp Reference: <span className="font-mono">TEMP-REF-{String(Math.floor(Math.random() * 9999)).padStart(4, '0')}</span></p>
                    <p className="text-muted-foreground mt-1">Status: Pending Verification</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFlow} className="flex-1">
                    {isThirdParty ? 'Scan Another' : 'Verify Another'}
                  </Button>
                  <Button onClick={() => navigate(isThirdParty ? '/submissions' : '/')} className="flex-1">
                    {isThirdParty ? 'My Submissions' : 'Dashboard'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
