'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, LoginCredentials } from '../types';
import {
  apiLogin,
  apiRegister,
  clearTokens,
  type ApiUser,
  type RegisterPayload,
} from '@/lib/api';

/**
 * Maps the Django API user shape to the frontend User type.
 */
function mapApiUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    phoneNumber: apiUser.phone_number,
    aadharNumber: apiUser.aadhar_number ?? undefined,
    email: apiUser.email ?? undefined,
    role: apiUser.role as User['role'],
    staff_role: apiUser.staff_role ?? undefined,
    doctor_profile_id: apiUser.doctor_profile_id ?? undefined,
    hospital_id: apiUser.hospital_id ?? undefined,
    avatar: apiUser.avatar ?? undefined,
    createdAt: new Date(apiUser.created_at),
    updatedAt: new Date(apiUser.updated_at),
  };
}

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });

        const result = await apiLogin({
          type: credentials.type,
          value: credentials.value,
        });

        if (result.success && result.user) {
          const user = mapApiUser(result.user);
          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true, user };
        }

        set({ isLoading: false });
        return {
          success: false,
          error: result.error || 'Login failed',
        };
      },

      register: async (data: RegisterPayload) => {
        set({ isLoading: true });

        const result = await apiRegister(data);

        if (result.success && result.user) {
          const user = mapApiUser(result.user);
          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true, user };
        }

        set({ isLoading: false });
        return {
          success: false,
          error: result.error || 'Registration failed',
        };
      },

      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: () => {
        return get().isAuthenticated;
      },
    }),
    {
      name: 'medichain-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
