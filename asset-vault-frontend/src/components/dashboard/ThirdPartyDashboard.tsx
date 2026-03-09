import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanLine, ClipboardList, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { mockSubmissions } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle, label: 'Rejected' },
  correction_requested: { color: 'bg-accent/10 text-accent border-accent/20', icon: AlertCircle, label: 'Correction Needed' },
};

export default function ThirdPartyDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mySubmissions = mockSubmissions.filter((s) => s.submittedBy === user?.id);

  const stats = [
    { label: 'Submitted', value: mySubmissions.length, color: 'text-accent' },
    { label: 'Pending', value: mySubmissions.filter((s) => s.status === 'pending').length, color: 'text-warning' },
    { label: 'Approved', value: mySubmissions.filter((s) => s.status === 'approved').length, color: 'text-success' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="flex flex-col items-center p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
        <Button
          onClick={() => navigate('/scan')}
          className="w-full h-16 text-lg bg-accent hover:bg-accent/90 text-accent-foreground"
          size="lg"
        >
          <ScanLine className="mr-3 h-6 w-6" />
          Scan & Verify Asset
        </Button>
      </motion.div>

      <div>
        <h3 className="mb-2 text-sm font-semibold flex items-center gap-1">
          <ClipboardList className="h-4 w-4" /> Recent Submissions
        </h3>
        <div className="space-y-2">
          {mySubmissions.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No submissions yet. Start by scanning an asset.
              </CardContent>
            </Card>
          )}
          {mySubmissions.map((sub) => {
            const cfg = statusConfig[sub.status];
            return (
              <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/submissions')}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {sub.type === 'verification' ? `Verified: ${sub.assetId}` : `New: ${sub.assetName || sub.tempRefId}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
