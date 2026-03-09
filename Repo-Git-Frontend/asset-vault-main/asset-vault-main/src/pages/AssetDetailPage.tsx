import { useParams, useNavigate } from 'react-router-dom';
import { mockAssets, generateMockHistory } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, MapPin, User, Calendar, DollarSign, QrCode, Clock, FileText, Home, ChevronDown, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  in_transit: 'bg-accent/10 text-accent border-accent/20',
  pending_verification: 'bg-warning/10 text-warning border-warning/20',
  missing: 'bg-destructive/10 text-destructive border-destructive/20',
  disposed: 'bg-muted text-muted-foreground',
};

const actionIcons: Record<string, string> = {
  registered: '📦', moved: '🔄', reassigned: '👤', verified: '✅', updated: '✏️', disposed: '🗑️',
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const isThirdParty = user?.role === 'third_party';
  const asset = mockAssets.find((a) => a.id === id);
  const history = id ? generateMockHistory(id) : [];
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [wfhOpen, setWfhOpen] = useState(false);

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <p className="text-lg font-medium mb-2">Asset not found</p>
        <Button variant="outline" onClick={() => navigate('/assets')}>Back to Assets</Button>
      </div>
    );
  }

  // Third-party: hide sensitive details
  const detailFields = isThirdParty
    ? [
        { icon: QrCode, label: 'Serial Number', value: asset.serialNumber },
        { icon: QrCode, label: 'Tag Number', value: asset.tagNumber },
        { icon: MapPin, label: 'Category', value: asset.category },
      ]
    : [
        { icon: QrCode, label: 'Serial Number', value: asset.serialNumber },
        { icon: QrCode, label: 'Tag Number', value: asset.tagNumber },
        { icon: MapPin, label: 'Entity', value: asset.entity || '—' },
        { icon: MapPin, label: 'Asset Type', value: asset.category },
        { icon: MapPin, label: 'Sub Asset Type', value: asset.subAssetType || '—' },
        { icon: MapPin, label: 'Location', value: asset.locationName },
        { icon: MapPin, label: 'Sub Location', value: asset.subLocation || '—' },
        { icon: User, label: 'Assigned To', value: asset.assignedToName },
        { icon: Calendar, label: 'Purchase Date', value: asset.purchaseDate },
        { icon: DollarSign, label: 'Value', value: `₹${asset.purchaseValue.toLocaleString()}` },
      ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-lg font-bold md:text-xl">{asset.name}</h1>
          <p className="text-xs text-muted-foreground">{asset.assetId}</p>
        </div>
        <Badge variant="outline" className={`ml-auto ${statusColors[asset.status]}`}>{asset.status.replace(/_/g, ' ')}</Badge>
      </div>

      {/* Location breadcrumb */}
      {asset.locationBreadcrumb && (
        <div className="rounded-lg bg-muted p-3 text-xs flex items-start gap-2">
          <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{asset.locationBreadcrumb}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {detailFields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Asset Image</CardTitle></CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <QrCode className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No image uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Details Upload section */}
      {!isThirdParty && asset.assetDetails && (
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Asset Details</span>
                  {detailsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  {Object.entries({
                    'Sub Number': asset.assetDetails.subNumber,
                    'Asset Class': asset.assetDetails.assetClass,
                    'Cost Center': asset.assetDetails.costCenter,
                    'Int. Order': asset.assetDetails.intOrder,
                    'Useful Life': asset.assetDetails.usefulLife,
                    'Periods': asset.assetDetails.usefulLifeInPeriods,
                    'Supplier': asset.assetDetails.supplier,
                    'Currency': asset.assetDetails.currency,
                    'Capitalized On': asset.assetDetails.capitalizedOn,
                    'APC FY Start': asset.assetDetails.apcFyStart,
                    'Acquisition': asset.assetDetails.acquisition,
                    'Current APC': asset.assetDetails.currentApc,
                    'Dep. FY Start': asset.assetDetails.depFyStart,
                    'Dep. for Year': asset.assetDetails.depForYear,
                    'Accumulated Dep.': asset.assetDetails.accumulDep,
                    'Bk. Val. FY Start': asset.assetDetails.bkValFyStart,
                    'Current Book Value': asset.assetDetails.currBkVal,
                  }).filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <span className="font-medium text-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* WFH Details section */}
      {!isThirdParty && asset.wfhDetails && (
        <Collapsible open={wfhOpen} onOpenChange={setWfhOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><Home className="h-4 w-4 text-accent" /> WFH Details</span>
                  {wfhOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries({
                    'Serial Number': asset.wfhDetails.serialNumber,
                    'Location': asset.wfhDetails.location,
                    'Entity': asset.wfhDetails.entity,
                    'Asset': asset.wfhDetails.asset,
                    'UID': asset.wfhDetails.uid,
                    'User Name': asset.wfhDetails.userName,
                    'User Email': asset.wfhDetails.userEmailId,
                  }).filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <span className="font-medium text-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* History - hidden for third-party */}
      {!isThirdParty && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {history.map((h) => (
                  <div key={h.id} className="flex gap-3 relative">
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card border text-sm">
                      {actionIcons[h.action] || '📋'}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-medium">{h.description}</p>
                      {h.fromLocation && h.toLocation && (
                        <p className="text-xs text-muted-foreground">{h.fromLocation} → {h.toLocation}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {h.performedByName} · {formatDistanceToNow(new Date(h.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
