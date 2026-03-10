import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Save, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import LocationHierarchySelector from '@/components/LocationHierarchySelector';
import { LocationPath } from '@/types';

const ASSET_TYPES = ['Computer', 'Furniture', 'Vehicle', 'Networking', 'Security', 'Office Equipment', 'ATM', 'Safe Deposit'];
const SUB_ASSET_TYPES = ['Desktop', 'Laptop', 'Chair', 'Desk', 'Sedan', 'Switch', 'CCTV', 'Printer', 'Cash Machine', 'Locker'];
const ENTITIES = ['Admin Entity', 'Operations', 'Technology', 'HR', 'Finance', 'Compliance'];

export default function AssetRegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationPath, setLocationPath] = useState<LocationPath>({});
  const [financialsOpen, setFinancialsOpen] = useState(false);
  const [depreciationOpen, setDepreciationOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    toast({ title: 'Asset Registered', description: 'Asset has been successfully registered in the system.' });
    navigate('/assets');
  };

  const FieldWithTooltip = ({ label, tip, children }: { label: string; tip?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1">
        {label}
        {tip && (
          <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tip}</TooltipContent></Tooltip>
        )}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-bold">Register New Asset</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core Asset Information */}
        <Card>
          <CardHeader><CardTitle className="text-base">Asset Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FieldWithTooltip label="Entity" tip="Business entity this asset belongs to">
                <Select>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select entity" /></SelectTrigger>
                  <SelectContent>{ENTITIES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </FieldWithTooltip>
              <FieldWithTooltip label="Asset ID" tip="Unique identifier for this asset">
                <Input placeholder="e.g. BANK-000281" className="h-9 text-sm" required />
              </FieldWithTooltip>
              <FieldWithTooltip label="Serial Number" tip="Usually found on a sticker on the device">
                <Input placeholder="e.g. SN-123456" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Sub Number">
                <Input placeholder="e.g. 1-0" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Tag Number">
                <Input placeholder="e.g. TAG-00281" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Asset Class">
                <Input placeholder="e.g. CLS-001" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Asset Type">
                <Select>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </FieldWithTooltip>
              <FieldWithTooltip label="Sub Asset Type">
                <Select>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select sub type" /></SelectTrigger>
                  <SelectContent>{SUB_ASSET_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </FieldWithTooltip>
              <FieldWithTooltip label="Cost Center">
                <Input placeholder="e.g. CC-0100" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Int. Order">
                <Input placeholder="e.g. IO-000001" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Supplier">
                <Input placeholder="e.g. Dell Technologies" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Currency">
                <Input placeholder="e.g. INR" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Purchase Value (₹)">
                <Input type="number" placeholder="e.g. 50000" min={0} className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Useful Life">
                <Input placeholder="e.g. 5 years" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Useful Life in Periods">
                <Input placeholder="e.g. 60" className="h-9 text-sm" />
              </FieldWithTooltip>
              <FieldWithTooltip label="Capitalized On">
                <Input type="date" className="h-9 text-sm" />
              </FieldWithTooltip>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Asset Description</Label>
              <Textarea placeholder="Detailed description of the asset..." rows={2} className="text-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Location (Hierarchy)</Label>
              <LocationHierarchySelector value={locationPath} onChange={setLocationPath} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FieldWithTooltip label="Sub Location">
                <Input placeholder="e.g. Server Room, Reception" className="h-9 text-sm" />
              </FieldWithTooltip>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Asset Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <p className="text-sm text-muted-foreground">Click or drag to upload image</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details — Collapsible */}
        <Collapsible open={financialsOpen} onOpenChange={setFinancialsOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Financial Details (APC)</span>
                  {financialsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <p className="text-xs text-muted-foreground">All fields optional — for SAP / ERP imported data.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'APC FY Start', placeholder: 'Amount' },
                    { label: 'Acquisition', placeholder: 'Amount' },
                    { label: 'Retirement', placeholder: 'Amount' },
                    { label: 'Transfer', placeholder: 'Amount' },
                    { label: 'Post-Capital.', placeholder: 'Amount' },
                    { label: 'Current APC', placeholder: 'Amount' },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1">
                      <Label className="text-xs">{f.label}</Label>
                      <Input placeholder={f.placeholder} className="h-9 text-sm" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Depreciation Details — Collapsible */}
        <Collapsible open={depreciationOpen} onOpenChange={setDepreciationOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Depreciation Details</span>
                  {depreciationOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <p className="text-xs text-muted-foreground">All fields optional.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Dep. FY Start', placeholder: 'Amount' },
                    { label: 'Dep. for Year', placeholder: 'Amount' },
                    { label: 'Dep. Retirement', placeholder: 'Amount' },
                    { label: 'Dep. Transfer', placeholder: 'Amount' },
                    { label: 'Write-ups', placeholder: 'Amount' },
                    { label: 'Dep. Post-Cap.', placeholder: 'Amount' },
                    { label: 'Accumulated Dep.', placeholder: 'Amount' },
                    { label: 'Bk. Val. FY Start', placeholder: 'Amount' },
                    { label: 'Current Book Value', placeholder: 'Amount' },
                    { label: 'Deactivation On', placeholder: 'YYYY-MM-DD', type: 'date' },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1">
                      <Label className="text-xs">{f.label}</Label>
                      <Input type={(f as any).type || 'text'} placeholder={f.placeholder} className="h-9 text-sm" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* WFH Details — Collapsible */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>WFH Details</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <p className="text-xs text-muted-foreground">Only for Work From Home assets. No duplicate fields — uses Entity, Serial Number, Location from above.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">UID</Label>
                    <Input placeholder="Unique ID" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">User Name</Label>
                    <Input placeholder="Employee name" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">User Email ID</Label>
                    <Input placeholder="email@bank.com" type="email" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">WFH Location</Label>
                    <Input placeholder="Home address or area" className="h-9 text-sm" />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Registering...' : 'Register Asset'}
        </Button>
      </form>
    </div>
  );
}
