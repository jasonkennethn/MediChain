'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, 
  Calendar, 
  FileText, 
  Clock, 
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronRight,
  Heart,
  Pill,
  Building2,
  Stethoscope,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Search,
  MapPin,
  Phone,
  Mail,
  ListFilter,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '../store/auth-store';
import { ThemeToggle } from '../components/theme-toggle';
import { VoiceInput } from '@/components/ui/voice-input';
import { 
  apiGetProfile, 
  apiGetHospitals, 
  apiGetDoctors, 
  apiGetAppointments, 
  apiCreateAppointment, 
  apiUpdateAppointment,
  apiUpdateProfile, 
  apiCreateDoctor, 
  apiUpdateDoctor, 
  apiDeleteDoctor,
  apiAdminGetHospitals,
  apiAdminGetPharmacies,
  apiAdminVerifyEntity,
  apiGetPharmacies
} from '@/lib/api';

import { PatientDashboard } from '@/components/dashboard/patient-dashboard';
import { HospitalDashboard } from '@/components/dashboard/hospital-dashboard';
import { PharmacyDashboard } from '@/components/dashboard/pharmacy-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Patient Dashboard States
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [hospitalDoctors, setHospitalDoctors] = useState<any[]>([]);
  const [bookingDocId, setBookingDocId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Hospital Dashboard States
  const [myDoctors, setMyDoctors] = useState<any[]>([]);
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('');
  const [newDocQual, setNewDocQual] = useState('');
  const [newDocExp, setNewDocExp] = useState(0);
  const [newDocFee, setNewDocFee] = useState(0);
  const [docLoading, setDocLoading] = useState(false);
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [updatingAptId, setUpdatingAptId] = useState<string | null>(null);


  // Admin Dashboard States
  const [allHospitals, setAllHospitals] = useState<any[]>([]);
  const [allPharmacies, setAllPharmacies] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<'hospitals' | 'pharmacies'>('hospitals');

  // Edit Profile States
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAadhar, setEditAadhar] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editExtraPhone, setEditExtraPhone] = useState('');
  // Hospital specific
  const [editHospitalName, setEditHospitalName] = useState('');
  const [editRegNum, setEditRegNum] = useState('');
  // Pharmacy specific
  const [editPharmacyName, setEditPharmacyName] = useState('');
  const [editLicNum, setEditLicNum] = useState('');
  // Patient specific
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('male');
  const [editBlood, setEditBlood] = useState('O+');
  const [editEmergency, setEditEmergency] = useState('');

  // Pharmacy Inventory simulation (consistent local state for UX)
  const [pharmacyOrders, setPharmacyOrders] = useState<any[]>([
    { id: 1, patient: 'John Doe', medicine: 'Amoxicillin 500mg', quantity: 10, date: 'Today, 11:30 AM', status: 'Pending' },
    { id: 2, patient: 'Jane Smith', medicine: 'Metformin 850mg', quantity: 30, date: 'Yesterday, 4:15 PM', status: 'Dispensed' }
  ]);
  const [pharmacyInventory, setPharmacyInventory] = useState<any[]>([
    { id: 1, name: 'Paracetamol 650mg', stock: 120, location: 'Shelf A3' },
    { id: 2, name: 'Amoxicillin 500mg', stock: 45, location: 'Shelf B1' },
    { id: 3, name: 'Metformin 850mg', stock: 80, location: 'Shelf A5' },
    { id: 4, name: 'Cetirizine 10mg', stock: 200, location: 'Shelf C2' }
  ]);
  const [scanMedicine, setScanMedicine] = useState('');
  const [scanQty, setScanQty] = useState(1);
  const [scanPatient, setScanPatient] = useState('');
  const [addInvName, setAddInvName] = useState('');
  const [addInvStock, setAddInvStock] = useState(10);
  const [addInvLoc, setAddInvLoc] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      fetchDashboardData();
    }
  }, [isAuthenticated, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const profileRes = await apiGetProfile();
      if (profileRes.success) {
        setProfile(profileRes.profile);
        
        // Initialize profile editing fields
        setEditName(profileRes.user.name || '');
        setEditEmail(profileRes.user.email || '');
        setEditAadhar(profileRes.user.aadhar_number || '');

        if (profileRes.user.role === 'patient' && profileRes.profile) {
          setEditDob(profileRes.profile.date_of_birth || '');
          setEditGender(profileRes.profile.gender || 'male');
          setEditBlood(profileRes.profile.blood_group || 'O+');
          setEditEmergency(profileRes.profile.emergency_contact || '');
          setEditAddress(profileRes.profile.address || '');
          setEditCity(profileRes.profile.city || '');
          setEditState(profileRes.profile.state || '');
          setEditPincode(profileRes.profile.pincode || '');
        } else if (profileRes.user.role === 'hospital' && profileRes.profile) {
          setEditHospitalName(profileRes.profile.hospital_name || '');
          setEditRegNum(profileRes.profile.registration_number || '');
          setEditAddress(profileRes.profile.address || '');
          setEditCity(profileRes.profile.city || '');
          setEditState(profileRes.profile.state || '');
          setEditPincode(profileRes.profile.pincode || '');
          setEditExtraPhone(profileRes.profile.phone || '');
        } else if (profileRes.user.role === 'pharmacy' && profileRes.profile) {
          setEditPharmacyName(profileRes.profile.pharmacy_name || '');
          setEditLicNum(profileRes.profile.license_number || '');
          setEditAddress(profileRes.profile.address || '');
          setEditCity(profileRes.profile.city || '');
          setEditState(profileRes.profile.state || '');
          setEditPincode(profileRes.profile.pincode || '');
          setEditExtraPhone(profileRes.profile.phone || '');
        }
      }

      // Fetch role-specific details
      if (user?.role === 'patient') {
        const hospitalList = await apiGetHospitals();
        setHospitals(hospitalList);
        const pharmacyList = await apiGetPharmacies();
        setPharmacies(pharmacyList);
        const apts = await apiGetAppointments();
        setAppointments(apts);
      } else if (user?.role === 'hospital') {
        // We need to fetch the doctors of this hospital
        if (profileRes.profile?.id) {
          const docs = await apiGetDoctors(profileRes.profile.id);
          setMyDoctors(docs);
        }
        const apts = await apiGetAppointments();
        setAppointments(apts);
      } else if (user?.role === 'admin') {
        const allHosp = await apiAdminGetHospitals();
        setAllHospitals(allHosp);
        const allPharm = await apiAdminGetPharmacies();
        setAllPharmacies(allPharm);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-chart-5/15 text-chart-5 border-chart-5/30';
      case 'hospital': return 'bg-primary/15 text-primary border-primary/30';
      case 'pharmacy': return 'bg-accent/15 text-accent border-accent/30';
      default: return 'bg-primary/15 text-primary border-primary/30';
    }
  };

  // Hospital Select Callback (Patient flow)
  const selectHospital = async (hosp: any) => {
    setSelectedHospital(hosp);
    setBookingDocId('');
    try {
      const docs = await apiGetDoctors(hosp.id);
      setHospitalDoctors(docs);
    } catch {
      setHospitalDoctors([]);
    }
  };

  // Book Appointment Submission
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDocId || !bookingDate) {
      setMessage({ type: 'error', text: 'Doctor and date/time are required' });
      return;
    }

    setBookingLoading(true);
    setMessage(null);
    try {
      const res = await apiCreateAppointment({
        doctor: bookingDocId,
        hospital: selectedHospital.id,
        appointment_date: new Date(bookingDate).toISOString(),
        reason: bookingReason,
      });

      if (res) {
        setMessage({ type: 'success', text: 'Appointment booked successfully!' });
        // Refresh appointments list
        const apts = await apiGetAppointments();
        setAppointments(apts);
        // Clear booking inputs
        setBookingDate('');
        setBookingReason('');
        setBookingDocId('');
        setSelectedHospital(null);
      } else {
        setMessage({ type: 'error', text: 'Failed to book appointment' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server connection error' });
    } finally {
      setBookingLoading(false);
    }
  };

  // Add Doctor Submission (Hospital flow)
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocSpec) {
      setMessage({ type: 'error', text: 'Doctor name and specialization are required' });
      return;
    }

    setDocLoading(true);
    setMessage(null);
    try {
      const res = await apiCreateDoctor({
        name: newDocName,
        phone_number: newDocPhone || undefined,
        email: newDocEmail || undefined,
        specialization: newDocSpec,
        qualification: newDocQual || undefined,
        experience_years: Number(newDocExp) || 0,
        consultation_fee: Number(newDocFee) || 0,
        is_available: true
      });

      if (res) {
        setMessage({ type: 'success', text: `Dr. ${newDocName} added successfully!` });
        // Refresh doctors
        if (profile?.id) {
          const docs = await apiGetDoctors(profile.id);
          setMyDoctors(docs);
        }
        // Reset form
        setNewDocName('');
        setNewDocPhone('');
        setNewDocEmail('');
        setNewDocSpec('');
        setNewDocQual('');
        setNewDocExp(0);
        setNewDocFee(0);
        setShowAddDocForm(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to add doctor' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server connection error' });
    } finally {
      setDocLoading(false);
    }
  };

  // Delete Doctor (Hospital flow)
  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      const ok = await apiDeleteDoctor(id);
      if (ok) {
        setMessage({ type: 'success', text: 'Doctor removed successfully.' });
        if (profile?.id) {
          const docs = await apiGetDoctors(profile.id);
          setMyDoctors(docs);
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to delete doctor.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server connection error' });
    }
  };

  // Toggle Doctor Availability (Hospital flow)
  const handleToggleDocAvailability = async (doc: any) => {
    try {
      const res = await apiUpdateDoctor(doc.id, { is_available: !doc.is_available });
      if (res) {
        if (profile?.id) {
          const docs = await apiGetDoctors(profile.id);
          setMyDoctors(docs);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Appointment Clinical Notes (Hospital flow)
  const handleSaveNotes = async (aptId: string) => {
    if (!aptId) return;
    setUpdatingAptId(aptId);
    try {
      const res = await apiUpdateAppointment(aptId, { notes: editingNotesText });
      if (res) {
        setMessage({ type: 'success', text: 'Clinical notes saved successfully!' });
        // Update local appointments list state to reflect the saved notes immediately
        setAppointments(prev => prev.map(apt => apt.id === aptId ? { ...apt, notes: res.notes } : apt));
        setEditingAptId(null);
      } else {
        setMessage({ type: 'error', text: 'Failed to update clinical notes.' });
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      setMessage({ type: 'error', text: 'Server connection error.' });
    } finally {
      setUpdatingAptId(null);
    }
  };


  // Update Profile Submission
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload: any = {
      name: editName,
      email: editEmail,
      aadhar_number: editAadhar || null,
      profile: {}
    };

    if (user.role === 'patient') {
      payload.profile = {
        date_of_birth: editDob || null,
        gender: editGender,
        blood_group: editBlood,
        emergency_contact: editEmergency,
        address: editAddress,
        city: editCity,
        state: editState,
        pincode: editPincode
      };
    } else if (user.role === 'hospital') {
      payload.profile = {
        hospital_name: editHospitalName,
        registration_number: editRegNum,
        address: editAddress,
        city: editCity,
        state: editState,
        pincode: editPincode,
        phone: editExtraPhone,
        email: editEmail
      };
    } else if (user.role === 'pharmacy') {
      payload.profile = {
        pharmacy_name: editPharmacyName,
        license_number: editLicNum,
        address: editAddress,
        city: editCity,
        state: editState,
        pincode: editPincode,
        phone: editExtraPhone,
        email: editEmail
      };
    }

    try {
      const res = await apiUpdateProfile(payload);
      if (res && res.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setProfile(res.profile);
        setShowProfileEdit(false);
        // Refresh local store user details if needed, or simply re-fetch
        fetchDashboardData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile. Check form fields.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server connection error.' });
    } finally {
      setLoading(false);
    }
  };

  // Verification Toggle (Admin flow)
  const handleToggleVerify = async (entityType: 'hospital' | 'pharmacy', entityId: string, currentStatus: boolean) => {
    try {
      const res = await apiAdminVerifyEntity(entityType, entityId, !currentStatus);
      if (res && res.success) {
        setMessage({ type: 'success', text: `Status updated successfully!` });
        // Refresh list
        if (entityType === 'hospital') {
          const list = await apiAdminGetHospitals();
          setAllHospitals(list);
        } else {
          const list = await apiAdminGetPharmacies();
          setAllPharmacies(list);
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Verification toggle failed' });
    }
  };

  // Pharmacy Inventory/Order simulation functions
  const handleScanPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanMedicine || !scanPatient) return;
    const newOrder = {
      id: pharmacyOrders.length + 1,
      patient: scanPatient,
      medicine: scanMedicine,
      quantity: Number(scanQty),
      date: 'Just now',
      status: 'Pending'
    };
    setPharmacyOrders([newOrder, ...pharmacyOrders]);
    setScanMedicine('');
    setScanPatient('');
    setMessage({ type: 'success', text: `Scanned Prescription for ${scanPatient}` });
  };

  const handleDispense = (id: number) => {
    setPharmacyOrders(
      pharmacyOrders.map(order => 
        order.id === id ? { ...order, status: 'Dispensed' } : order
      )
    );
    setMessage({ type: 'success', text: 'Medication dispensed successfully!' });
  };

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInvName) return;
    const newItem = {
      id: pharmacyInventory.length + 1,
      name: addInvName,
      stock: Number(addInvStock),
      location: addInvLoc || 'General Rack'
    };
    setPharmacyInventory([...pharmacyInventory, newItem]);
    setAddInvName('');
    setAddInvStock(10);
    setAddInvLoc('');
    setMessage({ type: 'success', text: `Added ${addInvName} to stock` });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Global Notifications */}
      {message && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-lg border animate-slide-up max-w-sm flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-primary/10 border-primary/20 text-primary-foreground dark:text-primary' 
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <div>
            <p className="font-semibold text-sm capitalize">{message.type}</p>
            <p className="text-xs opacity-90">{message.text}</p>
          </div>
          <button onClick={() => setMessage(null)} className="ml-auto text-xs font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-foreground">MediChain</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setShowProfileEdit(true)}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-lg">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">Welcome, {user.name}!</h1>
                <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                  {user.role === 'admin' ? 'Platform Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5">
                {user.role === 'patient' && 'Manage your appointments, health metrics, and medical records.'}
                {user.role === 'hospital' && 'Manage doctors, view appointments, and update clinic details.'}
                {user.role === 'pharmacy' && 'Scan prescriptions, dispense medication, and view inventory.'}
                {user.role === 'admin' && 'Verify and manage platform hospitals and pharmacies.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowProfileEdit(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            {user.role === 'hospital' && (
              <Button onClick={() => setShowAddDocForm(!showAddDocForm)} className="shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                Add Doctor
              </Button>
            )}
          </div>
        </div>

        {/* Profile Update Panel (Collapsible Overlay) */}
        {showProfileEdit && (
          <Card className="mb-8 border-primary/30 shadow-lg animate-slide-down">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Update Account Information</span>
                <Button variant="ghost" size="sm" onClick={() => setShowProfileEdit(false)}>Cancel</Button>
              </CardTitle>
              <CardDescription>Edit details displayed in MediChain directories and forms</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Full Name</Label>
                    <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email Address</Label>
                    <Input id="editEmail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editAadhar">Aadhar Number (12 digits)</Label>
                    <Input id="editAadhar" value={editAadhar} maxLength={12} onChange={(e) => setEditAadhar(e.target.value.replace(/\D/g, ''))} />
                  </div>

                  {user.role === 'patient' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="editDob">Date of Birth</Label>
                        <Input id="editDob" type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editGender">Gender</Label>
                        <select id="editGender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editBlood">Blood Group</Label>
                        <Input id="editBlood" placeholder="e.g. O+, A-" value={editBlood} onChange={(e) => setEditBlood(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editEmergency">Emergency Contact</Label>
                        <Input id="editEmergency" value={editEmergency} onChange={(e) => setEditEmergency(e.target.value)} />
                      </div>
                    </>
                  )}

                  {user.role === 'hospital' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="editHospitalName">Hospital Name</Label>
                        <Input id="editHospitalName" value={editHospitalName} onChange={(e) => setEditHospitalName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editRegNum">Registration Number</Label>
                        <Input id="editRegNum" value={editRegNum} onChange={(e) => setEditRegNum(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editExtraPhone">Hospital Contact Phone</Label>
                        <Input id="editExtraPhone" value={editExtraPhone} onChange={(e) => setEditExtraPhone(e.target.value)} />
                      </div>
                    </>
                  )}

                  {user.role === 'pharmacy' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="editPharmacyName">Pharmacy Name</Label>
                        <Input id="editPharmacyName" value={editPharmacyName} onChange={(e) => setEditPharmacyName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editLicNum">License Number</Label>
                        <Input id="editLicNum" value={editLicNum} onChange={(e) => setEditLicNum(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editExtraPhone">Pharmacy Contact Phone</Label>
                        <Input id="editExtraPhone" value={editExtraPhone} onChange={(e) => setEditExtraPhone(e.target.value)} />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="editAddress">Street Address</Label>
                    <Input id="editAddress" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editCity">City</Label>
                    <Input id="editCity" value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editState">State</Label>
                    <Input id="editState" value={editState} onChange={(e) => setEditState(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPincode">Pincode (6 digits)</Label>
                    <Input id="editPincode" maxLength={6} value={editPincode} onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowProfileEdit(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>Save Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Fetching real-time records...</p>
          </div>
        )}

        {!loading && (
          <>
            {user.role === 'patient' && (
              <PatientDashboard
                profile={profile}
                hospitals={hospitals}
                pharmacies={pharmacies}
                appointments={appointments}
                selectedHospital={selectedHospital}
                selectHospital={selectHospital}
                setSelectedHospital={setSelectedHospital}
                hospitalDoctors={hospitalDoctors}
                bookingDocId={bookingDocId}
                setBookingDocId={setBookingDocId}
                bookingDate={bookingDate}
                setBookingDate={setBookingDate}
                bookingReason={bookingReason}
                setBookingReason={setBookingReason}
                bookingLoading={bookingLoading}
                handleBookAppointment={handleBookAppointment}
              />
            )}

            {user.role === 'hospital' && (
              <HospitalDashboard
                myDoctors={myDoctors}
                showAddDocForm={showAddDocForm}
                setShowAddDocForm={setShowAddDocForm}
                newDocName={newDocName}
                setNewDocName={setNewDocName}
                newDocSpec={newDocSpec}
                setNewDocSpec={setNewDocSpec}
                newDocQual={newDocQual}
                setNewDocQual={setNewDocQual}
                newDocPhone={newDocPhone}
                setNewDocPhone={setNewDocPhone}
                newDocEmail={newDocEmail}
                setNewDocEmail={setNewDocEmail}
                newDocExp={newDocExp}
                setNewDocExp={setNewDocExp}
                newDocFee={newDocFee}
                setNewDocFee={setNewDocFee}
                docLoading={docLoading}
                handleAddDoctor={handleAddDoctor}
                handleDeleteDoctor={handleDeleteDoctor}
                handleToggleDocAvailability={handleToggleDocAvailability}
                appointments={appointments}
                editingAptId={editingAptId}
                setEditingAptId={setEditingAptId}
                editingNotesText={editingNotesText}
                setEditingNotesText={setEditingNotesText}
                updatingAptId={updatingAptId}
                handleSaveNotes={handleSaveNotes}
                router={router}
              />
            )}

            {user.role === 'pharmacy' && (
              <PharmacyDashboard
                handleScanPrescription={handleScanPrescription}
                scanPatient={scanPatient}
                setScanPatient={setScanPatient}
                scanMedicine={scanMedicine}
                setScanMedicine={setScanMedicine}
                scanQty={scanQty}
                setScanQty={setScanQty}
                pharmacyOrders={pharmacyOrders}
                handleDispense={handleDispense}
                handleAddInventory={handleAddInventory}
                addInvName={addInvName}
                setAddInvName={setAddInvName}
                addInvStock={addInvStock}
                setAddInvStock={setAddInvStock}
                addInvLoc={addInvLoc}
                setAddInvLoc={setAddInvLoc}
                pharmacyInventory={pharmacyInventory}
              />
            )}

            {user.role === 'admin' && (
              <AdminDashboard
                allHospitals={allHospitals}
                allPharmacies={allPharmacies}
                adminTab={adminTab}
                setAdminTab={setAdminTab}
                handleToggleVerify={handleToggleVerify}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
