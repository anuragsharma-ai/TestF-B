import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { mockSubmissions } from '@/data/mockData';
import { ThirdPartySubmission } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, AlertCircle, Clock, MapPin, Eye, QrCode } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-warning/10 text-warning border-warning/20', label: 'Pending' },
  approved: { color: 'bg-success/10 text-success border-success/20', label: 'Approved' },
  rejected: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Rejected' },
  correction_requested: { color: 'bg-accent/10 text-accent border-accent/20', label: 'Correction' },
};

export default function AdminSubmissionsPage() {
  const [filter, setFilter] = useState('pending');
  const [selectedSub, setSelectedSub] = useState<ThirdPartySubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'correction' | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const filtered = filter === 'all' ? mockSubmissions : mockSubmissions.filter((s) => s.status === filter);

  const handleAction = (type: 'approve' | 'reject' | 'correction', sub: ThirdPartySubmission) => {
    setSelectedSub(sub);
    setActionType(type);
    setReviewNotes('');
  };

  const confirmAction = () => {
    if (!actionType || !selectedSub) return;
    const labels = { approve: 'Approved', reject: 'Rejected', correction: 'Correction Requested' };
    toast({
      title: `Submission ${labels[actionType]}`,
      description: `${selectedSub.id} has been ${labels[actionType].toLowerCase()}.`,
    });
    setSelectedSub(null);
    setActionType(null);
  };

  const renderMobileCard = (sub: ThirdPartySubmission) => {
    const cfg = statusConfig[sub.status];
    return (
      <Card key={sub.id}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">
                {sub.type === 'verification' ? `Verify: ${sub.assetId}` : `New: ${sub.assetName || sub.tempRefId}`}
              </p>
              <p className="text-xs text-muted-foreground">
                by {sub.submittedByName} · {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
          </div>

          <div className="text-xs flex items-start gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground leading-relaxed line-clamp-2">{sub.locationBreadcrumb}</span>
          </div>

          {sub.status === 'pending' && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-8 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleAction('approve', sub)}>
                <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => handleAction('correction', sub)}>
                <AlertCircle className="mr-1 h-3 w-3" /> Correct
              </Button>
              <Button size="sm" variant="destructive" className="h-8" onClick={() => handleAction('reject', sub)}>
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold md:text-2xl">Third-Party Submissions</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isMobile ? (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No submissions.</CardContent></Card>
          )}
          {filtered.map(renderMobileCard)}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => {
                const cfg = statusConfig[sub.status];
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {sub.type === 'verification' ? 'Verify' : 'New Asset'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {sub.type === 'verification' ? sub.assetId : (sub.assetName || sub.tempRefId)}
                    </TableCell>
                    <TableCell className="text-sm">{sub.submittedByName}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={sub.locationBreadcrumb}>
                      {sub.locationBreadcrumb}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {sub.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-success hover:text-success" onClick={() => handleAction('approve', sub)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-accent hover:text-accent" onClick={() => handleAction('correction', sub)}>
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => handleAction('reject', sub)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!actionType} onOpenChange={() => { setActionType(null); setSelectedSub(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && '✅ Approve Submission'}
              {actionType === 'reject' && '❌ Reject Submission'}
              {actionType === 'correction' && '⚠️ Request Correction'}
            </DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-3">
              <div className="text-sm space-y-1 bg-muted rounded-lg p-3">
                <p><span className="text-muted-foreground">ID:</span> {selectedSub.id}</p>
                <p><span className="text-muted-foreground">Type:</span> {selectedSub.type}</p>
                <p><span className="text-muted-foreground">By:</span> {selectedSub.submittedByName}</p>
              </div>
              {(actionType === 'reject' || actionType === 'correction') && (
                <Textarea
                  placeholder={actionType === 'correction' ? 'What needs to be corrected?' : 'Reason for rejection...'}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              )}
              {actionType === 'approve' && selectedSub.type === 'new_asset' && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs space-y-1">
                  <p className="font-medium text-accent">On approval:</p>
                  <p className="text-muted-foreground">• Asset will be converted to an official record</p>
                  <p className="text-muted-foreground">• Employee can be assigned</p>
                  <p className="text-muted-foreground">• QR code will be generated</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setSelectedSub(null); }}>Cancel</Button>
            <Button
              onClick={confirmAction}
              className={
                actionType === 'approve' ? 'bg-success hover:bg-success/90 text-success-foreground' :
                actionType === 'reject' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''
              }
            >
              {actionType === 'approve' && 'Approve'}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'correction' && 'Request Correction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
