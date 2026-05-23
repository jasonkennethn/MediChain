'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInput } from '@/components/ui/voice-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope, Calendar, Clock, Plus, Trash2, Edit, Users, Activity, Settings as SettingsIcon, Search } from 'lucide-react';
import { HospitalAnalytics } from './hospital-analytics';
import { PrescriptionBuilder } from './prescription-builder';
import { GlobalSettings } from './global-settings';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

export function HospitalDashboard({
  user,
  myStaff,
  handleToggleStaff,
  myDoctors,
  showAddDocForm,
  setShowAddDocForm,
  newDocName,
  setNewDocName,
  newDocSpec,
  setNewDocSpec,
  newDocQual,
  setNewDocQual,
  newDocPhone,
  setNewDocPhone,
  newDocEmail,
  setNewDocEmail,
  newDocExp,
  setNewDocExp,
  newDocFee,
  setNewDocFee,
  docLoading,
  handleAddDoctor,
  handleDeleteDoctor,
  handleToggleDocAvailability,
  appointments,
  editingAptId,
  setEditingAptId,
  editingNotesText,
  setEditingNotesText,
  updatingAptId,
  handleSaveNotes,
  router,
  profile
}: any) {
  const isAdmin = !user?.staff_role || user?.staff_role === 'admin';
  const isDirector = user?.staff_role === 'director';
  const isSuperintendent = user?.staff_role === 'superintendent';

  const [staffSearch, setStaffSearch] = useState('');

  const defaultTab = isAdmin ? 'appointments' : (isDirector || isSuperintendent) ? 'analytics' : 'analytics';

  // Filter staff based on search and role
  const filteredStaff = (myStaff || []).filter((staff: any) => {
    // Superintendent only sees doctors
    if (isSuperintendent && staff.role !== 'doctor') return false;
    // Apply search filter
    if (staffSearch) {
      const term = staffSearch.toLowerCase();
      return (
        staff.user?.name?.toLowerCase().includes(term) ||
        staff.role?.toLowerCase().includes(term) ||
        staff.user?.phone_number?.includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 border">
          {isAdmin && (
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="h-4 w-4" /> Appointments
            </TabsTrigger>
          )}
          <TabsTrigger value="staff" className="gap-2">
            <Users className="h-4 w-4" /> {isSuperintendent ? 'Doctors' : 'Staff & Doctors'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Activity className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* ─── APPOINTMENTS TAB (Admin Only) ─── */}
        {isAdmin && (
          <TabsContent value="appointments" className="space-y-6">
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
                        <Input id="docName" placeholder="e.g. Rahul Patel" value={newDocName} onChange={(e: any) => setNewDocName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="docSpec">Specialization *</Label>
                        <Input id="docSpec" placeholder="e.g. Cardiologist" value={newDocSpec} onChange={(e: any) => setNewDocSpec(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="docQual">Qualification</Label>
                        <Input id="docQual" placeholder="e.g. MBBS, MD" value={newDocQual} onChange={(e: any) => setNewDocQual(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="docPhone">Contact Phone</Label>
                        <Input id="docPhone" value={newDocPhone} onChange={(e: any) => setNewDocPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="docEmail">Contact Email</Label>
                        <Input id="docEmail" type="email" value={newDocEmail} onChange={(e: any) => setNewDocEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2 flex gap-4">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="docExp">Exp. (Years)</Label>
                          <Input id="docExp" type="number" min="0" value={newDocExp} onChange={(e: any) => setNewDocExp(Number(e.target.value))} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="docFee">Fee (₹)</Label>
                          <Input id="docFee" type="number" min="0" value={newDocFee} onChange={(e: any) => setNewDocFee(Number(e.target.value))} />
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

            {/* Appointments List */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Incoming Appointments</span>
                </CardTitle>
                <CardDescription>Patient bookings at your hospital</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments?.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No appointments booked yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments?.map((apt: any) => (
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
                              onChange={(e: any) => setEditingNotesText(e.target.value)}
                              placeholder="Enter clinical notes, instructions, or prescription..."
                              disabled={updatingAptId === apt.id}
                            />
                            <div className="flex justify-between items-center gap-2">
                              <VoiceInput
                                onTranscript={(text: string) => setEditingNotesText((prev: string) => prev ? `${prev} ${text}` : text)}
                                placeholder="Dictate notes"
                              />
                              <div className="flex gap-1">
                                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditingAptId(null)} disabled={updatingAptId === apt.id}>
                                  Cancel
                                </Button>
                                <Button type="button" size="sm" className="h-7 text-xs px-3" onClick={() => handleSaveNotes(apt.id)} disabled={updatingAptId === apt.id}>
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
          </TabsContent>
        )}

        {/* ─── STAFF & DOCTORS TAB ─── */}
        <TabsContent value="staff" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{isSuperintendent ? 'Doctor Directory' : 'Hospital Staff Management'}</span>
                </CardTitle>
                <CardDescription>
                  {isSuperintendent 
                    ? 'View and search all doctors in the hospital' 
                    : 'Manage your hospital staff (Admins, Directors, Superintendents, Doctors)'}
                </CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowAddDocForm(!showAddDocForm)}>
                  <Plus className="mr-1 h-4 w-4" /> Add Staff Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name, role, or phone..." 
                      className="pl-9"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                    />
                  </div>
                </div>
                
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    {staffSearch ? 'No staff matching your search.' : 'No staff registered yet. Add staff to allow access and booking.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredStaff.map((staff: any) => (
                      <div key={staff.id} className="p-4 rounded-xl border border-border/50 bg-card flex flex-col justify-between gap-3 hover:border-primary/20 transition-all">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-foreground text-base">
                              {staff.role === 'doctor' ? 'Dr. ' : ''}{staff.user?.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={staff.is_active ? 'default' : 'secondary'} className="text-[10px] capitalize">
                                {staff.role === 'hospital_admin' ? 'Admin' : staff.role}
                              </Badge>
                              {isAdmin && (
                                <Switch 
                                  checked={staff.is_active}
                                  onCheckedChange={(checked) => handleToggleStaff && handleToggleStaff(staff.id, checked)}
                                  title={staff.is_active ? "Disable User" : "Enable User"}
                                />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {staff.user?.phone_number} {staff.user?.email && `| ${staff.user.email}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ANALYTICS TAB ─── */}
        <TabsContent value="analytics">
          <HospitalAnalytics />
        </TabsContent>

        {/* ─── SETTINGS TAB ─── */}
        <TabsContent value="settings" className="space-y-6">
          {isAdmin && <PrescriptionBuilder hospitalProfile={profile} onSave={() => {}} />}
          <GlobalSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
