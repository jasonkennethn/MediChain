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
            {/* ─── ROLE 1: PATIENT DASHBOARD ─── */}
            {user.role === 'patient' && (
              <div className="space-y-8 animate-fade-in">
                {/* Health Metrics & Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{profile?.blood_group || 'Not set'}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                          <Heart className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                          <p className="text-sm font-semibold text-foreground mt-2 truncate max-w-[120px]">
                            {profile?.emergency_contact || 'None'}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Phone className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Location</p>
                          <p className="text-sm font-semibold text-foreground mt-2 truncate max-w-[120px]">
                            {profile?.city ? `${profile.city}, ${profile.state}` : 'Not set'}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                          <MapPin className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{appointments.length}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
                          <Calendar className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left columns: Directory (Hospitals & Booking) */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <span>Search Available Hospitals</span>
                        </CardTitle>
                        <CardDescription>Book an appointment at a registered healthcare facility</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {hospitals.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            No verified hospitals available currently.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {hospitals.map((hosp) => (
                              <div key={hosp.id} className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                  <h3 className="font-bold text-lg text-foreground">{hosp.hospital_name}</h3>
                                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {hosp.address}, {hosp.city}, {hosp.state} - {hosp.pincode}
                                  </p>
                                  <div className="flex gap-2 flex-wrap mt-2">
                                    {hosp.specializations?.slice(0, 3).map((spec: string) => (
                                      <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                                    ))}
                                    {hosp.specializations?.length > 3 && (
                                      <Badge variant="outline" className="text-xs">+{hosp.specializations.length - 3} more</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button size="sm" onClick={() => selectHospital(hosp)}>
                                  Book Appointment
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Booking Form (Conditional) */}
                    {selectedHospital && (
                      <Card className="border-primary/40 shadow-lg animate-slide-down">
                        <CardHeader className="bg-primary/5">
                          <CardTitle className="text-lg">Book Appointment at {selectedHospital.hospital_name}</CardTitle>
                          <CardDescription>Select a physician, date, and reason for consultation</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <form onSubmit={handleBookAppointment} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="bookingDoc">Select Doctor</Label>
                                <select id="bookingDoc" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={bookingDocId} onChange={(e) => setBookingDocId(e.target.value)} required>
                                  <option value="">-- Choose Doctor --</option>
                                  {hospitalDoctors.map((doc) => (
                                    <option key={doc.id} value={doc.id}>
                                      Dr. {doc.name} ({doc.specialization}) - ₹{doc.consultation_fee}
                                    </option>
                                  ))}
                                </select>
                                {hospitalDoctors.length === 0 && (
                                  <p className="text-xs text-destructive mt-1">No available doctors found for this hospital.</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="bookingDate">Appointment Date & Time</Label>
                                <Input id="bookingDate" type="datetime-local" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="bookingReason">Reason for Consultation</Label>
                              <div className="flex gap-2">
                                <Input id="bookingReason" className="flex-1" placeholder="Describe symptoms or checkup purpose (or click mic to dictate)" value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} />
                                <VoiceInput onTranscript={(text) => setBookingReason(prev => prev ? `${prev} ${text}` : text)} placeholder="Dictate reason" />
                              </div>
                            </div>


                            <div className="flex justify-end gap-2 pt-2">
                              <Button type="button" variant="outline" onClick={() => setSelectedHospital(null)}>Cancel</Button>
                              <Button type="submit" disabled={bookingLoading || !bookingDocId} className="shadow-md shadow-primary/10">
                                {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right column: Appointments & pharmacies list */}
                  <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <span>My Appointments</span>
                        </CardTitle>
                        <CardDescription>Your healthcare history</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {appointments.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            <Calendar className="mx-auto h-8 w-8 opacity-40 mb-2" />
                            No scheduled appointments yet.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {appointments.map((apt) => (
                              <div key={apt.id} className="p-3 border border-border/50 rounded-lg bg-card space-y-1.5">
                                <div className="flex justify-between items-start">
                                  <p className="font-semibold text-foreground text-sm">Dr. {apt.doctor_name}</p>
                                  <Badge className="text-[10px] px-1.5 py-0.5 capitalize" variant={apt.status === 'scheduled' ? 'default' : 'secondary'}>
                                    {apt.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{apt.doctor_specialization} @ {apt.hospital_name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-primary" />
                                  {new Date(apt.appointment_date).toLocaleString()}
                                </p>
                                {apt.reason && <p className="text-xs italic text-muted-foreground border-t pt-1.5 mt-1.5">" {apt.reason} "</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Verified Pharmacies list */}
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Pill className="h-4.5 w-4.5 text-accent" />
                          <span>Partner Pharmacies</span>
                        </CardTitle>
                        <CardDescription>Verified medical shops nearby</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {pharmacies.length === 0 ? (
                          <div className="text-center text-muted-foreground text-xs py-4">No verified pharmacies available.</div>
                        ) : (
                          <div className="space-y-2">
                            {pharmacies.map((pharm) => (
                              <div key={pharm.id} className="p-2 border border-border/40 rounded-lg text-xs">
                                <p className="font-bold text-foreground">{pharm.pharmacy_name}</p>
                                <p className="text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" /> {pharm.city}</p>
                                <p className="text-muted-foreground mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" /> {pharm.phone || 'N/A'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* ─── ROLE 2: HOSPITAL DASHBOARD ─── */}
            {user.role === 'hospital' && (
              <div className="space-y-8 animate-fade-in">
                {/* Doctor creation form overlay */}
                {showAddDocForm && (
                  <Card className="border-primary/40 shadow-lg animate-slide-down">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="text-lg">Add New Doctor to Staff</CardTitle>
                      <CardDescription>Provide details to list this physician in the booking directory</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <form onSubmit={handleAddDoctor} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="docName">Doctor Name *</Label>
                            <Input id="docName" placeholder="e.g. Rahul Patel" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="docSpec">Specialization *</Label>
                            <Input id="docSpec" placeholder="e.g. Cardiologist" value={newDocSpec} onChange={(e) => setNewDocSpec(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="docQual">Qualification</Label>
                            <Input id="docQual" placeholder="e.g. MBBS, MD" value={newDocQual} onChange={(e) => setNewDocQual(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="docPhone">Contact Phone</Label>
                            <Input id="docPhone" value={newDocPhone} onChange={(e) => setNewDocPhone(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="docEmail">Contact Email</Label>
                            <Input id="docEmail" type="email" value={newDocEmail} onChange={(e) => setNewDocEmail(e.target.value)} />
                          </div>
                          <div className="space-y-2 flex gap-4">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor="docExp">Exp. (Years)</Label>
                              <Input id="docExp" type="number" min="0" value={newDocExp} onChange={(e) => setNewDocExp(Number(e.target.value))} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label htmlFor="docFee">Fee (₹)</Label>
                              <Input id="docFee" type="number" min="0" value={newDocFee} onChange={(e) => setNewDocFee(Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button type="button" variant="outline" onClick={() => setShowAddDocForm(false)}>Cancel</Button>
                          <Button type="submit" disabled={docLoading}>
                            {docLoading ? 'Adding...' : 'Save Staff Member'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Manage Doctors */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-primary" />
                            <span>Staff Doctors ({myDoctors.length})</span>
                          </CardTitle>
                          <CardDescription>Manage physician listings and availability status</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setShowAddDocForm(!showAddDocForm)}>
                          <Plus className="mr-1 h-4 w-4" /> Add Doctor
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {myDoctors.length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground text-sm">
                            No doctors registered yet. Add doctors to allow patient booking.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myDoctors.map((doc) => (
                              <div key={doc.id} className="p-4 rounded-xl border border-border/50 bg-card flex flex-col justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-foreground text-base">Dr. {doc.name}</h4>
                                    <button onClick={() => handleDeleteDoctor(doc.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-primary font-medium">{doc.specialization} {doc.qualification && `(${doc.qualification})`}</p>
                                  <p className="text-xs text-muted-foreground">{doc.experience_years} years experience</p>
                                  <p className="text-xs font-semibold text-foreground mt-2">Consultation Fee: ₹{doc.consultation_fee}</p>
                                </div>
                                <div className="border-t pt-2.5 flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">Online Booking:</span>
                                  <Button size="sm" variant={doc.is_available ? 'outline' : 'secondary'} className={`h-7 px-2.5 text-xs ${doc.is_available ? 'border-primary/30 text-primary bg-primary/5' : ''}`} onClick={() => handleToggleDocAvailability(doc)}>
                                    {doc.is_available ? 'Available' : 'Unavailable'}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Appointments booked */}
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span>Incoming Appointments</span>
                      </CardTitle>
                      <CardDescription>Patient bookings at your hospital</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {appointments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                          No appointments booked yet.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {appointments.map((apt) => (
                            <div key={apt.id} className="p-3 border border-border/50 rounded-lg space-y-1.5 text-xs bg-card hover:border-primary/20 transition-all">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-foreground">{apt.patient_name}</span>
                                <Badge variant="outline" className="text-[10px] capitalize">{apt.status}</Badge>
                              </div>
                              <p className="text-muted-foreground">Doctor: Dr. {apt.doctor_name} ({apt.doctor_specialization})</p>
                              <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" /> {new Date(apt.appointment_date).toLocaleString()}</p>
                              {apt.reason && (
                                <div className="space-y-0.5 mt-1">
                                  <span className="text-[10px] font-medium text-muted-foreground">Reason for Visit:</span>
                                  <p className="italic text-muted-foreground bg-muted/40 p-2 rounded-md">"{apt.reason}"</p>
                                </div>
                              )}
                              
                              {/* Clinical Notes Section */}
                              {editingAptId === apt.id ? (
                                <div className="space-y-2 mt-2.5 border-t pt-2.5 animate-in fade-in duration-200">
                                  <div className="flex justify-between items-center">
                                    <Label htmlFor={`notes-${apt.id}`} className="font-semibold text-foreground text-[11px]">Clinical Notes & Instructions</Label>
                                  </div>
                                  <textarea
                                    id={`notes-${apt.id}`}
                                    className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                                    value={editingNotesText}
                                    onChange={(e) => setEditingNotesText(e.target.value)}
                                    placeholder="Enter clinical notes, instructions, or prescription..."
                                    disabled={updatingAptId === apt.id}
                                  />
                                  <div className="flex justify-between items-center gap-2">
                                    <VoiceInput
                                      onTranscript={(text) => setEditingNotesText(prev => prev ? `${prev} ${text}` : text)}
                                      placeholder="Dictate notes"
                                    />
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs px-2"
                                        onClick={() => setEditingAptId(null)}
                                        disabled={updatingAptId === apt.id}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="h-7 text-xs px-3"
                                        onClick={() => handleSaveNotes(apt.id)}
                                        disabled={updatingAptId === apt.id}
                                      >
                                        {updatingAptId === apt.id ? 'Saving...' : 'Save'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2 mt-2.5 border-t pt-2.5">
                                  {apt.notes ? (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-semibold text-foreground">Clinical Notes:</span>
                                      <p className="text-muted-foreground bg-primary/5 border border-primary/10 p-2 rounded-md whitespace-pre-wrap leading-relaxed">
                                        {apt.notes}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground/60 italic text-[10px]">No clinical notes added yet.</p>
                                  )}
                                  <div className="flex justify-end gap-2 mt-1">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-7 text-xs px-3 gap-1 rounded-md bg-chart-2 text-white hover:bg-chart-2/90"
                                      onClick={() => router.push(`/dashboard/consultation/${apt.id}`)}
                                    >
                                      <Stethoscope className="h-3 w-3" />
                                      Diagnose
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-primary hover:text-primary-foreground hover:bg-primary px-2 gap-1 rounded-md"
                                      onClick={() => {
                                        setEditingAptId(apt.id);
                                        setEditingNotesText(apt.notes || '');
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                      {apt.notes ? 'Edit Notes' : 'Add Notes'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ─── ROLE 3: PHARMACY DASHBOARD ─── */}
            {user.role === 'pharmacy' && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Prescription Scan Simulator */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Pill className="h-5 w-5 text-accent" />
                          <span>Simulate Prescription Order</span>
                        </CardTitle>
                        <CardDescription>Simulates receiving/scanning a patient prescription</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleScanPrescription} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="scanPatient">Patient Name</Label>
                              <Input id="scanPatient" placeholder="e.g. John Doe" value={scanPatient} onChange={(e) => setScanPatient(e.target.value)} required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="scanMedicine">Medicine Name</Label>
                              <Input id="scanMedicine" placeholder="e.g. Paracetamol 500mg" value={scanMedicine} onChange={(e) => setScanMedicine(e.target.value)} required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="scanQty">Quantity</Label>
                              <Input id="scanQty" type="number" min="1" value={scanQty} onChange={(e) => setScanQty(Number(e.target.value))} required />
                            </div>
                          </div>
                          <Button type="submit" variant="outline" className="w-full border-accent/30 hover:bg-accent/5 hover:border-accent/50 text-accent">
                            <Plus className="mr-1 h-4 w-4" /> Scan & Record Prescription
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Orders Queue */}
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle>Prescription Order Queue</CardTitle>
                        <CardDescription>Manage active orders and dispatch status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {pharmacyOrders.map((order) => (
                            <div key={order.id} className="p-3 border border-border/50 rounded-lg flex items-center justify-between text-sm">
                              <div>
                                <p className="font-bold text-foreground">{order.medicine} x {order.quantity}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Patient: {order.patient} | {order.date}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className="text-xs" variant={order.status === 'Dispensed' ? 'secondary' : 'default'}>
                                  {order.status}
                                </Badge>
                                {order.status === 'Pending' && (
                                  <Button size="sm" onClick={() => handleDispense(order.id)}>
                                    Dispense
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Inventory */}
                  <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4.5 w-4.5 text-accent" />
                          <span>Store Inventory</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Add inventory form */}
                        <form onSubmit={handleAddInventory} className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                          <p className="text-xs font-semibold text-foreground">Add Stock Item</p>
                          <Input placeholder="Medicine name" size="sm" className="h-8 text-xs" value={addInvName} onChange={(e) => setAddInvName(e.target.value)} required />
                          <div className="flex gap-2">
                            <Input placeholder="Qty" type="number" min="1" className="h-8 text-xs flex-1" value={addInvStock} onChange={(e) => setAddInvStock(Number(e.target.value))} required />
                            <Input placeholder="Loc (e.g. A1)" className="h-8 text-xs flex-1" value={addInvLoc} onChange={(e) => setAddInvLoc(e.target.value)} />
                          </div>
                          <Button type="submit" size="sm" className="w-full text-xs h-8">Add Stock</Button>
                        </form>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {pharmacyInventory.map((item) => (
                            <div key={item.id} className="p-2.5 border border-border/40 rounded-lg flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-foreground">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Location: {item.location}</p>
                              </div>
                              <Badge variant={item.stock < 50 ? 'destructive' : 'outline'} className="text-[10px]">
                                {item.stock} in stock
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* ─── ROLE 4: ADMIN DASHBOARD ─── */}
            {user.role === 'admin' && (
              <div className="space-y-8 animate-fade-in">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Hospitals Registered</p>
                          <p className="text-3xl font-bold text-foreground mt-1">{allHospitals.length}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Building2 className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Pharmacies Registered</p>
                          <p className="text-3xl font-bold text-foreground mt-1">{allPharmacies.length}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                          <Pill className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Global Security Status</p>
                          <p className="text-sm font-semibold text-primary mt-2 flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Active & Secured</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Admin Management Directory */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                    <div>
                      <CardTitle>Platform Verification & Compliance Directory</CardTitle>
                      <CardDescription>Verify newly registered clinics, hospitals and medical retail shops</CardDescription>
                    </div>
                    <div className="flex border rounded-lg overflow-hidden shrink-0 bg-muted/40 p-0.5">
                      <button className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${adminTab === 'hospitals' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`} onClick={() => setAdminTab('hospitals')}>
                        Hospitals
                      </button>
                      <button className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${adminTab === 'pharmacies' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`} onClick={() => setAdminTab('pharmacies')}>
                        Pharmacies
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {adminTab === 'hospitals' && (
                      <div className="space-y-4">
                        {allHospitals.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">No hospitals registered yet.</div>
                        ) : (
                          allHospitals.map((hosp) => (
                            <div key={hosp.id} className="p-4 border border-border/50 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-foreground text-base">{hosp.hospital_name}</h4>
                                  <Badge className="text-[10px]" variant={hosp.is_verified ? 'default' : 'destructive'}>
                                    {hosp.is_verified ? 'Verified' : 'Pending Verification'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {hosp.address}, {hosp.city}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Reg Number: <code className="bg-muted px-1.5 py-0.5 rounded">{hosp.registration_number}</code></p>
                              </div>
                              <Button size="sm" variant={hosp.is_verified ? 'outline' : 'default'} onClick={() => handleToggleVerify('hospital', hosp.id, hosp.is_verified)}>
                                {hosp.is_verified ? 'Revoke Verification' : 'Verify Hospital'}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {adminTab === 'pharmacies' && (
                      <div className="space-y-4">
                        {allPharmacies.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">No pharmacies registered yet.</div>
                        ) : (
                          allPharmacies.map((pharm) => (
                            <div key={pharm.id} className="p-4 border border-border/50 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-foreground text-base">{pharm.pharmacy_name}</h4>
                                  <Badge className="text-[10px]" variant={pharm.is_verified ? 'default' : 'destructive'}>
                                    {pharm.is_verified ? 'Verified' : 'Pending Verification'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {pharm.address}, {pharm.city}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">License Number: <code className="bg-muted px-1.5 py-0.5 rounded">{pharm.license_number}</code></p>
                              </div>
                              <Button size="sm" variant={pharm.is_verified ? 'outline' : 'default'} onClick={() => handleToggleVerify('pharmacy', pharm.id, pharm.is_verified)}>
                                {pharm.is_verified ? 'Revoke Verification' : 'Verify Pharmacy'}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
