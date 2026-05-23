'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/app/store/auth-store';
import { apiGetStaff, apiGetDoctors, apiAddDoctor, apiDeleteDoctor, apiToggleDoctorAvailability, apiToggleStaffAccess } from '@/lib/api';
import { toast } from 'sonner';
import { Users, Stethoscope, Plus, Trash2, Search, Loader2, Shield, ShieldOff, UserPlus } from 'lucide-react';

export default function StaffPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'staff' | 'doctors'>('staff');

  // Add Doctor form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('');
  const [newDocQual, setNewDocQual] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocExp, setNewDocExp] = useState('');
  const [newDocFee, setNewDocFee] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  const staffRole = (user as any)?.staff_role;
  const isAdmin = !staffRole || staffRole === 'admin';
  const isDirector = staffRole === 'director';
  const isSuperintendent = staffRole === 'superintendent';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [staffRes, docsRes] = await Promise.all([apiGetStaff(), apiGetDoctors()]);
    if (Array.isArray(staffRes)) setStaff(staffRes);
    if (Array.isArray(docsRes)) setDoctors(docsRes);
    setLoading(false);
  };

  const handleAddDoctor = async (e: any) => {
    e.preventDefault();
    setDocLoading(true);
    const res = await apiAddDoctor({
      name: newDocName, specialization: newDocSpec, qualification: newDocQual,
      phone: newDocPhone, email: newDocEmail, experience_years: Number(newDocExp),
      consultation_fee: Number(newDocFee),
    });
    setDocLoading(false);
    if (res && !res.error) {
      toast.success('Doctor added');
      setShowAddForm(false);
      setNewDocName(''); setNewDocSpec(''); setNewDocQual('');
      setNewDocPhone(''); setNewDocEmail(''); setNewDocExp(''); setNewDocFee('');
      loadData();
    } else {
      toast.error(res?.error || 'Failed to add');
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    const res = await apiDeleteDoctor(id);
    if (res) { toast.success('Doctor removed'); loadData(); }
  };

  const handleToggleDoc = async (id: string) => {
    const res = await apiToggleDoctorAvailability(id);
    if (res) { toast.success('Toggled'); loadData(); }
  };

  const handleToggleStaff = async (id: string) => {
    const res = await apiToggleStaffAccess(id);
    if (res) { toast.success('Access toggled'); loadData(); }
  };

  const filteredStaff = staff.filter((s: any) => {
    if (!searchTerm) return true;
    return s.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredDoctors = doctors.filter((d: any) => {
    if (!searchTerm) return true;
    return d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search staff or doctors..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {!isSuperintendent && (
            <Button size="sm" variant={tab === 'staff' ? 'default' : 'outline'} className="text-xs" onClick={() => setTab('staff')}>
              <Users className="h-3 w-3 mr-1" /> Staff
            </Button>
          )}
          <Button size="sm" variant={tab === 'doctors' ? 'default' : 'outline'} className="text-xs" onClick={() => setTab('doctors')}>
            <Stethoscope className="h-3 w-3 mr-1" /> Doctors
          </Button>
          {isAdmin && (
            <Button size="sm" className="text-xs gap-1" onClick={() => setShowAddForm(!showAddForm)}>
              <UserPlus className="h-3 w-3" /> Add Doctor
            </Button>
          )}
        </div>
      </div>

      {/* Add Doctor Form */}
      {showAddForm && isAdmin && (
        <Card className="border-primary/40 shadow-lg animate-slide-down">
          <CardHeader>
            <CardTitle className="text-base">Add New Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDoctor} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name*</Label>
                <Input value={newDocName} onChange={(e) => setNewDocName(e.target.value)} required placeholder="Dr. Full Name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Specialization*</Label>
                <Input value={newDocSpec} onChange={(e) => setNewDocSpec(e.target.value)} required placeholder="e.g. Cardiology" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Qualification</Label>
                <Input value={newDocQual} onChange={(e) => setNewDocQual(e.target.value)} placeholder="e.g. MBBS, MD" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone*</Label>
                <Input value={newDocPhone} onChange={(e) => setNewDocPhone(e.target.value)} required placeholder="10 digits" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={newDocEmail} onChange={(e) => setNewDocEmail(e.target.value)} type="email" placeholder="doctor@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Experience (yrs)</Label>
                <Input value={newDocExp} onChange={(e) => setNewDocExp(e.target.value)} type="number" placeholder="5" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Consultation Fee (₹)</Label>
                <Input value={newDocFee} onChange={(e) => setNewDocFee(e.target.value)} type="number" placeholder="500" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" disabled={docLoading}>{docLoading ? 'Adding...' : 'Add Doctor'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      {tab === 'staff' && !isSuperintendent && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" /> Hospital Staff ({filteredStaff.length})
          </h3>
          {filteredStaff.length === 0 ? (
            <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground text-sm">No staff found.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStaff.map((s: any) => (
                <Card key={s.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{s.user_name}</p>
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">{s.role}</Badge>
                      </div>
                      {isAdmin && (
                        <Switch
                          checked={s.is_active !== false}
                          onCheckedChange={() => handleToggleStaff(s.id)}
                        />
                      )}
                    </div>
                    {s.phone && <p className="text-xs text-muted-foreground mt-2">📞 {s.phone}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Doctors List */}
      {tab === 'doctors' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="h-4 w-4" /> Doctors ({filteredDoctors.length})
          </h3>
          {filteredDoctors.length === 0 ? (
            <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground text-sm">No doctors found.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredDoctors.map((doc: any) => (
                <Card key={doc.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm">Dr. {doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.specialization} • {doc.qualification}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{doc.experience_years} yrs exp</Badge>
                          <Badge variant="outline" className="text-[10px]">₹{doc.consultation_fee}</Badge>
                          <Badge variant={doc.is_available ? 'default' : 'destructive'} className="text-[10px]">
                            {doc.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col gap-1 ml-2 shrink-0">
                          <Switch checked={doc.is_available} onCheckedChange={() => handleToggleDoc(doc.id)} />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDoctor(doc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
