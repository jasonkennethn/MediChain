'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/app/store/auth-store';
import { apiGetDoctorAnalytics } from '@/lib/api';
import { Activity, TrendingUp, Users, Calendar, CheckCircle, Clock, Loader2, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const isDoctor = user?.role === 'hospital' && (user as any).staff_role === 'doctor';
  const isHospital = user?.role === 'hospital' && !isDoctor;

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (isDoctor) {
        const data = await apiGetDoctorAnalytics();
        setAnalytics(data);
      } else if (isHospital) {
        const token = localStorage.getItem('medichain_access_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hospital/analytics/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!analytics) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto opacity-30 mb-3" />
        <p>No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isDoctor && (
          <>
            <StatCard icon={Users} label="Total Patients" value={analytics.total_patients || 0} color="primary" />
            <StatCard icon={CheckCircle} label="Completed" value={analytics.total_completed || 0} color="emerald" />
            <StatCard icon={Clock} label="Scheduled" value={analytics.total_scheduled || 0} color="amber" />
            <StatCard icon={Activity} label="Today's Visits" value={analytics.daily_visits?.[analytics.daily_visits?.length - 1]?.count || 0} color="indigo" />
          </>
        )}
        {isHospital && (
          <>
            <StatCard icon={Users} label="Total Patients" value={analytics.total_patients || 0} color="primary" />
            <StatCard icon={Calendar} label="Appointments" value={analytics.total_appointments || 0} color="indigo" />
            <StatCard icon={CheckCircle} label="Completed" value={analytics.completed_appointments || 0} color="emerald" />
            <StatCard icon={Activity} label="Active Doctors" value={analytics.active_doctors || 0} color="amber" />
          </>
        )}
      </div>

      {/* Daily Visits Chart */}
      {analytics.daily_visits && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Daily Visits (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 sm:gap-3 h-40 sm:h-52">
              {analytics.daily_visits.map((day: any, i: number) => {
                const max = Math.max(...analytics.daily_visits.map((d: any) => d.count), 1);
                const heightPct = (day.count / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] sm:text-xs font-bold text-foreground">{day.count}</span>
                    <div className="w-full bg-muted rounded-t-lg relative overflow-hidden" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/60 rounded-t-lg" />
                    </div>
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">{day.label || new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Visits Chart */}
      {analytics.monthly_visits && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-2" /> Monthly Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 sm:gap-4 h-40 sm:h-52">
              {analytics.monthly_visits.map((month: any, i: number) => {
                const max = Math.max(...analytics.monthly_visits.map((m: any) => m.count), 1);
                const heightPct = (month.count / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] sm:text-xs font-bold text-foreground">{month.count}</span>
                    <div className="w-full bg-muted rounded-t-lg relative overflow-hidden" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-chart-2 to-chart-2/60 rounded-t-lg" />
                    </div>
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">{month.label || new Date(month.month).toLocaleDateString('en', { month: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disease/Medicine Trends (Hospital only) */}
      {isHospital && analytics.top_diseases && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Common Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.top_diseases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.top_diseases.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground font-mono text-xs">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              {(analytics.top_medicines?.length || 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.top_medicines?.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground font-mono text-xs">{m.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: any = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
  };
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-4 sm:pt-6 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
