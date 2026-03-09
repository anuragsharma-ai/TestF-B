import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import LocationHierarchySelector from '@/components/LocationHierarchySelector';
import { LocationPath } from '@/types';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

export default function AssetRegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationPath, setLocationPath] = useState<LocationPath>({});
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const assetId = String(formData.get('assetId') || '');
    const serialNumber = String(formData.get('serialNumber') || '');
    const tagNumber = String(formData.get('tagNumber') || '');
    const purchaseValueRaw = String(formData.get('purchaseValue') || '');
    const description = String(formData.get('description') || '');

    if (!assetId || !serialNumber || !tagNumber || !category) return;

    setIsSubmitting(true);
    try {
      await api.post(API_ENDPOINTS.assets.create, {
        assetId,
        serialNumber,
        tagNumber,
        name: description || assetId,
        description,
        category,
        purchaseValue: purchaseValueRaw ? Number(purchaseValueRaw) : null,
        locationBreadcrumb: Object.keys(locationPath).length > 0 ? JSON.stringify(locationPath) : '',
      });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset Registered', description: 'Asset has been successfully registered in the system.' });
      navigate('/assets');
    } catch {
      toast({
        title: 'Registration Failed',
        description: 'Unable to save asset. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-bold">Register New Asset</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Asset Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Asset ID
                  <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>Unique identifier for this asset</TooltipContent></Tooltip>
                </Label>
                <Input name="assetId" placeholder="e.g. BANK-000281" required />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Serial Number
                  <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>Usually found on a sticker on the device</TooltipContent></Tooltip>
                </Label>
                <Input name="serialNumber" placeholder="e.g. SN-123456" required />
              </div>
              <div className="space-y-2">
                <Label>Tag Number</Label>
                <Input name="tagNumber" placeholder="e.g. TAG-00281" required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {['Computer', 'Furniture', 'Vehicle', 'Networking', 'Security', 'Office Equipment', 'ATM', 'Safe Deposit'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Purchase Value (₹)</Label>
                <Input name="purchaseValue" type="number" placeholder="e.g. 50000" min={0} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location (Hierarchy)</Label>
              <LocationHierarchySelector value={locationPath} onChange={setLocationPath} />
            </div>

            <div className="space-y-2">
              <Label>Name / Description</Label>
              <Textarea name="description" placeholder="Brief description of the asset..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Asset Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <p className="text-sm text-muted-foreground">Click or drag to upload image</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Registering...' : 'Register Asset'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

