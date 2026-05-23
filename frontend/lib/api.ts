/**
 * MediChain API Client
 *
 * Centralised HTTP client that handles JWT authentication,
 * token refresh, and all API communication with the Django backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface TokenPair {
  access: string;
  refresh: string;
}

// ─── Token Storage ───

function getTokens(): TokenPair | null {
  if (typeof window === 'undefined') return null;
  const access = localStorage.getItem('medichain_access_token');
  const refresh = localStorage.getItem('medichain_refresh_token');
  if (access && refresh) return { access, refresh };
  return null;
}

function setTokens(tokens: TokenPair): void {
  localStorage.setItem('medichain_access_token', tokens.access);
  localStorage.setItem('medichain_refresh_token', tokens.refresh);
}

function clearTokens(): void {
  localStorage.removeItem('medichain_access_token');
  localStorage.removeItem('medichain_refresh_token');
}

// ─── Core Fetch Wrapper ───

async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = false,
): Promise<Response> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (requireAuth) {
    const tokens = getTokens();
    if (tokens) {
      headers['Authorization'] = `Bearer ${tokens.access}`;
    }
  }

  let response = await fetch(url, { ...options, headers });

  // If 401, try refreshing the token once
  if (response.status === 401 && requireAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newTokens = getTokens();
      if (newTokens) {
        headers['Authorization'] = `Bearer ${newTokens.access}`;
      }
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}

async function refreshAccessToken(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens?.refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens({
        access: data.access,
        refresh: data.refresh || tokens.refresh,
      });
      return true;
    }
  } catch {
    // Refresh failed
  }

  clearTokens();
  return false;
}

// ─── Auth API ───

export interface LoginPayload {
  type: 'phone' | 'aadhar';
  value: string;
}

export interface RegisterPayload {
  name: string;
  phone_number: string;
  aadhar_number?: string;
  email?: string;
  role?: string;
}

export interface ApiUser {
  id: string;
  name: string;
  phone_number: string;
  aadhar_number: string | null;
  email: string | null;
  role: string;
  staff_role?: string;
  doctor_profile_id?: string;
  hospital_id?: string;
  is_active?: boolean;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  success: boolean;
  user?: ApiUser;
  tokens?: TokenPair;
  error?: string;
}

export async function apiLogin(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await apiFetch('/login/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setTokens(data.tokens);
      return { success: true, user: data.user };
    }

    return {
      success: false,
      error: data.error || 'Login failed. Please try again.',
    };
  } catch {
    return {
      success: false,
      error: 'Cannot connect to server. Please check if the backend is running.',
    };
  }
}

export async function apiRegister(payload: RegisterPayload): Promise<LoginResponse> {
  try {
    const response = await apiFetch('/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setTokens(data.tokens);
      return { success: true, user: data.user };
    }

    // Flatten DRF validation errors
    const errors = Object.values(data).flat().join(', ');
    return {
      success: false,
      error: errors || 'Registration failed. Please try again.',
    };
  } catch {
    return {
      success: false,
      error: 'Cannot connect to server. Please check if the backend is running.',
    };
  }
}

export async function apiGetProfile(): Promise<LoginResponse> {
  try {
    const response = await apiFetch('/profile/', {}, true);
    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, user: data.user };
    }
    return { success: false, error: 'Failed to fetch profile' };
  } catch {
    return { success: false, error: 'Cannot connect to server.' };
  }
}

// ─── Hospitals API ───

export async function apiGetHospitals() {
  try {
    const response = await apiFetch('/hospitals/');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function apiGetHospitalDetail(id: string) {
  try {
    const response = await apiFetch(`/hospitals/${id}/`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Doctors API ───

export async function apiGetDoctors(hospitalId?: string) {
  try {
    const query = hospitalId ? `?hospital=${hospitalId}` : '';
    const response = await apiFetch(`/doctors/${query}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Appointments API ───

export async function apiGetAppointments() {
  try {
    const response = await apiFetch('/appointments/', {}, true);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function apiCreateAppointment(data: {
  doctor: string;
  hospital: string;
  appointment_date: string;
  reason?: string;
  patient?: string;
}) {
  try {
    const response = await apiFetch('/appointments/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiUpdateAppointment(id: string, data: {
  notes?: string;
  reason?: string;
  status?: string;
  symptoms?: any;
  diagnosis?: string;
  prescription_data?: any;
  follow_up_instructions?: string;
  tests_advised?: string;
  transcript?: any;
}) {
  try {
    const response = await apiFetch(`/appointments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}


export async function apiUpdateProfile(data: any) {
  try {
    const response = await apiFetch('/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiGetStaff() {
  try {
    const response = await apiFetch('/hospital/staff/', {}, true);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function apiCreateDoctor(data: {
  name: string;
  phone_number?: string;
  email?: string;
  specialization: string;
  qualification?: string;
  experience_years?: number;
  consultation_fee?: number;
  is_available?: boolean;
}) {
  try {
    // We post to staff endpoint so a login User is created along with the Doctor profile
    const payload = {
      ...data,
      role: 'doctor'
    };
    const response = await apiFetch('/hospital/staff/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiUpdateDoctor(id: string, data: any) {
  try {
    const response = await apiFetch(`/doctors/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiDeleteDoctor(id: string) {
  try {
    const response = await apiFetch(`/doctors/${id}/`, {
      method: 'DELETE',
    }, true);
    return response.ok;
  } catch {
    return false;
  }
}

export async function apiGetPharmacies() {
  try {
    const response = await apiFetch('/pharmacies/');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function apiAdminGetHospitals() {
  try {
    const response = await apiFetch('/admin/hospitals/', {}, true);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function apiAdminGetPharmacies() {
  try {
    const response = await apiFetch('/admin/pharmacies/', {}, true);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function apiAdminVerifyEntity(entityType: 'hospital' | 'pharmacy', entityId: string, isVerified: boolean) {
  try {
    const response = await apiFetch(`/admin/verify/${entityType}/${entityId}/`, {
      method: 'POST',
      body: JSON.stringify({ is_verified: isVerified }),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiUpdateStaff(id: string, data: any) {
  try {
    const response = await apiFetch(`/hospital/staff/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiSubmitFeedback(message: string) {
  try {
    const response = await apiFetch('/feedback/', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiLookupPatient(params: { phone?: string; aadhar?: string }) {
  try {
    const searchParams = new URLSearchParams();
    if (params.phone) searchParams.set('phone', params.phone);
    if (params.aadhar) searchParams.set('aadhar', params.aadhar);
    const response = await apiFetch(`/patients/lookup/?${searchParams.toString()}`, {}, true);
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.patient : null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiGetDoctorAnalytics() {
  try {
    const response = await apiFetch('/doctor/analytics/', {}, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiAddDoctor(data: {
  name: string;
  specialization: string;
  qualification?: string;
  phone?: string;
  email?: string;
  experience_years?: number;
  consultation_fee?: number;
}) {
  try {
    const payload = { ...data, role: 'doctor', phone_number: data.phone };
    const response = await apiFetch('/hospital/staff/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    const errData = await response.json().catch(() => null);
    return { error: errData?.detail || 'Failed to add doctor' };
  } catch {
    return { error: 'Network error' };
  }
}

export async function apiToggleDoctorAvailability(doctorId: string) {
  try {
    const response = await apiFetch(`/doctors/${doctorId}/toggle-availability/`, {
      method: 'POST',
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiToggleStaffAccess(staffId: string) {
  try {
    const response = await apiFetch(`/hospital/staff/${staffId}/toggle-access/`, {
      method: 'POST',
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Pharmacy Operations ───

export async function apiGetPharmacyInventory() {
  try {
    const response = await apiFetch('/pharmacy/inventory/', {}, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiAddPharmacyInventoryItem(data: { medicine_name: string; stock_quantity: number; location?: string }) {
  try {
    const response = await apiFetch('/pharmacy/inventory/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    const errData = await response.json().catch(() => null);
    return { error: errData?.detail || 'Failed to add inventory item' };
  } catch {
    return { error: 'Network error' };
  }
}

export async function apiUpdatePharmacyInventoryItem(id: string, data: { stock_quantity?: number; location?: string }) {
  try {
    const response = await apiFetch(`/pharmacy/inventory/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiDeletePharmacyInventoryItem(id: string) {
  try {
    const response = await apiFetch(`/pharmacy/inventory/${id}/`, {
      method: 'DELETE',
    }, true);
    return response.ok;
  } catch {
    return false;
  }
}

export async function apiGetPharmacyOrders() {
  try {
    const response = await apiFetch('/pharmacy/orders/', {}, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiCreatePharmacyOrder(data: { patient_name: string; medicine_name: string; quantity: number; status?: string }) {
  try {
    const response = await apiFetch('/pharmacy/orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    const errData = await response.json().catch(() => null);
    return { error: errData?.detail || 'Failed to create order' };
  } catch {
    return { error: 'Network error' };
  }
}

export async function apiUpdatePharmacyOrderStatus(id: string, status: string) {
  try {
    const response = await apiFetch(`/pharmacy/orders/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, true);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Utility Exports ───

export { clearTokens, getTokens, setTokens };

