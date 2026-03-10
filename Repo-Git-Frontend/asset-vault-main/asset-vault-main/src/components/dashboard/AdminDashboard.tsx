import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockDashboardSummary, mockLocations, mockAssets } from '@/data/mockData';
import { Package, ClipboardCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { downloadAsExcel } from '@/lib/exportUtils';
import ChartDownloadBtn from './ChartDownloadBtn';
import { useMemo } from 'react';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(215, 60%, 24%)', 'hsl(280, 60%, 50%)', 'hsl(160, 60%, 40%)', 'hsl(30, 80%, 55%)'];

export default function AdminDashboard() {
  const data = mockDashboardSummary;
  const branch = mockLocations[0];
  const progress = Math.round((branch.verifiedAssets / branch.totalAssets) * 100);

  // Category breakdown for this branch
  const branchAssets = mockAssets.filter((a) => a.locationId === branch.id);
  const categoryData = useMemo(() => {
    const map: Record<string, { total: number; verified: number; pending: number; value: number }> = {};
    branchAssets.forEach((a) => {
      if (!map[a.category]) map[a.category] = { total: 0, verified: 0, pending: 0, value: 0 };
      map[a.category].total++;
      map[a.category].value += a.purchaseValue;
      if (a.reconciliationStatus === 'verified') map[a.category].verified++;
      else map[a.category].pending++;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d }));
  }, [branchAssets]);

  const categoryPieData = categoryData.map((c) => ({ name: c.name, value: c.total }));

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

      {/* Category-wise Dashboard */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Assets by Category</CardTitle>
              <ChartDownloadBtn onClick={() => downloadAsExcel(
                categoryData.map((d) => ({ Category: d.name, Total: d.total, Verified: d.verified, Pending: d.pending })),
                'branch-assets-by-category'
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="verified" stackId="a" fill="hsl(142, 71%, 45%)" />
                <Bar dataKey="pending" stackId="a" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Category Distribution</CardTitle>
              <ChartDownloadBtn onClick={() => downloadAsExcel(
                categoryPieData.map((d) => ({ Category: d.name, 'Asset Count': d.value })),
                'branch-category-distribution'
              )} />
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
