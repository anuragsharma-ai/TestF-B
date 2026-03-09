export type UserRole = 'super_admin' | 'location_admin' | 'employee' | 'third_party';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  locationId?: string;
  locationName?: string;
  avatar?: string;
  assignedLocationIds?: string[]; // For third-party operators - restricted locations
}

// ---- Location Hierarchy ----
export type LocationLevel =
  | 'company' | 'country' | 'region' | 'zone' | 'site'
  | 'entity' | 'building' | 'wing' | 'area' | 'floor'
  | 'unit' | 'room';

export const LOCATION_LEVELS: LocationLevel[] = [
  'company', 'country', 'region', 'zone', 'site',
  'entity', 'building', 'wing', 'area', 'floor',
  'unit', 'room',
];

export const LOCATION_LEVEL_LABELS: Record<LocationLevel, string> = {
  company: 'Company',
  country: 'Country',
  region: 'Region',
  zone: 'Zone',
  site: 'Site',
  entity: 'Entity',
  building: 'Building',
  wing: 'Wing',
  area: 'Area',
  floor: 'Floor',
  unit: 'Unit',
  room: 'Room',
};

export interface LocationNode {
  id: string;
  name: string;
  level: LocationLevel;
  parentId: string | null;
  code: string;
  children?: LocationNode[];
}

export interface LocationPath {
  [key: string]: string; // level -> locationNodeId
}

export interface Asset {
  id: string;
  assetId: string;
  serialNumber: string;
  tagNumber: string;
  name: string;
  description: string;
  category: string;
  locationId: string;
  locationName: string;
  locationPath?: LocationPath;
  locationBreadcrumb?: string;
  assignedTo: string;
  assignedToName: string;
  status: 'active' | 'in_transit' | 'disposed' | 'missing' | 'pending_verification';
  reconciliationStatus: 'verified' | 'pending' | 'discrepancy';
  purchaseDate: string;
  purchaseValue: number;
  imageUrl?: string;
  qrCode?: string;
  lastVerified?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  action: 'registered' | 'moved' | 'reassigned' | 'verified' | 'updated' | 'disposed';
  description: string;
  performedBy: string;
  performedByName: string;
  fromLocation?: string;
  toLocation?: string;
  timestamp: string;
  imageUrl?: string;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  address: string;
  totalAssets: number;
  verifiedAssets: number;
}

export interface DashboardSummary {
  totalAssets: number;
  pendingReconciliation: number;
  verifiedAssets: number;
  discrepancies: number;
  recentActivity: AssetHistory[];
  locationBreakdown: { locationName: string; total: number; verified: number }[];
  reconciliationProgress: number;
}

export interface ReconciliationSubmission {
  assetId: string;
  locationConfirmed: boolean;
  locationId: string;
  imageFile?: File;
  notes?: string;
}

// ---- Third-Party Submissions ----
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'correction_requested';

export interface ThirdPartySubmission {
  id: string;
  type: 'verification' | 'new_asset';
  assetId?: string;        // If verifying existing
  tempRefId?: string;      // If new asset
  assetName?: string;
  serialNumber?: string;
  assetType?: string;
  locationBreadcrumb: string;
  locationPath: LocationPath;
  photoUrl: string;
  remarks?: string;
  status: SubmissionStatus;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}
