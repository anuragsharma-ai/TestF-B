import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockDashboardSummary, mockLocations } from '@/data/mockData';
import { Package, ClipboardCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const data = mockDashboardSummary;
  const branch = mockLocations[0];
  const progress = Math.round((branch.verifiedAssets / branch.totalAssets) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Branch Assets', value: branch.totalAssets, icon: Package, color: 'text-accent' },
          { label: 'Verified', value: branch.verifiedAssets, icon: CheckCircle2, color: 'text-success' },
          { label: 'Pending', value: branch.totalAssets - branch.verifiedAssets, icon: ClipboardCheck, color: 'text-warning' },
          { label: 'Discrepancies', value: 8, icon: AlertTriangle, color: 'text-destructive' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="text-2xl font-bold">{s.value.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reconciliation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>{branch.verifiedAssets} of {branch.totalAssets} assets</span>
            <span className="font-bold text-accent">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentActivity.map((a) => (
            <div key={a.id} className="flex items-start gap-3 text-sm">
              <div className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
              <div>
                <p className="font-medium">{a.description}</p>
                <p className="text-xs text-muted-foreground">
                  {a.performedByName} · {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
