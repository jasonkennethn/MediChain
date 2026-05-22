'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInput } from '@/components/ui/voice-input';
import { Heart, Phone, MapPin, Calendar, Building2, Clock, Pill } from 'lucide-react';

export function PatientDashboard({
  profile,
  hospitals,
  pharmacies,
  appointments,
  selectedHospital,
  selectHospital,
  setSelectedHospital,
  hospitalDoctors,
  bookingDocId,
  setBookingDocId,
  bookingDate,
  setBookingDate,
  bookingReason,
  setBookingReason,
  bookingLoading,
  handleBookAppointment
}: any) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Health Metrics & Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                <p className="text-2xl font-bold text-foreground mt-1">{profile?.blood_group || 'Not set'}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Heart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                <p className="text-sm font-semibold text-foreground mt-2 truncate max-w-[120px]">
                  {profile?.emergency_contact || 'None'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-sm font-semibold text-foreground mt-2 truncate max-w-[120px]">
                  {profile?.city ? `${profile.city}, ${profile.state}` : 'Not set'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold text-foreground mt-1">{appointments?.length || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left columns: Directory (Hospitals & Booking) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Search Available Hospitals</span>
              </CardTitle>
              <CardDescription>Book an appointment at a registered healthcare facility</CardDescription>
            </CardHeader>
            <CardContent>
              {hospitals?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No verified hospitals available currently.
                </div>
              ) : (
                <div className="space-y-4">
                  {hospitals?.map((hosp: any) => (
                    <div key={hosp.id} className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{hosp.hospital_name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {hosp.address}, {hosp.city}, {hosp.state} - {hosp.pincode}
                        </p>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {hosp.specializations?.slice(0, 3).map((spec: string) => (
                            <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                          ))}
                          {hosp.specializations?.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{hosp.specializations.length - 3} more</Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => selectHospital(hosp)}>
                        Book Appointment
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Form (Conditional) */}
          {selectedHospital && (
            <Card className="border-primary/40 shadow-lg animate-slide-down">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">Book Appointment at {selectedHospital.hospital_name}</CardTitle>
                <CardDescription>Select a physician, date, and reason for consultation</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bookingDoc">Select Doctor</Label>
                      <select id="bookingDoc" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={bookingDocId} onChange={(e) => setBookingDocId(e.target.value)} required>
                        <option value="">-- Choose Doctor --</option>
                        {hospitalDoctors?.map((doc: any) => (
                          <option key={doc.id} value={doc.id}>
                            Dr. {doc.name} ({doc.specialization}) - ₹{doc.consultation_fee}
                          </option>
                        ))}
                      </select>
                      {hospitalDoctors?.length === 0 && (
                        <p className="text-xs text-destructive mt-1">No available doctors found for this hospital.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bookingDate">Appointment Date & Time</Label>
                      <Input id="bookingDate" type="datetime-local" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookingReason">Reason for Consultation</Label>
                    <div className="flex gap-2">
                      <Input id="bookingReason" className="flex-1" placeholder="Describe symptoms or checkup purpose" value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} />
                      <VoiceInput onTranscript={(text) => setBookingReason((prev: string) => prev ? `${prev} ${text}` : text)} placeholder="Dictate reason" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedHospital(null)}>Cancel</Button>
                    <Button type="submit" disabled={bookingLoading || !bookingDocId} className="shadow-md shadow-primary/10">
                      {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Appointments & pharmacies list */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>My Appointments</span>
              </CardTitle>
              <CardDescription>Your healthcare history</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Calendar className="mx-auto h-8 w-8 opacity-40 mb-2" />
                  No scheduled appointments yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments?.map((apt: any) => (
                    <div key={apt.id} className="p-3 border border-border/50 rounded-lg bg-card space-y-1.5">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-foreground text-sm">Dr. {apt.doctor_name}</p>
                        <Badge className="text-[10px] px-1.5 py-0.5 capitalize" variant={apt.status === 'scheduled' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{apt.doctor_specialization} @ {apt.hospital_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-primary" />
                        {new Date(apt.appointment_date).toLocaleString()}
                      </p>
                      {apt.reason && <p className="text-xs italic text-muted-foreground border-t pt-1.5 mt-1.5">" {apt.reason} "</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verified Pharmacies list */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Pill className="h-4.5 w-4.5 text-accent" />
                <span>Partner Pharmacies</span>
              </CardTitle>
              <CardDescription>Verified medical shops nearby</CardDescription>
            </CardHeader>
            <CardContent>
              {pharmacies?.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-4">No verified pharmacies available.</div>
              ) : (
                <div className="space-y-2">
                  {pharmacies?.map((pharm: any) => (
                    <div key={pharm.id} className="p-2 border border-border/40 rounded-lg text-xs">
                      <p className="font-bold text-foreground">{pharm.pharmacy_name}</p>
                      <p className="text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" /> {pharm.city}</p>
                      <p className="text-muted-foreground mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" /> {pharm.phone || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
