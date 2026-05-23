'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/app/store/auth-store';
import { apiLookupPatient, apiGetAppointments, apiCreateAppointment } from '@/lib/api';
import { useTranslation } from '@/lib/translations';
import { toast } from 'sonner';
import {
  Search, Stethoscope, User as UserIcon, Calendar, Heart,
  FileText, Loader2, Phone, CreditCard, ChevronDown, ChevronUp,
  Clock, AlertCircle, Pill, Plus
} from 'lucide-react';
import { useEffect } from 'react';

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [searchType, setSearchType] = useState<'phone' | 'aadhar'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);

  // Scheduled appointments for quick diagnosis
  const [appointments, setAppointments] = useState<any[]>([]);
  const [aptLoading, setAptLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setAptLoading(true);
    const apts = await apiGetAppointments();
    if (Array.isArray(apts)) {
      setAppointments(apts.filter((a: any) => a.status === 'scheduled'));
    }
    setAptLoading(false);
  };

  const handleStartWalkIn = async () => {
    if (!patient) return;
    setCreatingWalkIn(true);
    try {
      const res = await apiCreateAppointment({
        patient: patient.id,
        doctor: user?.doctor_profile_id || '',
        hospital: user?.hospital_id || '',
        appointment_date: new Date().toISOString(),
        reason: 'Walk-in Consultation',
        status: 'scheduled'
      } as any);
      if (res && res.id) {
        toast.success('Walk-in appointment created! Starting diagnosis...');
        router.push(`/dashboard/diagnose/${res.id}`);
      } else {
        toast.error('Failed to create walk-in appointment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error starting walk-in appointment');
    } finally {
      setCreatingWalkIn(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setSearching(true);
    setPatient(null);
    const params: any = {};
    if (searchType === 'phone') params.phone = searchValue.trim();
    else params.aadhar = searchValue.trim();
    const result = await apiLookupPatient(params);
    if (result) {
      setPatient(result);
    } else {
      toast.error('Patient not found');
    }
    setSearching(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Patient Search */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" /> {t('Patient Lookup')}
          </CardTitle>
          <CardDescription>{t('Search patient by phone number or Aadhar')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1.5">
              <Button size="sm" variant={searchType === 'phone' ? 'default' : 'outline'} className="text-xs gap-1" onClick={() => setSearchType('phone')}>
                <Phone className="h-3 w-3" /> {t('Phone')}
              </Button>
              <Button size="sm" variant={searchType === 'aadhar' ? 'default' : 'outline'} className="text-xs gap-1" onClick={() => setSearchType('aadhar')}>
                <CreditCard className="h-3 w-3" /> {t('Aadhar')}
              </Button>
            </div>
            <div className="flex gap-2 flex-1">
              <Input
                placeholder={searchType === 'phone' ? 'Enter 10-digit phone...' : 'Enter 12-digit Aadhar...'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching} className="shrink-0">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Info Card */}
      {patient && (
        <Card className="border-primary/20 shadow-md animate-slide-down">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" /> {patient.user?.name || 'Unknown Patient'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <InfoItem label="Age" value={patient.date_of_birth ? (() => {
                try {
                  const dob = new Date(patient.date_of_birth);
                  const diffMs = Date.now() - dob.getTime();
                  const ageDate = new Date(diffMs);
                  return Math.abs(ageDate.getUTCFullYear() - 1970).toString() + ' yrs';
                } catch {
                  return '—';
                }
              })() : '—'} />
              <InfoItem label="Gender" value={patient.gender || '—'} />
              <InfoItem label="Blood Group" value={patient.blood_group || '—'} />
              <InfoItem label="Phone" value={patient.user?.phone_number || '—'} />
              {patient.allergies && <InfoItem label="Allergies" value={patient.allergies} className="col-span-2" />}
              {patient.medical_history && <InfoItem label="Medical History" value={patient.medical_history} className="col-span-2" />}
              {patient.emergency_contact && <InfoItem label="Emergency" value={patient.emergency_contact} />}
            </div>

            {/* Past Visits */}
            {patient.past_visits?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past Visits ({patient.past_visits.length})</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {patient.past_visits.map((visit: any) => (
                    <div key={visit.id} className="p-3 rounded-lg border border-border/50 bg-card">
                      <button
                         className="w-full text-left flex justify-between items-center"
                        onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">Dr. {visit.doctor_name} — {visit.doctor_specialization}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(visit.appointment_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-[10px] capitalize">{visit.status}</Badge>
                          {expandedVisit === visit.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </div>
                      </button>
                      {expandedVisit === visit.id && (
                        <div className="mt-2 pt-2 border-t space-y-1.5 text-xs animate-in fade-in">
                          {visit.diagnosis && <p><strong>Diagnosis:</strong> {visit.diagnosis}</p>}
                          {visit.symptoms && (
                            <div className="flex flex-wrap gap-1">
                              {(typeof visit.symptoms === 'string' ? JSON.parse(visit.symptoms) : visit.symptoms).map((s: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                              ))}
                            </div>
                          )}
                          {visit.prescription_data?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {(typeof visit.prescription_data === 'string' ? JSON.parse(visit.prescription_data) : visit.prescription_data).map((m: any, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">
                                  <Pill className="h-2.5 w-2.5 mr-0.5" /> {m.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {visit.follow_up_instructions && <p className="italic text-muted-foreground">Follow-up: {visit.follow_up_instructions}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Diagnosis Button */}
            {appointments.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Start diagnosis for this patient:</p>
                <div className="flex flex-wrap gap-2">
                  {appointments
                    .filter((a: any) => a.patient_name?.toLowerCase() === patient.user?.name?.toLowerCase())
                    .map((apt: any) => (
                      <Button key={apt.id} size="sm" className="gap-1 text-xs"
                        onClick={() => router.push(`/dashboard/diagnose/${apt.id}`)}>
                        <Stethoscope className="h-3 w-3" /> {new Date(apt.appointment_date).toLocaleString()}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Walk-in Diagnosis */}
            {((user?.role === 'hospital' || user?.role === 'staff') && user?.staff_role === 'doctor') && (
              <div className="pt-2 border-t mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">{t('Walk-in Diagnosis')}</p>
                <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleStartWalkIn} disabled={creatingWalkIn}>
                  {creatingWalkIn ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {t('Start Walk-in Diagnosis')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scheduled Appointments Quick List */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> {t('Scheduled for Today')}
          </CardTitle>
          <CardDescription>{t('Click to start diagnosis')}</CardDescription>
        </CardHeader>
        <CardContent>
          {aptLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm">{t('No scheduled appointments')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {appointments.map((apt: any) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => router.push(`/dashboard/diagnose/${apt.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{apt.patient_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(apt.appointment_date).toLocaleTimeString()}
                      </p>
                      {apt.reason && <p className="text-[10px] italic text-muted-foreground mt-1 truncate">"{apt.reason}"</p>}
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Stethoscope className="h-3 w-3" /> {t('Diagnose')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t(label)}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
