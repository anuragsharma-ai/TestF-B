import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, AlertTriangle, ClipboardList, Calendar } from 'lucide-react';
import { mockAssets, mockLocations } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
  const { toast } = useToast();

  const handleExport = (type: string) => {
    toast({ title: 'Export Started', description: `${type} report is being generated...` });
    setTimeout(() => toast({ title: 'Download Ready', description: 'Report has been downloaded.' }), 1500);
  };

  const discrepancies = mockAssets.filter((a) => a.reconciliationStatus === 'discrepancy').slice(0, 10);
  const pendingAssets = mockAssets.filter((a) => a.reconciliationStatus === 'pending').slice(0, 10);

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
                <Select defaultValue="all">
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {mockLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
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
                    {mockLocations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium">{loc.name}</TableCell>
                        <TableCell>{loc.totalAssets}</TableCell>
                        <TableCell className="text-success">{loc.verifiedAssets}</TableCell>
                        <TableCell className="text-warning">{loc.totalAssets - loc.verifiedAssets}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{Math.round((loc.verifiedAssets / loc.totalAssets) * 100)}%</Badge>
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
                    {['Verified at Mumbai branch', 'Moved from Delhi to Mumbai', 'New asset registered', 'Status updated'].map((desc, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">2025-12-{15 - i}</TableCell>
                        <TableCell className="font-mono text-xs">BANK-{String(i + 1).padStart(6, '0')}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{['verified', 'moved', 'registered', 'updated'][i]}</Badge></TableCell>
                        <TableCell className="text-sm">{['Amit', 'Priya', 'Rajesh', 'Priya'][i]}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{desc}</TableCell>
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
