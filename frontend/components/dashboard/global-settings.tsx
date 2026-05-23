'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiSubmitFeedback } from '@/lib/api';
import { toast } from 'sonner';
import { Globe, MessageSquare } from 'lucide-react';

export function GlobalSettings() {
  const [language, setLanguage] = useState('en');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('medichain_lang');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    localStorage.setItem('medichain_lang', val);
    toast.success(`Language set to ${val.toUpperCase()}`);
    // In a real app, you would trigger i18n context update here
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Feedback message cannot be empty');
      return;
    }

    setLoading(true);
    const res = await apiSubmitFeedback(feedback);
    setLoading(false);

    if (res) {
      toast.success('Thank you for your feedback!');
      setFeedback('');
    } else {
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pt-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Language Settings
          </CardTitle>
          <CardDescription>Choose your preferred language for the application interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-3">
            <Label>Application Language</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English (US)</SelectItem>
                <SelectItem value="es">Español (ES)</SelectItem>
                <SelectItem value="hi">Hindi (IN)</SelectItem>
                <SelectItem value="kn">Kannada (IN)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send Feedback
          </CardTitle>
          <CardDescription>Help us improve MediChain by sharing your experience, reporting bugs, or requesting features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your Message</Label>
            <Textarea 
              placeholder="What's on your mind?" 
              className="min-h-[120px] resize-none"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <Button onClick={handleFeedbackSubmit} disabled={loading || !feedback.trim()}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
