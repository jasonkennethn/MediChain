'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  placeholder?: string;
}

export function VoiceInput({ onTranscript, className, placeholder = "Dictate..." }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        mediaRecorder.current.stop();
      }
      mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError(null);
    setSuccess(false);
    audioChunks.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsTranscribing(true);
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunks.current, { 
          type: recorder.mimeType 
        });
        
        await handleTranscription(audioBlob);
      };

      mediaRecorder.current = recorder;
      recorder.start(1000); // collect chunks every second
      setIsRecording(true);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError(err.message || 'Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      onTranscript(data.text);
      setSuccess(true);
      
      // Clear success indicator after 2 seconds
      setTimeout(() => setSuccess(false), 2000);
      
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to process audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant={isRecording ? "destructive" : success ? "default" : "secondary"}
        size="icon"
        className={cn(
          "relative transition-all duration-300 rounded-full h-10 w-10 shrink-0",
          isRecording && "animate-pulse ring-4 ring-destructive/30",
          success && "bg-green-500 hover:bg-green-600 text-white"
        )}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing}
        title={isRecording ? "Stop recording" : placeholder}
      >
        {isTranscribing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <Square className="h-4 w-4 fill-current" />
        ) : success ? (
          <Check className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>

      {(isRecording || isTranscribing || error) && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs font-medium animate-in fade-in zoom-in duration-200">
          {error ? (
            <span className="text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </span>
          ) : isTranscribing ? (
            <span className="text-primary flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing Audio...
            </span>
          ) : (
            <span className="text-destructive flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              Recording ({formatTime(recordingTime)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
