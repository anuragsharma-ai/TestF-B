import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, CheckCircle2, XCircle, AlertCircle, MapPin, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ThirdPartySubmission } from '@/types';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle, label: 'Rejected' },
  correction_requested: { color: 'bg-accent/10 text-accent border-accent/20', icon: AlertCircle, label: 'Correction Needed' },
};

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const { data: submissions = [], isLoading, isError } = useQuery<ThirdPartySubmission[]>({
    queryKey: ['third-party-submissions'],
    queryFn: async () => {
      const { data } = await api.get<ThirdPartySubmission[]>(API_ENDPOINTS.thirdParty.submissions);
      return data;
    },
  });

  const mySubmissions = submissions.filter((s) => s.submittedBy === user?.id);
  const filtered = filter === 'all' ? mySubmissions : mySubmissions.filter((s) => s.status === filter);

  const renderSubmission = (sub: ThirdPartySubmission) => {
    const cfg = statusConfig[sub.status];
    const StatusIcon = cfg.icon;
    return (
      <Card key={sub.id}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">
                {sub.type === 'verification' ? `Verification: ${sub.assetId}` : `New Asset: ${sub.assetName || 'Unnamed'}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {sub.tempRefId && <span className="font-mono">Ref: {sub.tempRefId} · </span>}
                {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="outline" className={`text-xs ${cfg.color}`}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {cfg.label}
            </Badge>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground leading-relaxed">{sub.locationBreadcrumb}</span>
            </div>
            {sub.remarks && (
              <p className="text-muted-foreground">📝 {sub.remarks}</p>
            )}
          </div>

          {sub.status === 'correction_requested' && sub.reviewNotes && (
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-2 text-xs">
              <p className="font-medium text-accent">Admin feedback:</p>
              <p className="text-muted-foreground">{sub.reviewNotes}</p>
            </div>
          )}

          {sub.reviewedByName && (
            <p className="text-[11px] text-muted-foreground">
              Reviewed by {sub.reviewedByName} · {sub.reviewedAt && formatDistanceToNow(new Date(sub.reviewedAt), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">My Submissions</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
          <TabsTrigger value="correction_requested" className="text-xs">Corrections</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Loading submissions...
            </CardContent>
          </Card>
        )}
        {!isLoading && (isError || filtered.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No submissions found.
            </CardContent>
          </Card>
        )}
        {!isLoading && !isError && filtered.map(renderSubmission)}
      </div>
    </div>
  );
}

