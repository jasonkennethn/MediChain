export type UserRole = 'admin' | 'patient' | 'hospital' | 'pharmacy';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  aadharNumber?: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: MedicalRecord[];
}

export interface Hospital extends User {
  role: 'hospital';
  hospitalName: string;
  registrationNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  specializations?: string[];
  facilities?: string[];
  isVerified: boolean;
}

export interface Pharmacy extends User {
  role: 'pharmacy';
  pharmacyName: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isVerified: boolean;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  hospitalId: string;
  doctorName: string;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  date: Date;
  attachments?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  type: 'phone' | 'aadhar';
  value: string;
}
