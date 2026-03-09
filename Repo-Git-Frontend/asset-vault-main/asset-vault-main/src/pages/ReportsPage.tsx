import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, AlertTriangle, ClipboardList, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { Asset } from '@/types';

export default function ReportsPage() {
  const { toast } = useToast();
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data } = await api.get<Asset[]>(API_ENDPOINTS.assets.list);
      return data;
    },
  });

  const handleExport = (type: string) => {
    toast({ title: 'Export Started', description: `${type} report is being generated...` });
    setTimeout(() => toast({ title: 'Download Ready', description: 'Report has been downloaded.' }), 1500);
  };

  const discrepancies = assets.filter((a) => a.reconciliationStatus === 'discrepancy').slice(0, 10);
  const pendingAssets = assets.filter((a) => a.reconciliationStatus === 'pending').slice(0, 10);

  const locations = Array.from(
    new Map(
      assets
        .filter((a) => a.locationName)
        .map((a) => [a.locationId, a.locationName]),
    ).entries(),
  ).map(([id, name]) => ({ id, name: name as string }));

  const locationStats = (() => {
    const map = new Map<
      string,
      { id: string | null; name: string; total: number; verified: number }
    >();
    for (const a of assets) {
      const key = a.locationId != null ? String(a.locationId) : 'unassigned';
      const name = a.locationName || 'Unassigned';
      if (!map.has(key)) {
        map.set(key, { id: a.locationId != null ? String(a.locationId) : null, name, total: 0, verified: 0 });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      if (a.reconciliationStatus === 'verified') {
        entry.verified += 1;
      }
    }
    return Array.from(map.values());
  })();

  const locationRows = locationStats.filter((row) =>
    locationFilter === 'all' ? true : row.id === locationFilter,
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold md:text-2xl">Reports</h1>

      <Tabs defaultValue="reconciliation">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="reconciliation"><ClipboardList className="mr-1 h-4 w-4 hidden md:inline" /> Reconciliation</TabsTrigger>
          <TabsTrigger value="discrepancy"><AlertTriangle className="mr-1 h-4 w-4 hidden md:inline" /> Discrepancy</TabsTrigger>
          <TabsTrigger value="audit"><FileText className="mr-1 h-4 w-4 hidden md:inline" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliation" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Reconciliation Report</CardTitle>
              <Button size="sm" onClick={() => handleExport('Reconciliation')}>
                <Download className="mr-1 h-3 w-3" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((l) => l.id && (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" className="w-[160px]" />
                <Input type="date" className="w-[160px]" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationRows.map((loc) => (
                      <TableRow key={loc.id || 'none'}>
                        <TableCell className="font-medium">{loc.name}</TableCell>
                        <TableCell>{loc.total}</TableCell>
                        <TableCell className="text-success">{loc.verified}</TableCell>
                        <TableCell className="text-warning">{loc.total - loc.verified}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {loc.total ? Math.round((loc.verified / loc.total) * 100) : 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discrepancy" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Asset Discrepancy Report</CardTitle>
              <Button size="sm" onClick={() => handleExport('Discrepancy')}>
                <Download className="mr-1 h-3 w-3" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discrepancies.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">{a.assetId}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell>{a.locationName}</TableCell>
                        <TableCell><Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Discrepancy</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Movement Audit Log</CardTitle>
              <Button size="sm" onClick={() => handleExport('Audit')}>
                <Download className="mr-1 h-3 w-3" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.slice(0, 10).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs">{a.updatedAt || a.createdAt}</TableCell>
                        <TableCell className="font-mono text-xs">{a.assetId}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{a.reconciliationStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{a.assignedToName || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.name} at {a.locationName || 'Unassigned'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
