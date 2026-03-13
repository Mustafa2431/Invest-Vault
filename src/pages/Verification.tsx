import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileCheck, AlertCircle, CheckCircle2,
  Mail, ShieldCheck, ArrowRight, Loader2, RotateCcw
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface KYCDocument {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  uploaded_at: string;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { number: 1, label: 'OTP Verification', sublabel: 'Verify your email' },
    { number: 2, label: 'Identity Documents', sublabel: 'Upload government ID' },
  ];

  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((step, idx) => {
        const isDone = currentStep > step.number;
        const isActive = currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white ring-4 ring-blue-600/30' : 'bg-slate-700 text-slate-400'}`}
              >
                {isDone ? <CheckCircle2 size={20} /> : step.number}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-xs font-semibold ${isActive ? 'text-white' : isDone ? 'text-green-400' : 'text-slate-500'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-600">{step.sublabel}</p>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className={`w-24 h-0.5 mx-4 mb-6 transition-all duration-500 ${currentStep > 1 ? 'bg-green-500' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OTPInput({ value, onChange, disabled }: {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const OTP_LENGTH = 8;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.toUpperCase().padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

  const handleChange = (index: number, char: string) => {
    // Allow alphanumeric — Supabase sends letters + numbers
    const cleaned = char.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase();
    const newChars = [...chars];
    newChars[index] = cleaned;
    onChange(newChars.join('').slice(0, OTP_LENGTH));
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !chars[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newChars = [...chars];
      newChars[index - 1] = '';
      onChange(newChars.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, OTP_LENGTH);
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div>
      <div className="flex justify-center gap-2">
        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="text"
            maxLength={1}
            value={chars[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-10 h-13 text-center text-lg font-bold rounded-xl border-2 bg-slate-800/50 text-white
              focus:outline-none transition-all duration-200 py-3
              ${chars[i] ? 'border-blue-500 bg-blue-600/10' : 'border-slate-600'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'}
            `}
          />
        ))}
      </div>
      <p className="text-center text-xs text-slate-500 mt-3">
        Supabase sends an 8-character alphanumeric code — enter it exactly as received
      </p>
    </div>
  );
}

// ─── Step 1: OTP Verification ─────────────────────────────────────────────────
function OTPVerificationStep({ onVerified }: { onVerified: () => void }) {
  const { user, profile } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOTP = async () => {
    if (!user?.email) return;
    setSending(true);
    setError('');

    try {
      // Pass emailRedirectTo as empty + shouldCreateUser false
      // Supabase will send a 6-digit OTP when "Email OTP" is enabled in dashboard
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
          // Do NOT pass emailRedirectTo — this forces digit OTP instead of magic link
        },
      });

      if (error) throw error;

      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Try again.');
    } finally {
      setSending(false);
    }
  };

  const verifyOTP = async () => {
    if (!user?.email || otp.length !== 8) return;
    setVerifying(true);
    setError('');

    try {
      // type: 'email' is correct for signInWithOtp digit verification
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      // Mark OTP verified — store flag in phone field
      // In production: add email_otp_verified boolean column instead
      await supabase
        .from('profiles')
        .update({ phone: `otp_verified:${new Date().toISOString()}` })
        .eq('id', user.id);

      onVerified();
    } catch (err) {
      setError('Invalid or expired OTP. Please try again.');
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="text-blue-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Email Verification</h2>
        <p className="text-slate-400 text-sm">
          {otpSent ? (
            <span>
              We sent an <span className="text-blue-400 font-semibold">8-character code</span> to{' '}
              <span className="text-white font-medium">{user?.email}</span>.{' '}
              <span className="text-xs text-slate-500 block mt-1">
                Check your inbox &amp; spam. Enter the code exactly as shown in the email.
              </span>
            </span>
          ) : (
            <span>
              We'll send an <span className="text-blue-400 font-semibold">8-character OTP</span> to{' '}
              <span className="text-white font-medium">{user?.email}</span>
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-6 text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {!otpSent ? (
        <Button onClick={sendOTP} disabled={sending} className="w-full" size="lg">
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Sending OTP...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Mail size={18} />
              Send OTP to Email
            </span>
          )}
        </Button>
      ) : (
        <div className="space-y-6">
          <OTPInput value={otp} onChange={setOtp} disabled={verifying} />

          <Button
            onClick={verifyOTP}
            disabled={otp.length !== 8 || verifying}
            className="w-full"
            size="lg"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ShieldCheck size={18} />
                Verify OTP
              </span>
            )}
          </Button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-slate-500 text-sm">
                Resend OTP in <span className="text-blue-400 font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={() => { setOtp(''); sendOTP(); }}
                className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 mx-auto transition-colors"
              >
                <RotateCcw size={14} />
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Step 1 Completed Banner ──────────────────────────────────────────────────
function Step1CompletedBanner() {
  return (
    <div className="flex items-center gap-4 p-5 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="text-green-400" size={20} />
      </div>
      <div className="flex-1">
        <p className="text-green-400 font-semibold">Step 1 Verification Completed ✓</p>
        <p className="text-slate-400 text-sm">Your email has been verified. Now upload your identity documents below to complete full KYC.</p>
      </div>
    </div>
  );
}

// ─── Step 2: Document Upload ──────────────────────────────────────────────────
function DocumentUploadStep({
  documents,
  uploading,
  onUpload,
  profile,
}: {
  documents: KYCDocument[];
  uploading: string | null;
  onUpload: (type: string, file: File) => void;
  profile: { role: string; verification_status: string } | null;
}) {
  const documentTypes = [
    { type: 'government_id', label: 'Government ID', description: 'Passport, Driver License, or National ID', required: true },
    { type: 'company_registration', label: 'Company Registration', description: 'Only for startup founders', required: false },
    { type: 'pan', label: 'PAN Card', description: 'Optional for tax purposes', required: false },
    { type: 'gst', label: 'GST Certificate', description: 'Optional for registered businesses', required: false },
  ];

  const getStatus = (type: string) => {
    return documents.find((d) => d.document_type === type)?.status || 'not_uploaded';
  };

  return (
    <div className="space-y-4">
      {documentTypes.map((docType) => {
        if (profile?.role === 'investor' && docType.type === 'company_registration') return null;

        const status = getStatus(docType.type);
        const isUploading = uploading === docType.type;
        const isVerified = status === 'verified';

        return (
          <Card key={docType.type} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-white">{docType.label}</h3>
                  {docType.required && (
                    <span className="text-xs text-red-400 font-medium">Required</span>
                  )}
                  {status === 'verified' && (
                    <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">Verified</span>
                  )}
                  {status === 'pending' && (
                    <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">Pending Review</span>
                  )}
                  {status === 'rejected' && (
                    <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full">Rejected</span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{docType.description}</p>
              </div>

              <label className={isVerified ? 'cursor-not-allowed' : 'cursor-pointer'}>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  disabled={isUploading || isVerified}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(docType.type, file);
                  }}
                />
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium
                  ${isVerified
                    ? 'border-green-600/40 text-green-400 cursor-not-allowed'
                    : isUploading
                    ? 'border-blue-500/50 text-blue-400'
                    : 'border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white'
                  }`}
                >
                  {isUploading ? (
                    <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                  ) : isVerified ? (
                    <><CheckCircle2 size={16} /> Uploaded</>
                  ) : (
                    <><Upload size={16} /> {status === 'pending' ? 'Re-upload' : 'Upload'}</>
                  )}
                </div>
              </label>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Main Verification Page ───────────────────────────────────────────────────
export function Verification() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [checkingOtp, setCheckingOtp] = useState(true);

  useEffect(() => {
    if (user) {
      loadDocuments();
      checkOtpStatus();
    }
  }, [user]);

  // We store OTP verified state in the `phone` field as a simple flag
  // In production, use a dedicated DB column e.g. `email_verified boolean`
  const checkOtpStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle();

    if (data?.phone?.startsWith('otp_verified:')) {
      setOtpVerified(true);
    }
    setCheckingOtp(false);
  };

  const loadDocuments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (data) setDocuments(data);
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!user) return;
    setUploading(documentType);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      await supabase.from('kyc_documents').insert({
        user_id: user.id,
        document_type: documentType,
        document_url: publicUrl,
        status: 'pending',
      });

      await loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(null);
    }
  };

  const handleOtpVerified = () => {
    setOtpVerified(true);
    refreshProfile();
  };

  const currentStep: 1 | 2 = otpVerified ? 2 : 1;

  if (checkingOtp) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">KYC Verification</h1>
            <p className="text-slate-400">
              Complete both steps to start{' '}
              {profile?.role === 'investor' ? 'investing' : 'raising funds'}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Overall Verification Status Banner */}
          {profile?.verification_status === 'verified' && (
            <Card className="p-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Fully Verified</h3>
                  <p className="text-sm text-slate-400">Your account is fully verified</p>
                </div>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard <ArrowRight size={16} className="ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {profile?.verification_status === 'rejected' && (
            <Card className="p-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Verification Rejected</h3>
                  <p className="text-sm text-slate-400">Please re-upload valid documents below</p>
                </div>
              </div>
            </Card>
          )}

          {/* Step Content */}
          {!otpVerified ? (
            /* ── Step 1: OTP ── */
            <OTPVerificationStep onVerified={handleOtpVerified} />
          ) : (
            /* ── Step 2: Documents ── */
            <div>
              <Step1CompletedBanner />

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Upload Identity Documents</h2>
                    <p className="text-sm text-slate-400">Upload your government ID for final verification</p>
                  </div>
                </div>

                <DocumentUploadStep
                  documents={documents}
                  uploading={uploading}
                  onUpload={handleFileUpload}
                  profile={profile}
                />
              </div>

              {profile?.verification_status === 'pending' && documents.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-600/20 rounded-full flex items-center justify-center">
                      <FileCheck className="text-yellow-400" size={20} />
                    </div>
                    <div>
                      <p className="text-white font-medium">Documents Under Review</p>
                      <p className="text-slate-400 text-sm">Our team will verify your documents within 24–48 hours.</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}