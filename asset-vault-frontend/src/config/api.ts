const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  auth: {
    sendOtp: `${API_BASE_URL}/auth/send-otp`,
    verifyOtp: `${API_BASE_URL}/auth/verify-otp`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
  },
  assets: {
    list: `${API_BASE_URL}/assets/`,
    create: `${API_BASE_URL}/assets/`,
    detail: (id: string) => `${API_BASE_URL}/assets/${id}`,
    history: (id: string) => `${API_BASE_URL}/assets/${id}/history`,
    upload: `${API_BASE_URL}/assets/upload`,
    generateQr: `${API_BASE_URL}/assets/generate-qr`,
  },
  dashboard: {
    summary: `${API_BASE_URL}/dashboard/summary`,
  },
  reconciliation: {
    submit: `${API_BASE_URL}/reconciliation/submit`,
    report: `${API_BASE_URL}/reconciliation/report`,
  },
  reports: {
    reconciliation: `${API_BASE_URL}/reports/reconciliation`,
    discrepancy: `${API_BASE_URL}/reports/discrepancy`,
    audit: `${API_BASE_URL}/reports/audit`,
  },
  locations: {
    hierarchy: `${API_BASE_URL}/locations/hierarchy`,
    companies: `${API_BASE_URL}/locations/companies`,
    countries: `${API_BASE_URL}/locations/countries`,
    regions: `${API_BASE_URL}/locations/regions`,
    zones: `${API_BASE_URL}/locations/zones`,
    sites: `${API_BASE_URL}/locations/sites`,
    entities: `${API_BASE_URL}/locations/entities`,
    buildings: `${API_BASE_URL}/locations/buildings`,
    wings: `${API_BASE_URL}/locations/wings`,
    areas: `${API_BASE_URL}/locations/areas`,
    floors: `${API_BASE_URL}/locations/floors`,
    units: `${API_BASE_URL}/locations/units`,
    rooms: `${API_BASE_URL}/locations/rooms`,
  },
  thirdParty: {
    submissions: `${API_BASE_URL}/third-party/submissions`,
    verify: `${API_BASE_URL}/third-party/verify`,
    addAsset: `${API_BASE_URL}/third-party/add-asset`,
  },
  admin: {
    approveAsset: `${API_BASE_URL}/admin/approve-asset`,
    rejectAsset: `${API_BASE_URL}/admin/reject-asset`,
    sendVerificationRequest: `${API_BASE_URL}/admin/send-verification-request`,
  },
  employee: {
    verifyAssets: `${API_BASE_URL}/employee/verify-assets`,
    addMissingAsset: `${API_BASE_URL}/employee/add-missing-asset`,
    submitVerification: `${API_BASE_URL}/employee/submit-verification`,
  },
} as const;

export async function apiClient<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    sessionStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
