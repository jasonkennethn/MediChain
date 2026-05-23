'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/app/store/auth-store';
import { useTranslation } from '@/lib/translations';
import { toast } from 'sonner';
import { Settings, Globe, MessageSquare, Shield, User as UserIcon, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();
  const [feedback, setFeedback] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    toast.success(`Language set to ${LANGUAGES.find(l => l.code === code)?.label}`);
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      toast.error('Please write your feedback');
      return;
    }
    const feedbackData = {
      user_id: user?.id,
      rating: feedbackRating,
      message: feedback,
      timestamp: new Date().toISOString(),
    };
    const existingFeedbacks = JSON.parse(localStorage.getItem('medichain_feedbacks') || '[]');
    existingFeedbacks.push(feedbackData);
    localStorage.setItem('medichain_feedbacks', JSON.stringify(existingFeedbacks));
    setFeedbackSent(true);
    setFeedback('');
    setFeedbackRating(0);
    toast.success('Thank you for your feedback!');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      {/* Profile Info */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" /> {t('Profile Information')}
          </CardTitle>
          <CardDescription>{t('Your account details')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('Name')}</Label>
              <p className="font-semibold text-sm">{user?.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('Phone')}</Label>
              <p className="font-semibold text-sm">{user?.phoneNumber}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('Role')}</Label>
              <p className="font-semibold text-sm capitalize">{user?.role}{(user as any)?.staff_role ? ` (${(user as any).staff_role})` : ''}</p>
            </div>
            {user?.email && (
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-semibold text-sm">{user.email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> {t('Language')}
          </CardTitle>
          <CardDescription>{t('Choose your preferred language for AI transcription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  language === lang.code
                    ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                    : 'border-border/50 hover:border-primary/30 bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{lang.label}</p>
                    <p className="text-xs text-muted-foreground">{lang.native}</p>
                  </div>
                  {language === lang.code && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> {t('Feedback')}
          </CardTitle>
          <CardDescription>{t('Help us improve MediChain')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rating */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">{t("How's your experience?")}</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  className={`h-10 w-10 rounded-lg text-lg transition-all ${
                    star <= feedbackRating
                      ? 'bg-amber-400 text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">{t('Your feedback')}</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think about MediChain..."
            />
          </div>

          <Button onClick={handleSubmitFeedback} className="w-full sm:w-auto" disabled={feedbackSent}>
            {feedbackSent ? (
              <><Check className="h-4 w-4 mr-1" /> Sent!</>
            ) : (
              <><MessageSquare className="h-4 w-4 mr-1" /> {t('Submit Feedback')}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> {t('Security & Privacy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• All medical data is encrypted at rest and in transit</p>
            <p>• Only authorized staff can access patient records</p>
            <p>• AI models do not store or train on your medical data</p>
            <p>• Full audit logs are maintained for all access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
