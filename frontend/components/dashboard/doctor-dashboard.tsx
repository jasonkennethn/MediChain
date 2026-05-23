'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Stethoscope, Search, Activity, Clock, Calendar, 
  User as UserIcon, Heart, FileText, Settings as SettingsIcon,
  ChevronDown, ChevronUp, Loader2, AlertCircle, Pill
} from 'lucide-react';
import { GlobalSettings } from './global-settings';
import { apiLookupPatient, apiGetDoctorAnalytics, apiGetAppointments } from '@/lib/api';
import { useAuthStore } from '@/app/store/auth-store';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export function DoctorDashboard({ router }: any) {
  const { user } = useAuthStore();
  
  // Patient lookup
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'aadhar'>('phone');
  const [searchLoading, setSearchLoading] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Patient History (completed appointments)
  const [appointments, setAppointments] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    loadAppointments();
  }, []);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    const data = await apiGetDoctorAnalytics();
    if (data) setAnalytics(data);
    setAnalyticsLoading(false);
  };

  const loadAppointments = async () => {
    setHistoryLoading(true);
    const data = await apiGetAppointments();
    if (Array.isArray(data)) setAppointments(data);
    setHistoryLoading(false);
  };

  const handlePatientSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter a phone number or Aadhar number');
      return;
    }
    setSearchLoading(true);
    setPatientData(null);
    const result = await apiLookupPatient({
      phone: searchType === 'phone' ? searchValue : undefined,
      aadhar: searchType === 'aadhar' ? searchValue : undefined
    });
    setSearchLoading(false);
    if (result) {
      setPatientData(result);
    } else {
      toast.error('Patient not found. Check the number and try again.');
    }
  };

  const scheduledAppointments = appointments.filter((a: any) => a.status === 'scheduled');
  const completedAppointments = appointments.filter((a: any) => a.status === 'completed');

  const filteredHistory = completedAppointments.filter((apt: any) => {
    if (!historySearch) return true;
    const term = historySearch.toLowerCase();
    return (
      apt.patient_name?.toLowerCase().includes(term) ||
      apt.diagnosis?.toLowerCase().includes(term)
    );
  });

  // Calculate patient age
  const calcAge = (dob: string) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <Tabs defaultValue="diagnose" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 border">
          <TabsTrigger value="diagnose" className="gap-2">
            <Stethoscope className="h-4 w-4" /> Diagnose
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Activity className="h-4 w-4" /> Visit Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" /> Patient History
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* ─── DIAGNOSE TAB ─── */}
        <TabsContent value="diagnose" className="space-y-6">
          {/* Today's Scheduled Appointments */}
          {scheduledAppointments.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-primary" />
                  Today&apos;s Scheduled Appointments ({scheduledAppointments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {scheduledAppointments.map((apt: any) => (
                    <div key={apt.id} className="p-3 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-all space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-foreground">{apt.patient_name}</span>
                        <Badge variant="outline" className="text-[10px]">Scheduled</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {apt.reason && <p className="text-xs text-muted-foreground italic">"{apt.reason}"</p>}
                      <Button 
                        size="sm" 
                        className="w-full h-8 text-xs gap-1 bg-chart-2 text-white hover:bg-chart-2/90"
                        onClick={() => router.push(`/dashboard/diagnose/${apt.id}`)}
                      >
                        <Stethoscope className="h-3 w-3" /> Start Diagnosis
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patient Lookup */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Patient Lookup
              </CardTitle>
              <CardDescription>Search patient by phone number or Aadhar to view their records and start diagnosis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="space-y-2 w-32">
                  <Label>Search By</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'phone' | 'aadhar')}
                  >
                    <option value="phone">Phone</option>
                    <option value="aadhar">Aadhar</option>
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>{searchType === 'phone' ? 'Phone Number (10 digits)' : 'Aadhar Number (12 digits)'}</Label>
                  <Input 
                    placeholder={searchType === 'phone' ? '9876543210' : '123456789012'}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value.replace(/\D/g, ''))}
                    maxLength={searchType === 'phone' ? 10 : 12}
                    onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
                  />
                </div>
                <Button onClick={handlePatientSearch} disabled={searchLoading} className="h-10 px-6">
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Patient Result */}
          {patientData && (
            <div className="space-y-4 animate-fade-in">
              {/* Patient Info Card */}
              <Card className="border-chart-2/30 shadow-md">
                <CardHeader className="bg-chart-2/5 pb-4">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <span className="text-foreground">{patientData.user?.name}</span>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">
                        {patientData.user?.phone_number} {patientData.user?.email && `| ${patientData.user.email}`}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Age</p>
                      <p className="font-bold">{calcAge(patientData.date_of_birth)} yrs</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Gender</p>
                      <p className="font-bold capitalize">{patientData.gender || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Blood Group</p>
                      <p className="font-bold text-destructive">{patientData.blood_group || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Emergency Contact</p>
                      <p className="font-bold">{patientData.emergency_contact || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Allergies Warning */}
                  {patientData.allergies && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-destructive">Known Allergies</p>
                        <p className="text-xs text-destructive/80 mt-0.5">{patientData.allergies}</p>
                      </div>
                    </div>
                  )}

                  {patientData.medical_history && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-xs font-bold text-amber-700">Medical History</p>
                      <p className="text-xs text-amber-700/80 mt-0.5">{patientData.medical_history}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Past Visits */}
              {patientData.past_visits && patientData.past_visits.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Past Visit Records ({patientData.past_visits.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {patientData.past_visits.map((visit: any) => (
                      <div key={visit.id} className="border border-border/50 rounded-lg overflow-hidden">
                        <button
                          className="w-full p-3 flex justify-between items-center text-left hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-foreground">
                                Dr. {visit.doctor_name} <span className="text-muted-foreground font-normal">({visit.doctor_specialization})</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(visit.appointment_date).toLocaleDateString()} at {visit.hospital_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={visit.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] capitalize">{visit.status}</Badge>
                            {expandedVisit === visit.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>
                        {expandedVisit === visit.id && (
                          <div className="p-3 pt-0 border-t bg-muted/10 space-y-2 text-xs animate-in fade-in duration-200">
                            {visit.diagnosis && (
                              <div><span className="font-semibold">Diagnosis:</span> {visit.diagnosis}</div>
                            )}
                            {visit.symptoms && (
                              <div><span className="font-semibold">Symptoms:</span> {visit.symptoms}</div>
                            )}
                            {visit.prescription_data && (
                              <div>
                                <span className="font-semibold">Medicines:</span>
                                <div className="mt-1 space-y-1">
                                  {(typeof visit.prescription_data === 'string' ? JSON.parse(visit.prescription_data) : visit.prescription_data).map((med: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 p-1.5 bg-card rounded border text-[11px]">
                                      <Pill className="h-3 w-3 text-primary" />
                                      <span className="font-medium">{med.name}</span>
                                      <span className="text-muted-foreground">
                                        {med.morning ? 'M' : '-'}/{med.afternoon ? 'A' : '-'}/{med.night ? 'N' : '-'} × {med.days}d
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {visit.notes && (
                              <div><span className="font-semibold">Notes:</span> {visit.notes}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Diagnose Button */}
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="px-8 shadow-lg shadow-primary/20 gap-2 text-base"
                  onClick={() => {
                    // Find a scheduled appointment for this patient, or create a walk-in flow
                    const patientApt = scheduledAppointments.find(
                      (a: any) => a.patient_name === patientData.user?.name
                    );
                    if (patientApt) {
                      router.push(`/dashboard/diagnose/${patientApt.id}`);
                    } else {
                      toast.info('No scheduled appointment found for this patient. Navigate from the scheduled list above.');
                    }
                  }}
                >
                  <Stethoscope className="h-5 w-5" />
                  Start Diagnosis
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── VISIT ANALYTICS TAB ─── */}
        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : analytics ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                      <p className="text-3xl font-bold">{analytics.total_patients}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Completed Visits</p>
                      <p className="text-3xl font-bold text-chart-2">{analytics.total_completed}</p>
                    </div>
                    <div className="h-12 w-12 bg-chart-2/10 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-chart-2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                      <p className="text-3xl font-bold text-amber-500">{analytics.total_scheduled}</p>
                    </div>
                    <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daily Visits (Last 7 Days)</CardTitle>
                    <CardDescription>Patient consultations per day</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.daily_visits}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Visits (Last 6 Months)</CardTitle>
                    <CardDescription>Consultation trends over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.monthly_visits}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">Failed to load analytics.</div>
          )}
        </TabsContent>

        {/* ─── PATIENT HISTORY TAB ─── */}
        <TabsContent value="history" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Patient Diagnosis History
              </CardTitle>
              <CardDescription>All completed consultations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by patient name or diagnosis..." 
                  className="pl-9"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  {historySearch ? 'No results matching your search.' : 'No completed consultations yet.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((apt: any) => (
                    <div key={apt.id} className="p-4 border border-border/50 rounded-lg bg-card hover:border-primary/20 transition-all space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-foreground text-sm">{apt.patient_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(apt.appointment_date).toLocaleDateString()} — {apt.hospital_name}
                          </p>
                        </div>
                        <Badge className="text-[10px] capitalize bg-chart-2/10 text-chart-2 border-chart-2/20">Completed</Badge>
                      </div>
                      {apt.diagnosis && (
                        <p className="text-xs"><span className="font-semibold">Diagnosis:</span> {apt.diagnosis}</p>
                      )}
                      {apt.prescription_data && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(typeof apt.prescription_data === 'string' ? JSON.parse(apt.prescription_data) : apt.prescription_data).map((med: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              <Pill className="h-2.5 w-2.5 mr-1" /> {med.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SETTINGS TAB ─── */}
        <TabsContent value="settings" className="space-y-6">
          <GlobalSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
