'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Activity, Users, FileText, DollarSign, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function HospitalAnalytics() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('medichain_access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hospital/analytics/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) return <div>Failed to load analytics</div>;

  const statusData = data.status_breakdown.map((item: any) => ({
    name: item.status,
    value: item.count
  }));

  // Mock data for charts since backend only gives total aggregates
  const monthlyAppointments = [
    { name: 'Jan', count: 40 },
    { name: 'Feb', count: 30 },
    { name: 'Mar', count: 55 },
    { name: 'Apr', count: parseInt(data.total_appointments) || 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
              <p className="text-3xl font-bold">{data.total_appointments}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
              <p className="text-3xl font-bold">{data.total_patients}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Staff Doctors</p>
              <p className="text-3xl font-bold">{data.total_doctors}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Est. Revenue</p>
              <p className="text-3xl font-bold">₹{data.revenue}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointments Trend</CardTitle>
            <CardDescription>Monthly appointment volume</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
            <CardDescription>Breakdown by current status</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
