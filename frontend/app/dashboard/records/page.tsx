'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/app/store/auth-store';
import { apiGetAppointments, apiGetProfile } from '@/lib/api';
import {
  FileText, Calendar, Pill, Search, Loader2, ChevronDown, ChevronUp,
  Heart, User as UserIcon, Activity, Clock
} from 'lucide-react';

export default function RecordsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [profRes, aptsRes] = await Promise.all([apiGetProfile(), apiGetAppointments()]);
    if (profRes?.success) setProfile(profRes.profile);
    if (Array.isArray(aptsRes)) setAppointments(aptsRes);
    setLoading(false);
  };

  const completedVisits = appointments.filter((a: any) => a.status === 'completed');
  const filteredVisits = completedVisits.filter((a: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return a.doctor_name?.toLowerCase().includes(term) ||
      a.diagnosis?.toLowerCase().includes(term) ||
      a.hospital_name?.toLowerCase().includes(term);
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Health Profile Summary */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" /> Health Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-red-500/10">
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{profile?.blood_group || '—'}</p>
              <p className="text-[10px] text-muted-foreground">Blood Group</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/10">
              <Calendar className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{appointments.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Visits</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-500/10">
              <Activity className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{completedVisits.length}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{appointments.filter((a: any) => a.status === 'scheduled').length}</p>
              <p className="text-[10px] text-muted-foreground">Upcoming</p>
            </div>
          </div>
          {(profile?.allergies || profile?.chronic_diseases) && (
            <div className="mt-4 p-3 bg-destructive/5 rounded-lg border border-destructive/10">
              {profile?.allergies && <p className="text-xs"><strong>Allergies:</strong> {profile.allergies}</p>}
              {profile?.chronic_diseases && <p className="text-xs mt-1"><strong>Chronic Conditions:</strong> {profile.chronic_diseases}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search visits by doctor, diagnosis..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Past Visits Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Medical History ({filteredVisits.length})
        </h3>

        {filteredVisits.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto opacity-30 mb-3" />
              <p className="font-medium">No medical records found</p>
              <p className="text-xs mt-1">Your completed visits will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          filteredVisits.map((visit: any) => (
            <Card key={visit.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <button className="w-full text-left" onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">Dr. {visit.doctor_name}</span>
                        <Badge variant="secondary" className="text-[10px]">{visit.doctor_specialization}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {visit.hospital_name} • {new Date(visit.appointment_date).toLocaleDateString()}
                      </p>
                      {visit.diagnosis && (
                        <p className="text-xs font-medium text-primary">{visit.diagnosis}</p>
                      )}
                    </div>
                    <div className="shrink-0 ml-2">
                      {expandedId === visit.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </button>

                {expandedId === visit.id && (
                  <div className="mt-3 pt-3 border-t space-y-3 animate-in fade-in">
                    {visit.reason && (
                      <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Reason</p><p className="text-xs">{visit.reason}</p></div>
                    )}
                    {visit.symptoms && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Symptoms</p>
                        <div className="flex flex-wrap gap-1">
                          {(typeof visit.symptoms === 'string' ? JSON.parse(visit.symptoms) : (visit.symptoms || [])).map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {visit.prescription_data && visit.prescription_data.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Prescription</p>
                        <div className="space-y-1">
                          {(typeof visit.prescription_data === 'string' ? JSON.parse(visit.prescription_data) : visit.prescription_data).map((m: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-muted/30 px-3 py-1.5 rounded-md text-xs">
                              <span className="font-semibold flex items-center gap-1"><Pill className="h-3 w-3 text-primary" /> {m.name}</span>
                              <span className="text-muted-foreground">
                                {m.morning ? '1' : '0'}-{m.afternoon ? '1' : '0'}-{m.night || m.evening ? '1' : '0'} × {m.days}d
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {visit.tests_advised && (
                      <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Tests Advised</p><p className="text-xs">{visit.tests_advised}</p></div>
                    )}
                    {visit.follow_up_instructions && (
                      <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Follow-up</p><p className="text-xs italic">{visit.follow_up_instructions}</p></div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
