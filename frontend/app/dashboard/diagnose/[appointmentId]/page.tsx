'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/app/store/auth-store';
import { apiGetAppointments, apiLookupPatient, apiUpdateAppointment } from '@/lib/api';
import { useTranslation } from '@/lib/translations';
import { toast } from 'sonner';
import { 
  Activity, Stethoscope, Mic, MicOff, ArrowLeft, Loader2, Plus, Trash2, 
  Printer, AlertCircle, User as UserIcon, Pill, Search, Check, X, ChevronDown, ChevronUp
} from 'lucide-react';

// Common medicine list for search
const MEDICINE_DATABASE = [
  'Paracetamol 500mg', 'Paracetamol 650mg', 'Ibuprofen 400mg', 'Ibuprofen 200mg',
  'Amoxicillin 500mg', 'Amoxicillin 250mg', 'Azithromycin 500mg', 'Azithromycin 250mg',
  'Cetirizine 10mg', 'Levocetirizine 5mg', 'Montelukast 10mg', 'Montelukast 5mg',
  'Pantoprazole 40mg', 'Omeprazole 20mg', 'Ranitidine 150mg', 'Domperidone 10mg',
  'Metformin 500mg', 'Metformin 1000mg', 'Glimepiride 1mg', 'Glimepiride 2mg',
  'Amlodipine 5mg', 'Amlodipine 10mg', 'Telmisartan 40mg', 'Losartan 50mg',
  'Atorvastatin 10mg', 'Atorvastatin 20mg', 'Rosuvastatin 10mg', 'Rosuvastatin 5mg',
  'Clopidogrel 75mg', 'Aspirin 75mg', 'Aspirin 150mg', 'Ecosprin 75mg',
  'Dolo 650', 'Combiflam', 'Crocin 500mg', 'Allegra 120mg', 'Allegra 180mg',
  'Augmentin 625mg', 'Cefixime 200mg', 'Ciprofloxacin 500mg', 'Ofloxacin 200mg',
  'Doxycycline 100mg', 'Metronidazole 400mg', 'Fluconazole 150mg',
  'Prednisolone 5mg', 'Prednisolone 10mg', 'Deflazacort 6mg',
  'Salbutamol Inhaler', 'Budesonide Inhaler', 'Deriphyllin 150mg',
  'Diclofenac 50mg', 'Aceclofenac 100mg', 'Tramadol 50mg',
  'Multivitamin Tablet', 'Vitamin D3 60000IU', 'Vitamin B12', 'Iron + Folic Acid',
  'Calcium + Vitamin D3', 'Zinc 50mg', 'Vitamin C 500mg',
  'ORS Sachet', 'Loperamide 2mg', 'Ondansetron 4mg',
  'Chlorpheniramine 4mg', 'Dextromethorphan Syrup', 'Ambroxol 30mg',
];

interface Medicine {
  name: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  days: number;
}

interface ClinicalState {
  symptoms: string[];
  diagnosis: string;
  prescription_data: Medicine[];
  follow_up_instructions: string;
  tests_advised: string;
  reason: string;
  duration_info: string;
}

