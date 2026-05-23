'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInput } from '@/components/ui/voice-input';
import { useAuthStore } from '@/app/store/auth-store';
import { useTranslation } from '@/lib/translations';
import {
  apiGetAppointments, apiGetHospitals, apiGetDoctors,
  apiCreateAppointment, apiUpdateAppointment,
} from '@/lib/api';
import { toast } from 'sonner';
import {
  Calendar, Clock, Stethoscope, Building2, MapPin,
  Edit, Loader2, Search, ChevronDown, Plus
} from 'lucide-react';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Patient booking
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [hospitalDoctors, setHospitalDoctors] = useState<any[]>([]);
  const [bookingDocId, setBookingDocId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Hospital editing
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [updatingAptId, setUpdatingAptId] = useState<string | null>(null);

  const isDoctor = user?.role === 'hospital' && (user as any).staff_role === 'doctor';
  const isHospitalAdmin = user?.role === 'hospital' && !isDoctor;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const apts = await apiGetAppointments();
    if (Array.isArray(apts)) setAppointments(apts);
    if (user?.role === 'patient') {
      const hosps = await apiGetHospitals();
      setHospitals(hosps || []);
    }
    setLoading(false);
  };

  const selectHospital = async (hosp: any) => {
    setSelectedHospital(hosp);
    const docs = await apiGetDoctors(hosp.id);
    setHospitalDoctors(docs || []);
  };

  const handleBookAppointment = async (e: any) => {
    e.preventDefault();
    if (!bookingDocId || !bookingDate || !selectedHospital) return;

    let dateIso = '';
    try {
      const d = new Date(bookingDate);
      if (isNaN(d.getTime())) {
        toast.error('Invalid date and time selected');
        return;
      }
      dateIso = d.toISOString();
    } catch {
      toast.error('Invalid date and time selected');
      return;
    }

    setBookingLoading(true);
    const result = await apiCreateAppointment({
      doctor: bookingDocId,
      hospital: selectedHospital.id,
      appointment_date: dateIso,
      reason: bookingReason,
    });
    setBookingLoading(false);
    if (result && !result.error) {
      toast.success('Appointment booked!');
      setSelectedHospital(null);
      setBookingDocId('');
      setBookingDate('');
      setBookingReason('');
      loadData();
    } else {
      toast.error(result?.error || 'Failed to book');
    }
  };

  const handleSaveNotes = async (aptId: string) => {
    setUpdatingAptId(aptId);
    const res = await apiUpdateAppointment(aptId, { notes: editingNotesText });
    setUpdatingAptId(null);
    if (res) {
      toast.success('Notes saved');
      setEditingAptId(null);
      loadData();
    }
  };

  const filteredApts = appointments.filter((apt: any) => {
    if (filter !== 'all' && apt.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return apt.patient_name?.toLowerCase().includes(term) ||
        apt.doctor_name?.toLowerCase().includes(term) ||
        apt.reason?.toLowerCase().includes(term);
    }
    return true;
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Patient: Booking Section */}
      {user?.role === 'patient' && (
        <>
          {!selectedHospital ? (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building2 className="h-5 w-5 text-primary" /> {t('Find a Hospital')}
                </CardTitle>
                <CardDescription>{t('Search and book an appointment at a verified facility')}</CardDescription>
              </CardHeader>
              <CardContent>
                {hospitals.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-sm">No hospitals available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hospitals.map((hosp: any) => (
                      <div key={hosp.id} className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all">
                        <h3 className="font-bold text-foreground">{hosp.hospital_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {hosp.city}, {hosp.state}
                        </p>
                        {hosp.specializations?.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-2">
                            {hosp.specializations.slice(0, 3).map((s: string) => (
                              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        )}
                        <Button size="sm" className="mt-3 w-full" onClick={() => selectHospital(hosp)}>
                          <Calendar className="h-3 w-3 mr-1" /> {t('Book Here')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/40 shadow-lg animate-slide-down">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-base sm:text-lg">{t('Book Here')} @ {selectedHospital.hospital_name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('Select Doctor')}</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={bookingDocId} onChange={(e) => setBookingDocId(e.target.value)} required>
                        <option value="">-- {t('Select Doctor')} --</option>
                        {hospitalDoctors.map((doc: any) => (
                          <option key={doc.id} value={doc.id}>Dr. {doc.name} ({doc.specialization}) - ₹{doc.consultation_fee}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Date & Time')}</Label>
                      <Input type="datetime-local" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Reason')}</Label>
                    <div className="flex gap-2">
                      <Input className="flex-1" placeholder="Symptoms or reason" value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} />
                      <VoiceInput onTranscript={(t: string) => setBookingReason((p: string) => p ? `${p} ${t}` : t)} placeholder="Speak" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedHospital(null)}>{t('Cancel')}</Button>
                    <Button type="submit" disabled={bookingLoading}>{bookingLoading ? t('Booking...') : t('Confirm')}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('Search appointments...')} className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['all', 'scheduled', 'completed', 'cancelled'].map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="text-xs capitalize shrink-0" onClick={() => setFilter(f)}>
              {t(f)}
            </Button>
          ))}
        </div>
      </div>

      {/* Appointment List */}
      {filteredApts.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto opacity-30 mb-3" />
            <p className="font-medium">{t('No appointments found')}</p>
            <p className="text-xs mt-1">
              {user?.role === 'patient' ? t('Book your first appointment above!') : t('No appointments match your filters.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApts.map((apt: any) => (
            <Card key={apt.id} className="border-border/50 shadow-sm hover:border-primary/20 transition-all">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-sm">{apt.patient_name}</span>
                      <Badge variant={apt.status === 'scheduled' ? 'default' : apt.status === 'completed' ? 'secondary' : 'destructive'} className="text-[10px] capitalize">
                        {t(apt.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dr. {apt.doctor_name} ({apt.doctor_specialization}) @ {apt.hospital_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(apt.appointment_date).toLocaleString()}
                    </p>
                    {apt.reason && <p className="text-xs italic text-muted-foreground mt-1">"{apt.reason}"</p>}
                    {apt.diagnosis && (
                      <p className="text-xs mt-1"><span className="font-semibold">Diagnosis:</span> {apt.diagnosis}</p>
                    )}
                    {apt.notes && !editingAptId && (
                      <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded mt-1">{apt.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {(isDoctor || isHospitalAdmin) && apt.status === 'scheduled' && (
                      <Button size="sm" className="h-8 text-xs gap-1 bg-chart-2 text-white hover:bg-chart-2/90"
                        onClick={() => router.push(`/dashboard/diagnose/${apt.id}`)}>
                        <Stethoscope className="h-3 w-3" /> {t('Diagnose')}
                      </Button>
                    )}
                    {(isDoctor || isHospitalAdmin) && (
                      <Button size="sm" variant="ghost" className="h-8 text-xs gap-1"
                        onClick={() => { setEditingAptId(apt.id); setEditingNotesText(apt.notes || ''); }}>
                        <Edit className="h-3 w-3" /> {t('Notes')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline Notes Editor */}
                {editingAptId === apt.id && (
                  <div className="mt-3 pt-3 border-t space-y-2 animate-in fade-in">
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[60px]"
                      value={editingNotesText}
                      onChange={(e) => setEditingNotesText(e.target.value)}
                      placeholder="Clinical notes..."
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingAptId(null)}>{t('Cancel')}</Button>
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveNotes(apt.id)} disabled={updatingAptId === apt.id}>
                        {updatingAptId === apt.id ? t('Saving...') : t('Save')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
