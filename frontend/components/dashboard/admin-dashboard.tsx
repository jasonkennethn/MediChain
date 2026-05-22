'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Pill, ShieldCheck, MapPin } from 'lucide-react';

export function AdminDashboard({
  allHospitals,
  allPharmacies,
  adminTab,
  setAdminTab,
  handleToggleVerify
}: any) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Hospitals Registered</p>
                <p className="text-3xl font-bold text-foreground mt-1">{allHospitals?.length || 0}</p>
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
                <p className="text-3xl font-bold text-foreground mt-1">{allPharmacies?.length || 0}</p>
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
              {allHospitals?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No hospitals registered yet.</div>
              ) : (
                allHospitals?.map((hosp: any) => (
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
              {allPharmacies?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No pharmacies registered yet.</div>
              ) : (
                allPharmacies?.map((pharm: any) => (
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
  );
}
