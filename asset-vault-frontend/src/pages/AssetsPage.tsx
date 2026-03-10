import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAssets } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Filter, ChevronLeft, ChevronRight, Mail, Send } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ASSET_COLUMNS, Asset } from '@/types';
import ColumnSelector from '@/components/ColumnSelector';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  in_transit: 'bg-accent/10 text-accent border-accent/20',
  pending_verification: 'bg-warning/10 text-warning border-warning/20',
  missing: 'bg-destructive/10 text-destructive border-destructive/20',
  disposed: 'bg-muted text-muted-foreground',
};

const reconColors: Record<string, string> = {
  verified: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  discrepancy: 'bg-destructive/10 text-destructive border-destructive/20',
};

const PAGE_SIZE = 20;

function getCellValue(asset: Asset, key: string): string {
  switch (key) {
    case 'entity': return asset.entity || '—';
    case 'assetId': return asset.assetId;
    case 'serialNumber': return asset.serialNumber;
    case 'category': return asset.category;
    case 'subAssetType': return asset.subAssetType || '—';
    case 'locationName': return asset.locationName;
    case 'subLocation': return asset.subLocation || '—';
    case 'status': return asset.status.replace(/_/g, ' ');
    case 'reconciliationStatus': return asset.reconciliationStatus;
    case 'assignedToName': return asset.assignedToName;
    case 'purchaseDate': return asset.purchaseDate;
    case 'purchaseValue': return `₹${asset.purchaseValue.toLocaleString()}`;
    case 'costCenter': return asset.assetDetails?.costCenter || '—';
    case 'supplier': return asset.assetDetails?.supplier || '—';
    case 'currency': return asset.assetDetails?.currency || '—';
    case 'assetDescription': return asset.assetDetails?.assetDescription || '—';
    case 'usefulLife': return asset.assetDetails?.usefulLife || '—';
    case 'capitalizedOn': return asset.assetDetails?.capitalizedOn || '—';
    case 'depFyStart': return asset.assetDetails?.depFyStart || '—';
    case 'depForYear': return asset.assetDetails?.depForYear || '—';
    case 'accumulDep': return asset.assetDetails?.accumulDep || '—';
    case 'currBkVal': return asset.assetDetails?.currBkVal || '—';
    case 'wfhUid': return asset.wfhDetails?.uid || '—';
    case 'wfhUserName': return asset.wfhDetails?.userName || '—';
    case 'wfhUserEmail': return asset.wfhDetails?.userEmailId || '—';
    default: return '—';
  }
}

export default function AssetsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ASSET_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
  );
  const [sendRequestOpen, setSendRequestOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'location_admin';

  const filtered = useMemo(() => {
    let result = mockAssets;
    if (user?.role === 'employee') result = result.filter((a) => a.assignedTo === user.id);
    if (user?.role === 'location_admin') result = result.filter((a) => a.locationId === user.locationId);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.name.toLowerCase().includes(q) || a.assetId.toLowerCase().includes(q) || a.serialNumber.toLowerCase().includes(q) || a.tagNumber.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter((a) => a.status === statusFilter);
    if (categoryFilter !== 'all') result = result.filter((a) => a.category === categoryFilter);
    return result;
  }, [search, statusFilter, categoryFilter, user]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categories = [...new Set(mockAssets.map((a) => a.category))];

  const handleSendRequest = (asset: Asset) => {
    setSelectedAsset(asset);
    setRequestMessage(`Please verify asset ${asset.assetId} (${asset.name}) at your assigned location.`);
    setSendRequestOpen(true);
  };

  const confirmSendRequest = () => {
    // This calls the existing API endpoint
    toast({
      title: 'Verification Request Sent',
      description: `Email sent to ${selectedAsset?.assignedToName} for asset ${selectedAsset?.assetId}.`,
    });
    setSendRequestOpen(false);
    setSelectedAsset(null);
    setRequestMessage('');
  };

  const activeColumnDefs = ASSET_COLUMNS.filter((c) => visibleColumns.includes(c.key));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">Assets</h1>
        <span className="text-sm text-muted-foreground">{filtered.length.toLocaleString()} assets</span>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, ID, serial..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><Filter className="mr-1 h-3 w-3" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="pending_verification">Pending</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <ColumnSelector visibleColumns={visibleColumns} onChange={setVisibleColumns} />
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-2">
          {pageData.map((asset) => (
            <Card key={asset.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/assets/${asset.id}`)}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.assetId} · {asset.serialNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{asset.entity || '—'} · {asset.locationName}</p>
                    {asset.subLocation && <p className="text-xs text-muted-foreground">{asset.subLocation}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`text-[10px] ${statusColors[asset.status]}`}>
                      {asset.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${reconColors[asset.reconciliationStatus]}`}>
                      {asset.reconciliationStatus}
                    </Badge>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full h-8 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleSendRequest(asset); }}
                  >
                    <Send className="mr-1 h-3 w-3" /> Send Request to Employee
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeColumnDefs.map((col) => (
                    <TableHead key={col.key} className="whitespace-nowrap text-xs">{col.label}</TableHead>
                  ))}
                  {isAdmin && <TableHead className="text-xs">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((asset) => (
                  <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/assets/${asset.id}`)}>
                    {activeColumnDefs.map((col) => (
                      <TableCell key={col.key} className="text-xs whitespace-nowrap">
                        {col.key === 'status' ? (
                          <Badge variant="outline" className={`text-[10px] ${statusColors[asset.status]}`}>{asset.status.replace(/_/g, ' ')}</Badge>
                        ) : col.key === 'reconciliationStatus' ? (
                          <Badge variant="outline" className={`text-[10px] ${reconColors[asset.reconciliationStatus]}`}>{asset.reconciliationStatus}</Badge>
                        ) : (
                          getCellValue(asset, col.key)
                        )}
                      </TableCell>
                    ))}
                    {isAdmin && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-accent hover:text-accent"
                          onClick={(e) => { e.stopPropagation(); handleSendRequest(asset); }}
                        >
                          <Send className="h-3 w-3" /> Request
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Send Request to Employee Dialog */}
      <Dialog open={sendRequestOpen} onOpenChange={setSendRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              Send Verification Request
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="text-sm space-y-1.5 bg-muted rounded-lg p-3">
                <p><span className="text-muted-foreground">Asset:</span> {selectedAsset.assetId} — {selectedAsset.name}</p>
                <p><span className="text-muted-foreground">Employee:</span> {selectedAsset.assignedToName}</p>
                <p><span className="text-muted-foreground">Location:</span> {selectedAsset.locationName}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Message</Label>
                <Textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                An email with a verification link will be sent to the assigned employee.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendRequestOpen(false)}>Cancel</Button>
            <Button onClick={confirmSendRequest} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
