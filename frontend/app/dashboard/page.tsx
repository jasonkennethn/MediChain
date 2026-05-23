'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '../store/auth-store';
import { useTranslation } from '@/lib/translations';
import {
  apiGetProfile, apiGetAppointments, apiGetDoctorAnalytics,
  apiGetHospitals, apiGetPharmacies, apiGetStaff,
  apiAdminGetHospitals, apiAdminGetPharmacies,
  apiGetPharmacyOrders, apiGetPharmacyInventory
} from '@/lib/api';
import {
  Activity, Calendar, Users, Stethoscope, TrendingUp,
  Building2, Pill, Heart, Clock, FileText, Loader2,
  ArrowRight, CheckCircle, AlertCircle, ChevronRight,
  ShoppingBag, AlertTriangle, XCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadOverviewData();
  }, [isAuthenticated]);

  const loadOverviewData = async () => {
    setLoading(true);
    try {
      const profileRes = await apiGetProfile();
      if (profileRes.success) setProfile(profileRes.profile);

      const appointments = await apiGetAppointments();
      const aptCount = Array.isArray(appointments) ? appointments.length : 0;
      const scheduled = Array.isArray(appointments) ? appointments.filter((a: any) => a.status === 'scheduled').length : 0;
      const completed = Array.isArray(appointments) ? appointments.filter((a: any) => a.status === 'completed').length : 0;

      if (user?.role === 'patient') {
        setStats({ totalAppointments: aptCount, scheduled, completed });
      } else if (user?.role === 'hospital' && (user as any).staff_role === 'doctor') {
        const analytics = await apiGetDoctorAnalytics();
        setStats({
          totalPatients: analytics?.total_patients || 0,
          scheduled: analytics?.total_scheduled || 0,
          completed: analytics?.total_completed || 0,
          todayAppointments: scheduled,
          recentAppointments: Array.isArray(appointments) ? appointments.slice(0, 5) : [],
        });
      } else if (user?.role === 'hospital') {
        const staff = await apiGetStaff();
        setStats({
          totalAppointments: aptCount,
          scheduled, completed,
          totalStaff: Array.isArray(staff) ? staff.length : 0,
          recentAppointments: Array.isArray(appointments) ? appointments.slice(0, 5) : [],
        });
      } else if (user?.role === 'admin') {
        const hospitals = await apiAdminGetHospitals();
        const pharmacies = await apiAdminGetPharmacies();
        setStats({
          hospitals: Array.isArray(hospitals) ? hospitals.length : 0,
          pharmacies: Array.isArray(pharmacies) ? pharmacies.length : 0,
        });
      } else if (user?.role === 'pharmacy') {
        const [ordersRes, invRes] = await Promise.all([
          apiGetPharmacyOrders(),
          apiGetPharmacyInventory()
        ]);
        const orders = Array.isArray(ordersRes) ? ordersRes : [];
        const inventory = Array.isArray(invRes) ? invRes : [];
        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
          lowStock: inventory.filter((i: any) => i.stock_quantity < 10).length,
          outOfStock: inventory.filter((i: any) => i.stock_quantity === 0).length,
          recentOrders: orders.slice(0, 5),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDoctor = user?.role === 'hospital' && (user as any).staff_role === 'doctor';
  const isHospital = user?.role === 'hospital' && !isDoctor;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('Welcome Back')}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isDoctor ? t("Here's your clinical overview for today.") : 
             user?.role === 'patient' ? t("Track your health journey here.") :
             isHospital ? t("Hospital operations at a glance.") :
             t("System administration overview.")}
          </p>
        </div>
        {isDoctor && (
          <Link href="/dashboard/patients">
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Stethoscope className="h-4 w-4" /> {t('Start Diagnosis')}
            </Button>
          </Link>
        )}
        {user?.role === 'patient' && (
          <Link href="/dashboard/appointments">
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Calendar className="h-4 w-4" /> {t('Book Appointment')}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {user?.role === 'patient' && (
          <>
            <StatsCard icon={Calendar} label="Total Visits" value={stats.totalAppointments} color="primary" />
            <StatsCard icon={Clock} label="Scheduled" value={stats.scheduled} color="amber" />
            <StatsCard icon={CheckCircle} label="Completed" value={stats.completed} color="emerald" />
            <StatsCard icon={Heart} label="Blood Group" value={profile?.blood_group || '—'} color="red" />
          </>
        )}
        {isDoctor && (
          <>
            <StatsCard icon={Users} label="Total Patients" value={stats.totalPatients} color="primary" />
            <StatsCard icon={Clock} label="Scheduled" value={stats.scheduled} color="amber" />
            <StatsCard icon={CheckCircle} label="Completed" value={stats.completed} color="emerald" />
            <StatsCard icon={Calendar} label="Today" value={stats.todayAppointments} color="indigo" />
          </>
        )}
        {isHospital && (
          <>
            <StatsCard icon={Calendar} label="Appointments" value={stats.totalAppointments} color="primary" />
            <StatsCard icon={Clock} label="Scheduled" value={stats.scheduled} color="amber" />
            <StatsCard icon={CheckCircle} label="Completed" value={stats.completed} color="emerald" />
            <StatsCard icon={Users} label="Staff" value={stats.totalStaff} color="indigo" />
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <StatsCard icon={Building2} label="Hospitals" value={stats.hospitals} color="primary" />
            <StatsCard icon={Pill} label="Pharmacies" value={stats.pharmacies} color="emerald" />
            <StatsCard icon={Users} label="Total Users" value="—" color="amber" />
            <StatsCard icon={Activity} label="Active" value="—" color="indigo" />
          </>
        )}
        {user?.role === 'pharmacy' && (
          <>
            <StatsCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} color="primary" />
            <StatsCard icon={Clock} label="Pending Orders" value={stats.pendingOrders} color="amber" />
            <StatsCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStock} color="red" />
            <StatsCard icon={XCircle} label="Out of Stock" value={stats.outOfStock} color="indigo" />
          </>
        )}
      </div>

      {/* Recent Activity */}
      {(isDoctor || isHospital) && stats.recentAppointments?.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">{t('Recent Appointments')}</CardTitle>
              <CardDescription>{t('Latest patient interactions')}</CardDescription>
            </div>
            <Link href="/dashboard/appointments">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                {t('View All')} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {apt.patient_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{apt.patient_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Dr. {apt.doctor_name} • {new Date(apt.appointment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={apt.status === 'scheduled' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                      {apt.status}
                    </Badge>
                    {isDoctor && apt.status === 'scheduled' && (
                      <Button 
                        size="sm" variant="outline" className="h-7 text-[10px] hidden sm:flex"
                        onClick={() => router.push(`/dashboard/diagnose/${apt.id}`)}
                      >
                        <Stethoscope className="h-3 w-3 mr-1" /> {t('Diagnose')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders for Pharmacy */}
      {user?.role === 'pharmacy' && stats.recentOrders?.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">{t('Recent Orders')}</CardTitle>
              <CardDescription>{t('Latest prescriptions and walk-in updates')}</CardDescription>
            </div>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                {t('View All')} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-all animate-fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {order.patient_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{order.patient_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.medicine_name} • Qty: {order.quantity}
                      </p>
                    </div>
                  </div>
                  <Badge variant={order.status === 'pending' ? 'default' : 'secondary'} className="text-[10px] capitalize shrink-0">
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isDoctor && (
          <>
            <QuickAction icon={Stethoscope} title="Patient Lookup" desc="Search and diagnose patients" href="/dashboard/patients" />
            <QuickAction icon={Activity} title="Visit Analytics" desc="View your consultation trends" href="/dashboard/analytics" />
            <QuickAction icon={FileText} title="Consultation History" desc="Past diagnoses and prescriptions" href="/dashboard/appointments" />
          </>
        )}
        {isHospital && (
          <>
            <QuickAction icon={Calendar} title="Manage Appointments" desc="View and manage patient bookings" href="/dashboard/appointments" />
            <QuickAction icon={Users} title="Staff Management" desc="Add, edit, and manage staff" href="/dashboard/staff" />
            <QuickAction icon={Activity} title="Hospital Analytics" desc="Revenue, patients, and trends" href="/dashboard/analytics" />
          </>
        )}
        {user?.role === 'patient' && (
          <>
            <QuickAction icon={Calendar} title="Book Appointment" desc="Find a hospital and book a visit" href="/dashboard/appointments" />
            <QuickAction icon={FileText} title="My Records" desc="View past visits and prescriptions" href="/dashboard/records" />
            <QuickAction icon={Settings} title="Profile Settings" desc="Update your health information" href="/dashboard/settings" />
          </>
        )}
        {user?.role === 'pharmacy' && (
          <>
            <QuickAction icon={ShoppingBag} title="View Orders" desc="Manage incoming drug orders" href="/dashboard/orders" />
            <QuickAction icon={Pill} title="Manage Inventory" desc="Track and update stock levels" href="/dashboard/inventory" />
            <QuickAction icon={Settings} title="Settings" desc="Edit language & feedback options" href="/dashboard/settings" />
          </>
        )}
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const { t } = useTranslation();
  const colorMap: any = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-500/10 text-amber-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    red: 'bg-red-500/10 text-red-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
  };

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:pt-6 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{t(label)}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, title, desc, href }: { icon: any; title: string; desc: string; href: string }) {
  const { t } = useTranslation();
  return (
    <Link href={href}>
      <Card className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group h-full">
        <CardContent className="p-4 sm:p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{t(title)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t(desc)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Import Settings icon for the quick action
import { Settings } from 'lucide-react';
