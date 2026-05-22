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
    const response = await apiFetch('/doctors/', {
      method: 'POST',
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

// ─── Utility Exports ───

export { clearTokens, getTokens, setTokens };
