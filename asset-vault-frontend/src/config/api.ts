/**
 * API endpoint configuration used by the frontend.
 *
 * The axios instance in `services/api.ts` already has its baseURL set to
 * `http://localhost:8000/api` (or `VITE_API_BASE_URL`), so these endpoints
 * are defined as paths relative to that base.
 */
const API_BASE_PATH = '';

export const API_ENDPOINTS = {
  auth: {
    sendOtp: `${API_BASE_PATH}/auth/send-otp`,
    verifyOtp: `${API_BASE_PATH}/auth/verify-otp`,
    logout: `${API_BASE_PATH}/auth/logout`,
    me: `${API_BASE_PATH}/auth/me`,
  },
  assets: {
    list: `${API_BASE_PATH}/assets/`,
    create: `${API_BASE_PATH}/assets/`,
    detail: (id: string) => `${API_BASE_PATH}/assets/${id}/`,
    history: (id: string) => `${API_BASE_PATH}/assets/${id}/history/`,
    upload: `${API_BASE_PATH}/assets/upload/`,
    generateQr: `${API_BASE_PATH}/assets/generate-qr/`,
  },
  dashboard: {
    summary: `${API_BASE_PATH}/dashboard/summary/`,
  },
  reconciliation: {
    submit: `${API_BASE_PATH}/reconciliation/submissions/`,
    report: `${API_BASE_PATH}/reconciliation/submissions/`,
  },
  reports: {
    reconciliation: `${API_BASE_PATH}/reports/reconciliation/`,
    discrepancy: `${API_BASE_PATH}/reports/discrepancy/`,
    audit: `${API_BASE_PATH}/reports/audit/`,
  },
  locations: {
    hierarchy: `${API_BASE_PATH}/locations/hierarchy/`,
    companies: `${API_BASE_PATH}/locations/companies/`,
    countries: `${API_BASE_PATH}/locations/countries/`,
    regions: `${API_BASE_PATH}/locations/regions/`,
    zones: `${API_BASE_PATH}/locations/zones/`,
    sites: `${API_BASE_PATH}/locations/sites/`,
    entities: `${API_BASE_PATH}/locations/entities/`,
    buildings: `${API_BASE_PATH}/locations/buildings/`,
    wings: `${API_BASE_PATH}/locations/wings/`,
    areas: `${API_BASE_PATH}/locations/areas/`,
    floors: `${API_BASE_PATH}/locations/floors/`,
    units: `${API_BASE_PATH}/locations/units/`,
    rooms: `${API_BASE_PATH}/locations/rooms/`,
  },
  thirdParty: {
    submissions: `${API_BASE_PATH}/third-party/submissions/`,
    verify: `${API_BASE_PATH}/third-party/verify/`,
    addAsset: `${API_BASE_PATH}/third-party/add-asset/`,
  },
  admin: {
    approveAsset: (id: string) =>
      `${API_BASE_PATH}/third-party/submissions/${id}/approve/`,
    rejectAsset: (id: string) =>
      `${API_BASE_PATH}/third-party/submissions/${id}/reject/`,
  },
} as const;

// The new axios-based client lives in `services/api.ts`. This file is
// intentionally lightweight and only exposes URL helpers.

