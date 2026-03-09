import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, User, Calendar, DollarSign, QrCode, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { Asset } from '@/types';

type AssetHistoryItem = {
  id: string;
  action: string;
  changed_at: string;
};

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

  const {
    data: asset,
    isLoading,
    isError,
  } = useQuery<Asset | null>({
    queryKey: ['asset', id],
    enabled: !!id,
    queryFn: async () => {
      const response = await api.get<Asset>(API_ENDPOINTS.assets.detail(id!));
      return response.data;
    },
  });

  const { data: history = [] } = useQuery<AssetHistoryItem[]>({
    queryKey: ['asset-history', id],
    enabled: !!id,
    queryFn: async () => {
      const response = await api.get<AssetHistoryItem[]>(API_ENDPOINTS.assets.history(id!));
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <p className="text-lg font-medium mb-2">Loading asset...</p>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <p className="text-lg font-medium mb-2">Asset not found</p>
        <Button variant="outline" onClick={() => navigate('/assets')}>Back to Assets</Button>
      </div>
    );
  }

  const detailFields = isThirdParty
    ? [
        { icon: QrCode, label: 'Serial Number', value: asset.serialNumber },
        { icon: QrCode, label: 'Tag Number', value: asset.tagNumber },
        { icon: MapPin, label: 'Category', value: asset.category },
      ]
    : [
        { icon: QrCode, label: 'Serial Number', value: asset.serialNumber },
        { icon: QrCode, label: 'Tag Number', value: asset.tagNumber },
        { icon: MapPin, label: 'Location', value: asset.locationName },
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
        <Badge variant="outline" className={`ml-auto ${statusColors[asset.status]}`}>{asset.status.replace('_', ' ')}</Badge>
      </div>

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
                      <p className="text-sm font-medium">{h.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}
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

