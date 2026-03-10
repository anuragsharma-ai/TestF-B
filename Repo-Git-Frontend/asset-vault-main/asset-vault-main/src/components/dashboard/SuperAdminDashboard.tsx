import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockDashboardSummary, mockAssets } from '@/data/mockData';
import { Package, CheckCircle2, AlertTriangle, ClipboardCheck, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { downloadAsExcel } from '@/lib/exportUtils';
import ChartDownloadBtn from './ChartDownloadBtn';
import { useMemo } from 'react';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(215, 60%, 24%)', 'hsl(280, 60%, 50%)', 'hsl(160, 60%, 40%)', 'hsl(30, 80%, 55%)'];

export default function SuperAdminDashboard() {
  const data = mockDashboardSummary;

  const barData = data.locationBreakdown.map((l) => ({
    name: l.locationName.split(' - ')[0],
    verified: l.verified,
    pending: l.total - l.verified,
    total: l.total,
  }));

  const pieData = [
    { name: 'Verified', value: data.verifiedAssets },
    { name: 'Pending', value: data.pendingReconciliation },
    { name: 'Discrepancy', value: data.discrepancies },
  ];

  // Category-wise breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, { total: number; verified: number; pending: number; value: number }> = {};
    mockAssets.forEach((a) => {
      if (!map[a.category]) map[a.category] = { total: 0, verified: 0, pending: 0, value: 0 };
      map[a.category].total++;
      map[a.category].value += a.purchaseValue;
      if (a.reconciliationStatus === 'verified') map[a.category].verified++;
      else map[a.category].pending++;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d }));
  }, []);

  const categoryPieData = useMemo(() => {
    return categoryData.map((c) => ({ name: c.name, value: c.total }));
  }, [categoryData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Assets', value: data.totalAssets.toLocaleString(), icon: Package, color: 'text-accent' },
          { label: 'Verified', value: data.verifiedAssets.toLocaleString(), icon: CheckCircle2, color: 'text-success' },
          { label: 'Pending', value: data.pendingReconciliation.toLocaleString(), icon: ClipboardCheck, color: 'text-warning' },
          { label: 'Discrepancies', value: data.discrepancies.toString(), icon: AlertTriangle, color: 'text-destructive' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Overall Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>{data.verifiedAssets.toLocaleString()} of {data.totalAssets.toLocaleString()}</span>
            <span className="font-bold text-accent">{data.reconciliationProgress}%</span>
          </div>
          <Progress value={data.reconciliationProgress} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Assets by Location</CardTitle>
              <ChartDownloadBtn onClick={() => downloadAsExcel(
                barData.map((d) => ({ Location: d.name, Verified: d.verified, Pending: d.pending, Total: d.total })),
                'assets-by-location'
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="verified" stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Reconciliation Status</CardTitle>
              <ChartDownloadBtn onClick={() => downloadAsExcel(
                pieData.map((d) => ({ Status: d.name, Count: d.value })),
                'reconciliation-status'
              )} />
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category-wise Dashboard */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Assets by Category</CardTitle>
              <ChartDownloadBtn onClick={() => downloadAsExcel(
                categoryData.map((d) => ({ Category: d.name, Total: d.total, Verified: d.verified, Pending: d.pending, 'Total Value': d.value })),
                'assets-by-category'
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
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
                'category-distribution'
              )} />
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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

      {/* Category-wise Value */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Category-wise Asset Value (₹)</CardTitle>
            <ChartDownloadBtn onClick={() => downloadAsExcel(
              categoryData.map((d) => ({ Category: d.name, 'Total Value (₹)': d.value, 'Asset Count': d.total })),
              'category-value'
            )} />
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
              <div className="flex-1">
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