export default function DiagnosePage() {
  const router = useRouter();
  const params = useParams();
  const aptId = params?.appointmentId as string;
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  // Step management
  const [currentStep, setCurrentStep] = useState<'info' | 'recording' | 'prescription'>('info');

  // Appointment & Patient data
  const [appointment, setAppointment] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Clinical state (AI-extracted)
  const [clinicalState, setClinicalState] = useState<ClinicalState>({
    symptoms: [],
    diagnosis: '',
    prescription_data: [],
    follow_up_instructions: '',
    tests_advised: '',
    reason: '',
    duration_info: '',
  });

  // Medicine search
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptBufferRef = useRef<string>('');
  const extractIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Saving/printing
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchAppointmentData();
    return () => {
      stopRecording();
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const fetchAppointmentData = async () => {
    setLoading(true);
    try {
      const allApts = await apiGetAppointments();
      if (Array.isArray(allApts)) {
        const apt = allApts.find((a: any) => a.id === aptId);
        if (apt) {
          setAppointment(apt);
          // Load existing clinical data if any
          if (apt.diagnosis || apt.symptoms || apt.prescription_data) {
            setClinicalState({
              symptoms: apt.symptoms ? (typeof apt.symptoms === 'string' ? JSON.parse(apt.symptoms) : apt.symptoms) : [],
              diagnosis: apt.diagnosis || '',
              prescription_data: apt.prescription_data ? (typeof apt.prescription_data === 'string' ? JSON.parse(apt.prescription_data) : apt.prescription_data) : [],
              follow_up_instructions: apt.follow_up_instructions || '',
              tests_advised: apt.tests_advised || '',
              reason: apt.reason || '',
              duration_info: '',
            });
          } else {
            setClinicalState(prev => ({ ...prev, reason: apt.reason || '' }));
          }

          // Now lookup the patient by their name to get full records
          // We need the phone number — the appointment only has patient_name
          // Fetch patient details if we can find a phone number
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Groq Whisper Recording ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data frequently
      setIsRecording(true);
      setCurrentStep('recording');
      toast.success('Recording started. Speak clearly.');

      // Send audio chunks to Groq every 5 seconds
      recordingIntervalRef.current = setInterval(async () => {
        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = []; // Clear buffer
        await sendToGroq(blob);
      }, 5000);

      // Extract clinical state every 12 seconds
      extractIntervalRef.current = setInterval(() => {
        if (transcriptBufferRef.current.trim().length > 20) {
          extractClinicalState();
        }
      }, 12000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (extractIntervalRef.current) clearInterval(extractIntervalRef.current);
    setIsRecording(false);

    // Send remaining audio
    if (audioChunksRef.current.length > 0) {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];
      sendToGroq(blob);
    }

    // Final extraction
    setTimeout(() => {
      if (transcriptBufferRef.current.trim().length > 10) {
        extractClinicalState();
      }
      setCurrentStep('prescription');
    }, 2000);
  };

  const sendToGroq = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      const token = localStorage.getItem('medichain_access_token');
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.text && data.text.trim().length > 0) {
        const newEntry = { speaker: 'Conversation', text: data.text.trim() };
        setTranscript(prev => [...prev, newEntry]);
        transcriptBufferRef.current += `\n${data.text.trim()}`;
      }
    } catch (e) {
      console.error('Groq transcription error:', e);
    }
  };

  const extractClinicalState = async () => {
    const textToProcess = transcriptBufferRef.current;
    if (textToProcess.trim().length < 20) return;
    setIsExtracting(true);
    try {
      const token = localStorage.getItem('medichain_access_token');
      const res = await fetch('/api/clinical-extract', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transcript: textToProcess,
          currentState: clinicalState,
        }),
      });
      const updatedState = await res.json();
      if (!updatedState.error) {
        setClinicalState(prev => ({
          ...prev,
          symptoms: updatedState.symptoms || prev.symptoms,
          diagnosis: updatedState.diagnosis || prev.diagnosis,
          prescription_data: (updatedState.prescription_data || []).map((m: any) => ({
            name: m.name,
            morning: m.morning || false,
            afternoon: m.afternoon || false,
            evening: m.night || m.evening || false,
            days: m.days || 3,
          })),
          follow_up_instructions: updatedState.follow_up_instructions || prev.follow_up_instructions,
          tests_advised: updatedState.tests_advised || prev.tests_advised,
        }));
        transcriptBufferRef.current = '';
      }
    } catch (e) {
      console.error('Extraction error:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  // ─── Medicine Management ───
  const addMedicine = (name: string) => {
    // Don't add duplicates
    if (clinicalState.prescription_data.some(m => m.name === name)) {
      toast.info(`${name} is already in the prescription.`);
      return;
    }
    setClinicalState(prev => ({
      ...prev,
      prescription_data: [...prev.prescription_data, { name, morning: false, afternoon: false, evening: false, days: 3 }]
    }));
    setMedicineSearch('');
    setShowMedicineDropdown(false);
  };

  const removeMedicine = (index: number) => {
    setClinicalState(prev => ({
      ...prev,
      prescription_data: prev.prescription_data.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: any) => {
    setClinicalState(prev => ({
      ...prev,
      prescription_data: prev.prescription_data.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  const filteredMedicines = MEDICINE_DATABASE.filter(m =>
    m.toLowerCase().includes(medicineSearch.toLowerCase()) &&
    !clinicalState.prescription_data.some(p => p.name === m)
  ).slice(0, 8);

  // ─── Generate Prescription ───
  const handleGeneratePrescription = async () => {
    setSaving(true);
    try {
      const res = await apiUpdateAppointment(aptId, {
        status: 'completed',
        notes: clinicalState.follow_up_instructions,
        reason: clinicalState.reason,
        symptoms: JSON.stringify(clinicalState.symptoms),
        diagnosis: clinicalState.diagnosis,
        prescription_data: clinicalState.prescription_data.map(m => ({
          name: m.name,
          morning: m.morning,
          afternoon: m.afternoon,
          night: m.evening,
          days: m.days,
        })),
        follow_up_instructions: clinicalState.follow_up_instructions,
        tests_advised: clinicalState.tests_advised,
        transcript: transcript,
      } as any);

      if (res) {
        toast.success('Prescription saved! Opening print preview...');
        setTimeout(() => window.print(), 500);
      } else {
        toast.error('Failed to save prescription.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error saving prescription.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Appointment not found.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur px-4 h-16 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="font-bold">AI Diagnosis</span>
            <span className="text-sm text-muted-foreground">— {appointment.patient_name}</span>
            {isExtracting && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentStep === 'info' && (
            <Button onClick={startRecording} className="shadow-lg shadow-primary/20 gap-2" type="button">
              <Mic className="h-4 w-4" /> {t('Start Diagnosis')}
            </Button>
          )}
          {currentStep === 'recording' && (
            <Button variant="destructive" onClick={stopRecording} className="animate-pulse shadow-lg shadow-destructive/20 gap-2" type="button">
              <MicOff className="h-4 w-4" /> {t('Stop Diagnosis')}
            </Button>
          )}
          {currentStep === 'prescription' && (
            <Button onClick={handleGeneratePrescription} disabled={saving} className="shadow-lg shadow-primary/20 gap-2" type="button">
              <Printer className="h-4 w-4" /> {saving ? t('Saving...') : t('Generate Prescription')}
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 no-print">
          {['info', 'recording', 'prescription'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep === step ? 'bg-primary text-primary-foreground' : 
                ['info', 'recording', 'prescription'].indexOf(currentStep) > i ? 'bg-chart-2 text-white' : 
                'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${currentStep === step ? 'text-primary' : 'text-muted-foreground'}`}>
                {step === 'info' ? 'Patient Info' : step === 'recording' ? 'AI Listening' : 'Prescription'}
              </span>
              {i < 2 && <div className="w-8 h-0.5 bg-muted mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── LEFT PANE ─── */}
          <div className="space-y-4 no-print">
            {/* Patient Info Panel (always visible) */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="py-3 bg-muted/30 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-primary" /> Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground text-xs">Name</span><p className="font-bold">{appointment.patient_name}</p></div>
                  <div><span className="text-muted-foreground text-xs">Doctor</span><p className="font-bold">Dr. {appointment.doctor_name}</p></div>
                  <div><span className="text-muted-foreground text-xs">Specialization</span><p className="font-medium">{appointment.doctor_specialization}</p></div>
                  <div><span className="text-muted-foreground text-xs">Date</span><p className="font-medium">{new Date(appointment.appointment_date).toLocaleString()}</p></div>
                </div>
                {appointment.reason && (
                  <div className="mt-2 p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground">Reason for Visit</span>
                    <p className="text-xs font-medium">{appointment.reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Transcript (visible during recording and after) */}
            {(currentStep === 'recording' || currentStep === 'prescription') && (
              <Card className="border-border/50 shadow-sm flex-1 flex flex-col max-h-[50vh]">
                <CardHeader className="py-3 bg-muted/30 border-b">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Live Transcript
                    {isRecording && <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                  {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-10">
                      <Mic className="h-10 w-10 mb-2" />
                      <p className="text-sm">Listening for conversation...</p>
                    </div>
                  ) : (
                    transcript.map((t, i) => (
                      <div key={i} className="px-3 py-2 rounded-xl bg-card border border-border/50 text-sm">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.speaker}</span>
                        <p className="mt-0.5">{t.text}</p>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* ─── RIGHT PANE: Clinical State & Prescription ─── */}
          <div className="space-y-4 print-container">
            {/* Print Header */}
            <div className="print-only mb-6 border-b-2 border-primary/20 pb-4">
              <h1 className="text-2xl font-bold text-primary mb-1">{appointment.hospital_name || 'Hospital'}</h1>
              <h2 className="text-lg font-semibold mb-3">Dr. {appointment.doctor_name} — {appointment.doctor_specialization}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Patient:</strong> {appointment.patient_name}</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Clinical Assessment */}
            <Card className="border-border/50 shadow-sm print-no-border">
              <CardHeader className="py-3">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Clinical Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground/80 text-xs">Chief Symptoms</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {clinicalState.symptoms.map((sym, i) => (
                      <Badge key={i} variant="secondary" className="px-2 py-0.5 text-xs font-medium bg-chart-1/10 text-chart-1 border-chart-1/20">
                        {sym}
                      </Badge>
                    ))}
                    {clinicalState.symptoms.length === 0 && <span className="text-xs text-muted-foreground italic">AI will extract symptoms from conversation...</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold text-foreground/80 text-xs">{t('Provisional Diagnosis')}</Label>
                  <textarea 
                    value={clinicalState.diagnosis} 
                    onChange={(e) => setClinicalState(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="w-full text-sm min-h-[120px] bg-card border border-border/80 rounded-lg p-2.5 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-colors resize-y no-print"
                    placeholder={t("AI will suggest diagnosis...")}
                  />
                  <div className="hidden print:block text-sm whitespace-pre-line font-medium leading-relaxed mt-1">
                    {clinicalState.diagnosis || t('No diagnosis specified')}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold text-foreground/80 text-xs">{t('Reason / Problem')}</Label>
                  <Input 
                    value={clinicalState.reason} 
                    onChange={(e) => setClinicalState(prev => ({ ...prev, reason: e.target.value }))}
                    className="text-sm h-9 bg-card border border-border/80 focus-visible:ring-1 no-print"
                    placeholder={t("Primary complaint...")}
                  />
                  <div className="hidden print:block text-sm font-medium leading-relaxed mt-1">
                    {clinicalState.reason || t('None')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medicine Section */}
            <Card className="border-border/50 shadow-sm print-no-border">
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <span className="font-serif text-xl italic font-bold">Rx</span> Medicines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Recommended Medicines (shown as selectable if not yet added) */}
                {clinicalState.prescription_data.length > 0 && (
                  <div className="space-y-2">
                    {/* Allocation Table Header */}
                    <div className="grid grid-cols-12 gap-1 text-[10px] font-semibold text-muted-foreground px-2 uppercase tracking-wider">
                      <div className="col-span-4">Medicine</div>
                      <div className="col-span-5 text-center">Timing</div>
                      <div className="col-span-2 text-center">Days</div>
                      <div className="col-span-1 no-print"></div>
                    </div>

                    {/* Medicine Rows */}
                    {clinicalState.prescription_data.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-1 items-center bg-muted/20 p-2 rounded-lg border border-border/50">
                        <div className="col-span-4">
                          <Input 
                            value={med.name}
                            onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                            className="h-8 text-xs font-semibold border-none shadow-none bg-transparent px-1 focus-visible:ring-1"
                            placeholder="Medicine name"
                          />
                        </div>
                        <div className="col-span-5 flex justify-center gap-1 no-print">
                          <button 
                            type="button"
                            onClick={() => updateMedicine(idx, 'morning', !med.morning)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                              med.morning ? 'bg-amber-400 text-white shadow-sm' : 'bg-muted text-muted-foreground border'
                            }`}
                          >{t('Morning')}</button>
                          <button 
                            type="button"
                            onClick={() => updateMedicine(idx, 'afternoon', !med.afternoon)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                              med.afternoon ? 'bg-orange-500 text-white shadow-sm' : 'bg-muted text-muted-foreground border'
                            }`}
                          >{t('Afternoon')}</button>
                          <button 
                            type="button"
                            onClick={() => updateMedicine(idx, 'evening', !med.evening)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                              med.evening ? 'bg-indigo-600 text-white shadow-sm' : 'bg-muted text-muted-foreground border'
                            }`}
                          >{t('Evening')}</button>
                        </div>
                        {/* Print version of timing */}
                        <div className="col-span-5 hidden print-flex justify-center items-center text-xs font-semibold tracking-widest">
                          {med.morning ? '1' : '0'} - {med.afternoon ? '1' : '0'} - {med.evening ? '1' : '0'}
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <Input 
                            type="number" 
                            value={med.days}
                            onChange={(e) => updateMedicine(idx, 'days', Math.max(1, Number(e.target.value)))}
                            className="h-8 text-center text-xs font-bold w-14 no-print"
                            min={1}
                          />
                          <span className="text-xs text-muted-foreground print-inline hidden">{med.days}d</span>
                        </div>
                        <div className="col-span-1 flex justify-end no-print">
                          <Button variant="ghost" size="icon" onClick={() => removeMedicine(idx)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medicine Search & Add */}
                <div className="relative no-print">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder={t("Search and add medicines...")} 
                        className="pl-9 h-9 text-sm bg-card border border-border/80"
                        value={medicineSearch}
                        onChange={(e) => { setMedicineSearch(e.target.value); setShowMedicineDropdown(true); }}
                        onFocus={() => setShowMedicineDropdown(true)}
                        onBlur={() => setTimeout(() => setShowMedicineDropdown(false), 200)}
                      />
                      {showMedicineDropdown && medicineSearch && filteredMedicines.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredMedicines.map((med, i) => (
                            <button
                              key={i}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 border-b border-border/30 last:border-0"
                              onClick={() => addMedicine(med)}
                            >
                              <Pill className="h-3 w-3 text-primary" />
                              {med}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" variant="outline" className="h-9 text-xs"
                      type="button"
                      onClick={() => {
                        if (medicineSearch.trim()) {
                          addMedicine(medicineSearch.trim());
                        }
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> {t('Add Custom')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Advice */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50 shadow-sm print-no-border">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-semibold">{t('Tests Advised')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea 
                    className="w-full text-sm min-h-[80px] bg-card border border-border/80 rounded-lg p-2.5 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-colors resize-none no-print"
                    value={clinicalState.tests_advised}
                    onChange={(e) => setClinicalState(prev => ({ ...prev, tests_advised: e.target.value }))}
                    placeholder="E.g., CBC, X-Ray..."
                  />
                  <div className="hidden print:block text-sm whitespace-pre-line leading-relaxed">
                    {clinicalState.tests_advised || t('None')}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm print-no-border">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-semibold">{t('Follow Up')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea 
                    className="w-full text-sm min-h-[80px] bg-card border border-border/80 rounded-lg p-2.5 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-colors resize-none no-print"
                    value={clinicalState.follow_up_instructions}
                    onChange={(e) => setClinicalState(prev => ({ ...prev, follow_up_instructions: e.target.value }))}
                    placeholder="E.g., Return after 5 days..."
                  />
                  <div className="hidden print:block text-sm whitespace-pre-line leading-relaxed">
                    {clinicalState.follow_up_instructions || t('None')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Print Footer */}
            <div className="print-only mt-12 pt-8 flex justify-between border-t border-muted-foreground/30">
              <div>
                <p className="text-xs text-muted-foreground">Generated by MediChain AI Clinical Copilot</p>
              </div>
              <div className="text-center space-y-1">
                <div className="w-40 border-b border-foreground mb-1 h-8"></div>
                <p className="font-semibold text-sm">Dr. {appointment.doctor_name}</p>
                <p className="text-xs text-muted-foreground">{appointment.doctor_specialization}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Print CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .no-print, .no-print * { display: none !important; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible !important; }
          .print-no-border { border: none !important; box-shadow: none !important; padding: 0 !important; margin-bottom: 2rem !important; }
          .print-flex { display: flex !important; }
          .print-inline { display: inline !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}} />
    </div>
  );
}
