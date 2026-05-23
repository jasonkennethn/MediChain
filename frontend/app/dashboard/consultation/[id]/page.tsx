'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '../../../store/auth-store';
import { Activity, Stethoscope, Mic, MicOff, Save, ArrowLeft, Loader2, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { DeepgramClient } from '@deepgram/sdk';

// Need to define a type for our clinical state
interface Medicine {
  name: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  days: number;
}

interface ClinicalState {
  symptoms: string[];
  diagnosis: string;
  prescription_data: Medicine[];
  follow_up_instructions: string;
  tests_advised: string;
}

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const aptId = params.id;
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<{speaker: number, text: string, id: string}[]>([]);
  const [clinicalState, setClinicalState] = useState<ClinicalState>({
    symptoms: [],
    diagnosis: '',
    prescription_data: [],
    follow_up_instructions: '',
    tests_advised: ''
  });
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  
  // Refs for WebRTC / Audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramLiveRef = useRef<any>(null); // Use any for v5 LiveClient since we don't import the type
  
  // Ref for tracking the last transcript text sent to Gemini
  const transcriptBufferRef = useRef<string>('');
  const extractIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    fetchAppointment();
    
    return () => {
      stopRecording();
      if (extractIntervalRef.current) clearInterval(extractIntervalRef.current);
    };
  }, []);

  const fetchAppointment = async () => {
    // In a real app we'd have a getAppointment endpoint, but we can fetch all and find
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medichain_access_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        const apt = data.appointments.find((a: any) => a.id === aptId);
        if (apt) {
          setAppointment(apt);
          if (apt.symptoms || apt.diagnosis || apt.prescription_data) {
            setClinicalState({
              symptoms: apt.symptoms ? JSON.parse(apt.symptoms) : [],
              diagnosis: apt.diagnosis || '',
              prescription_data: typeof apt.prescription_data === 'string' ? JSON.parse(apt.prescription_data) : (apt.prescription_data || []),
              follow_up_instructions: apt.follow_up_instructions || '',
              tests_advised: apt.tests_advised || ''
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startRecording = async () => {
    try {
      // 1. Get Temporary Deepgram Token
      const tokenRes = await fetch('/api/deepgram/token');
      const tokenData = await tokenRes.json();
      
      if (tokenData.error) throw new Error(tokenData.error);
      
      // 2. Initialize Deepgram Client
      const deepgram = new DeepgramClient({ apiKey: tokenData.key });
      const live = deepgram.listen.live({
        model: "nova-3",
        language: "en-IN", // Indian English model handles code-mixing well
        smart_format: true,
        diarize: true,
        interim_results: true,
        endpointing: 300,
      });

      live.on("open", () => {
        setIsRecording(true);
        deepgramLiveRef.current = live;
        
        // 3. Start MediaRecorder
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          
          mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0 && live.getReadyState() === 1) {
              live.send(event.data);
            }
          });
          
          mediaRecorder.start(250); // Send chunks every 250ms
          mediaRecorderRef.current = mediaRecorder;
        });

        // 4. Start Extraction Loop (every 10 seconds)
        extractIntervalRef.current = setInterval(extractClinicalState, 10000);
      });

      live.on("message", (data) => {
        // Deepgram sends JSON object
        if (data.type === "Results" || data.channel) {
          const result = data.channel?.alternatives?.[0];
          if (!result || result.words.length === 0) return;
          
          const isFinal = data.is_final;
          const text = result.transcript;
          const speaker = result.words[0].speaker || 0;
          
          if (isFinal && text.trim().length > 0) {
            setTranscript(prev => {
              const newTranscript = [...prev, { speaker, text, id: data.metadata?.request_id || Math.random().toString() }];
              // Append to buffer for Gemini
              transcriptBufferRef.current += `\nSpeaker ${speaker}: ${text}`;
              return newTranscript;
            });
          }
        }
      });

      live.on("error", (err) => console.error("Deepgram Error:", err));
      live.on("close", () => console.log("Deepgram Closed"));
      
      
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (deepgramLiveRef.current) {
      deepgramLiveRef.current.finish();
    }
    if (extractIntervalRef.current) {
      clearInterval(extractIntervalRef.current);
    }
    setIsRecording(false);
    
    // Final extraction
    if (transcriptBufferRef.current.trim().length > 0) {
      extractClinicalState();
    }
  };

  const extractClinicalState = async () => {
    const textToProcess = transcriptBufferRef.current;
    if (textToProcess.trim().length < 20) return; // Not enough new context
    
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
          currentState: clinicalState
        })
      });
      
      const updatedState = await res.json();
      if (!updatedState.error) {
        setClinicalState(updatedState);
        // Clear buffer so we only send new context next time (or keep it if we want full context, 
        // but for latency, clearing buffer and passing currentState is faster).
        transcriptBufferRef.current = ''; 
      }
    } catch (e) {
      console.error("Extraction error:", e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveAndPrint = async () => {
    try {
      // 1. Save to backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${aptId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medichain_access_token')}`
        },
        body: JSON.stringify({
          status: 'completed',
          symptoms: JSON.stringify(clinicalState.symptoms),
          diagnosis: clinicalState.diagnosis,
          prescription_data: JSON.stringify(clinicalState.prescription_data),
          follow_up_instructions: clinicalState.follow_up_instructions,
          tests_advised: clinicalState.tests_advised,
          transcript: JSON.stringify(transcript)
        })
      });
      
      if (res.ok) {
        // 2. Trigger Print
        window.print();
      } else {
        alert("Failed to save prescription.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving prescription.");
    }
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: any) => {
    const newMeds = [...clinicalState.prescription_data];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setClinicalState({ ...clinicalState, prescription_data: newMeds });
  };

  const addMedicine = () => {
    setClinicalState({
      ...clinicalState,
      prescription_data: [
        ...clinicalState.prescription_data,
        { name: '', morning: false, afternoon: false, night: false, days: 3 }
      ]
    });
  };

  const removeMedicine = (index: number) => {
    const newMeds = [...clinicalState.prescription_data];
    newMeds.splice(index, 1);
    setClinicalState({ ...clinicalState, prescription_data: newMeds });
  };

  if (!appointment) return <div className="p-10 text-center">Loading consultation...</div>;

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
            <span className="font-bold">AI Clinical Copilot</span>
            {isExtracting && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRecording ? (
            <Button variant="destructive" onClick={stopRecording} className="animate-pulse shadow-lg shadow-destructive/20">
              <MicOff className="mr-2 h-4 w-4" /> Stop Dictation
            </Button>
          ) : (
            <Button onClick={startRecording} className="shadow-lg shadow-primary/20">
              <Mic className="mr-2 h-4 w-4" /> Start Consultation
            </Button>
          )}
          <Button variant="outline" onClick={handleSaveAndPrint}>
            <Printer className="mr-2 h-4 w-4" /> Generate Prescription
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Pane: Live Transcript (Hidden in Print) */}
        <div className="space-y-4 no-print flex flex-col h-[calc(100vh-120px)]">
          <Card className="flex-1 flex flex-col border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 py-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Live Transcript 
                {isRecording && <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
              {transcript.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Mic className="h-12 w-12 mb-2" />
                  <p>Click "Start Consultation" and begin speaking.</p>
                  <p className="text-xs mt-1 text-center">AI will automatically separate doctor and patient voices.</p>
                </div>
              )}
              {transcript.map((t, i) => (
                <div key={i} className={`flex flex-col ${t.speaker === 0 ? 'items-start' : 'items-end'}`}>
                  <span className="text-[10px] font-semibold text-muted-foreground mb-0.5 px-1 uppercase tracking-wider">
                    {t.speaker === 0 ? 'Doctor' : 'Patient'}
                  </span>
                  <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${
                    t.speaker === 0 
                      ? 'bg-primary/10 text-primary-foreground text-primary rounded-tl-sm' 
                      : 'bg-muted text-foreground rounded-tr-sm'
                  }`}>
                    {t.text}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane: Clinical State (Printed Section) */}
        <div className="space-y-6 print-container overflow-y-auto h-[calc(100vh-120px)] pr-2">
          
          {/* Patient Header for Print */}
          <div className="print-only mb-8 border-b-2 border-primary/20 pb-4">
            <h1 className="text-2xl font-bold text-primary mb-1">{appointment?.hospital_name || 'Clinic'}</h1>
            <h2 className="text-lg font-semibold mb-4">Dr. {appointment?.doctor_name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Patient:</strong> {appointment?.patient_name}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <Card className="border-border/50 shadow-sm print-no-border">
            <CardHeader className="py-4">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <Activity className="h-5 w-5" /> Clinical Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              
              <div className="space-y-2">
                <Label className="font-semibold text-foreground/80">Chief Symptoms</Label>
                <div className="flex flex-wrap gap-2">
                  {clinicalState.symptoms.map((sym, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 font-medium bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border-chart-1/20">
                      {sym}
                    </Badge>
                  ))}
                  {clinicalState.symptoms.length === 0 && <span className="text-sm text-muted-foreground italic">Listening for symptoms...</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-foreground/80">Provisional Diagnosis</Label>
                <Input 
                  value={clinicalState.diagnosis} 
                  onChange={(e) => setClinicalState({...clinicalState, diagnosis: e.target.value})}
                  className="bg-accent/5 border-accent/20 font-medium"
                  placeholder="AI will suggest diagnosis..."
                />
              </div>

            </CardContent>
          </Card>

          {/* Rx Section */}
          <Card className="border-border/50 shadow-sm print-no-border">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <span className="font-serif text-2xl italic font-bold">Rx</span> Medication
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addMedicine} className="no-print h-8 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {clinicalState.prescription_data.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No medicines prescribed yet.</p>
              ) : (
                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2">
                    <div className="col-span-5">Medicine Name</div>
                    <div className="col-span-3 text-center">Dosage (M-A-N)</div>
                    <div className="col-span-2 text-center">Days</div>
                    <div className="col-span-2 no-print"></div>
                  </div>
                  
                  {/* Table Body */}
                  {clinicalState.prescription_data.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-lg border border-border/50">
                      <div className="col-span-5">
                        <Input 
                          value={med.name}
                          onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                          className="h-8 text-sm font-semibold border-none shadow-none bg-transparent px-1 focus-visible:ring-1"
                          placeholder="Medicine name"
                        />
                      </div>
                      <div className="col-span-3 flex justify-center gap-1.5 no-print">
                        {/* Morning */}
                        <button 
                          onClick={() => updateMedicine(idx, 'morning', !med.morning)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${med.morning ? 'bg-amber-400 text-white shadow-sm' : 'bg-muted text-muted-foreground border'}`}
                        >M</button>
                        {/* Afternoon */}
                        <button 
                          onClick={() => updateMedicine(idx, 'afternoon', !med.afternoon)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${med.afternoon ? 'bg-orange-500 text-white shadow-sm' : 'bg-muted text-muted-foreground border'}`}
                        >A</button>
                        {/* Night */}
                        <button 
                          onClick={() => updateMedicine(idx, 'night', !med.night)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${med.night ? 'bg-indigo-600 text-white shadow-sm' : 'bg-muted text-muted-foreground border'}`}
                        >N</button>
                      </div>
                      
                      {/* Print version of dosage */}
                      <div className="col-span-3 hidden print-flex justify-center items-center text-sm font-semibold tracking-widest">
                        {med.morning ? '1' : '0'} - {med.afternoon ? '1' : '0'} - {med.night ? '1' : '0'}
                      </div>

                      <div className="col-span-2 flex items-center gap-1">
                        <Input 
                          type="number" 
                          value={med.days}
                          onChange={(e) => updateMedicine(idx, 'days', Number(e.target.value))}
                          className="h-8 text-center text-sm font-bold w-12 mx-auto no-print"
                        />
                        <span className="text-xs text-muted-foreground print-inline hidden"> {med.days} days</span>
                      </div>
                      <div className="col-span-2 flex justify-end no-print">
                        <Button variant="ghost" size="icon" onClick={() => removeMedicine(idx)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Advice */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/50 shadow-sm print-no-border">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold">Tests Advised</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea 
                  className="w-full text-sm min-h-[60px] bg-transparent border-0 focus:ring-0 p-0 resize-none"
                  value={clinicalState.tests_advised}
                  onChange={(e) => setClinicalState({...clinicalState, tests_advised: e.target.value})}
                  placeholder="E.g., CBC, X-Ray..."
                />
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm print-no-border">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold">Follow Up</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea 
                  className="w-full text-sm min-h-[60px] bg-transparent border-0 focus:ring-0 p-0 resize-none"
                  value={clinicalState.follow_up_instructions}
                  onChange={(e) => setClinicalState({...clinicalState, follow_up_instructions: e.target.value})}
                  placeholder="E.g., Return after 5 days..."
                />
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
              <p className="font-semibold text-sm">Dr. {appointment?.doctor_name}</p>
              <p className="text-xs text-muted-foreground">{appointment?.doctor_specialization}</p>
            </div>
          </div>

        </div>
      </main>

      {/* CSS overrides for print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            overflow: visible !important;
          }
          .print-no-border {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 2rem !important;
          }
          .print-flex {
            display: flex !important;
          }
          .print-inline {
            display: inline !important;
          }
          .print-only {
            display: block !important;
          }
        }
        .print-only {
          display: none;
        }
      `}} />
    </div>
  );
}
