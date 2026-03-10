import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAssets } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Monitor, Laptop, Keyboard, Mouse, HardDrive, Package,
  Check, AlertCircle, Mail, Shield, Clock, Info, ChevronRight,
  Loader2, ArrowLeft
} from 'lucide-react';

type VerifyStep = 'email' | 'otp' | 'assets' | 'consent' | 'complete';

interface DemoAsset {
  id: string;
  name: string;
  category: string;
  serial: string;
  icon: string;
  status: 'pending' | 'verified' | 'issue';
  note: string;
}

const DEMO_ASSETS: DemoAsset[] = [
  { id: 'FAR-2021-0084', name: 'Dell Latitude 5520 Laptop', category: 'Laptop', serial: 'DL5520-TN9281', icon: 'laptop', status: 'pending', note: '' },
  { id: 'FAR-2021-0085', name: 'Dell USB-C Docking Station', category: 'Peripheral', serial: 'DA300-883721', icon: 'dock', status: 'pending', note: '' },
  { id: 'FAR-2022-0210', name: 'LG 27" Monitor (27UK850)', category: 'Monitor', serial: 'LG27-KR91029', icon: 'monitor', status: 'pending', note: '' },
  { id: 'FAR-2023-0041', name: 'Logitech MX Keys Keyboard', category: 'Peripheral', serial: 'LMX-KY-190238', icon: 'keyboard', status: 'pending', note: '' },
  { id: 'FAR-2023-0042', name: 'Logitech MX Master 3 Mouse', category: 'Peripheral', serial: 'LMX-MS-190239', icon: 'mouse', status: 'pending', note: '' },
];

const DEMO_OTP = '482917';

const iconMap: Record<string, React.ReactNode> = {
  laptop: <Laptop className="w-5 h-5" />,
  dock: <HardDrive className="w-5 h-5" />,
  monitor: <Monitor className="w-5 h-5" />,
  keyboard: <Keyboard className="w-5 h-5" />,
  mouse: <Mouse className="w-5 h-5" />,
};

const STEPS = [
  { num: '1', label: 'Identify' },
  { num: '2', label: 'Verify OTP' },
  { num: '3', label: 'Review Assets' },
  { num: '4', label: 'Consent' },
  { num: '✓', label: 'Done' },
];

const stepIndexMap: Record<VerifyStep, number> = {
  email: 0, otp: 1, assets: 2, consent: 3, complete: 4,
};

export default function EmployeeVerificationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [step, setStep] = useState<VerifyStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [assets, setAssets] = useState<DemoAsset[]>(DEMO_ASSETS.map(a => ({ ...a })));
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueAssetIdx, setIssueAssetIdx] = useState<number | null>(null);
  const [issueNote, setIssueNote] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(600);
  const [resendTimer, setResendTimer] = useState(60);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentStepIdx = stepIndexMap[step];
  const verifiedCount = assets.filter(a => a.status === 'verified').length;
  const issueCount = assets.filter(a => a.status === 'issue').length;
  const doneCount = verifiedCount + issueCount;
  const allDone = doneCount === assets.length;

  // Timers
  useEffect(() => {
    if (step !== 'otp') return;
    const interval = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0));
      setResendTimer(r => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSendOtp = () => {
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    setStep('otp');
    setTimer(600);
    setResendTimer(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 300);
  };

  const handleOtpInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    paste.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsVerifying(false);
    if (otp.join('') === DEMO_OTP) {
      setStep('assets');
      toast({ title: 'Verified', description: 'Identity confirmed successfully.' });
    } else {
      toast({ title: 'Invalid OTP', description: `Hint: use ${DEMO_OTP}`, variant: 'destructive' });
    }
  };

  const handleVerifyAsset = (idx: number) => {
    setAssets(prev => prev.map((a, i) => i === idx ? { ...a, status: 'verified' } : a));
  };

  const handleOpenIssue = (idx: number) => {
    setIssueAssetIdx(idx);
    setIssueNote('');
    setIssueModalOpen(true);
  };

  const handleConfirmIssue = () => {
    if (!issueNote.trim()) {
      toast({ title: 'Describe the issue', description: 'Please explain what\'s wrong.', variant: 'destructive' });
      return;
    }
    if (issueAssetIdx !== null) {
      setAssets(prev => prev.map((a, i) => i === issueAssetIdx ? { ...a, status: 'issue', note: issueNote } : a));
    }
    setIssueModalOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    setStep('complete');
  };

  const refId = `AV-2025-${Math.floor(10000 + Math.random() * 90000)}`;

  // ── STYLES (inline to match HTML template aesthetic without polluting global theme) ──
  const s = {
    page: { fontFamily: "'DM Sans', sans-serif", background: '#f5f2ed', minHeight: '100vh', color: '#0f1117' },
    header: { background: '#0f1117', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky' as const, top: 0, zIndex: 100 },
    logoIcon: { width: 32, height: 32, background: '#c8401a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    main: { maxWidth: 760, margin: '0 auto', padding: isMobile ? '28px 16px 60px' : '48px 24px 80px' },
    heroLabel: { fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#c8401a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
    h1: { fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 32 : 44, lineHeight: 1.1, marginBottom: 16 },
    desc: { fontSize: 16, lineHeight: 1.65, color: '#6b6560', marginBottom: 40, maxWidth: 520 },
    infoBanner: { background: '#0f1117', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 36 },
    input: { width: '100%', padding: '14px 16px', border: '1.5px solid #d8d2c8', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#0f1117', background: '#ffffff', outline: 'none' },
    btnPrimary: { background: '#c8401a', color: '#fff', border: 'none', padding: '15px 32px', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(200,64,26,0.3)' },
    btnSecondary: { background: 'transparent', color: '#6b6560', border: '1.5px solid #d8d2c8', padding: '13px 24px', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer' },
    card: { background: '#ffffff', border: '1.5px solid #d8d2c8', borderRadius: 16, padding: isMobile ? '28px 20px' : '40px', boxShadow: '0 2px 12px rgba(15,17,23,0.08)' },
    empCard: { background: '#0f1117', borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' as const },
    assetCard: (status: string) => ({
      background: status === 'verified' ? '#e4f2eb' : status === 'issue' ? '#f0e8e4' : '#ffffff',
      border: `1.5px solid ${status === 'verified' ? '#1a7a4a' : status === 'issue' ? '#c8401a' : '#d8d2c8'}`,
      borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18,
      transition: 'all 0.2s', marginBottom: 12,
    }),
    tag: (status: string) => ({
      fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      background: status === 'verified' ? 'rgba(26,122,74,0.15)' : status === 'issue' ? 'rgba(200,64,26,0.12)' : '#ede9e1',
      color: status === 'verified' ? '#1a7a4a' : status === 'issue' ? '#c8401a' : '#6b6560',
      letterSpacing: '0.03em', flexShrink: 0,
    }),
    consentBox: { background: '#ffffff', border: '1.5px solid #d8d2c8', borderRadius: 16, padding: 32, marginBottom: 24 },
    successCircle: { width: 96, height: 96, background: '#e4f2eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' },
  };

  // ── STEP INDICATOR ──
  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {STEPS.map((st, i) => (
        <div key={i} style={{ display: 'contents' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: i < currentStepIdx ? '#1a7a4a' : i === currentStepIdx ? '#0f1117' : '#6b6560' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
              border: `2px solid ${i < currentStepIdx ? '#1a7a4a' : i === currentStepIdx ? '#c8401a' : '#d8d2c8'}`,
              background: i < currentStepIdx ? '#1a7a4a' : i === currentStepIdx ? '#c8401a' : 'transparent',
              color: i <= currentStepIdx ? '#fff' : '#6b6560',
            }}>
              {i < currentStepIdx ? '✓' : st.num}
            </div>
            {!isMobile && <span>{st.label}</span>}
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < currentStepIdx ? '#1a7a4a' : '#d8d2c8', margin: '0 4px', minWidth: 24 }} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#f5f2ed' }}>
          <div style={s.logoIcon}>
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.02em' }}>Asset Vault</span>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>Asset Verification Portal</span>
        </div>
        <div style={{ background: 'rgba(200,64,26,0.15)', border: '1px solid rgba(200,64,26,0.3)', color: '#f07050', fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.04em' }}>
          FY 2025–26 Audit
        </div>
      </header>

      <main style={s.main}>
        <StepBar />

        <AnimatePresence mode="wait">
          {/* ═══ SCREEN 1: EMAIL ═══ */}
          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              <div style={s.heroLabel}>
                <div style={{ width: 24, height: 2, background: '#c8401a' }} />
                Annual Asset Audit · FY 2025–26
              </div>
              <h1 style={s.h1}>
                Verify your <em style={{ fontStyle: 'italic', color: '#c8401a', fontFamily: "'DM Serif Display', serif" }}>assigned</em> assets
              </h1>
              <p style={s.desc}>
                As part of our annual Fixed Asset Register audit, please confirm the assets assigned to you. Enter your work email to get started — we'll send you a one-time passcode.
              </p>

              <div style={s.infoBanner}>
                <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)' }}>
                  <strong style={{ color: '#f5f2ed' }}>Why are we doing this?</strong> Your company conducts an annual physical audit of all company-owned assets. This takes less than 2 minutes.
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, letterSpacing: '0.01em' }}>Your Work Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="firstname.lastname@company.com"
                  style={s.input}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                />
                <div style={{ fontSize: 12.5, color: '#6b6560', marginTop: 6 }}>Use the email registered with your company's HR system.</div>
              </div>

              <button onClick={handleSendOtp} style={s.btnPrimary}>
                <Mail className="w-4 h-4" />
                Send OTP to my Email
              </button>
            </motion.div>
          )}

          {/* ═══ SCREEN 2: OTP ═══ */}
          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={s.card}>
                <div style={{ width: 56, height: 56, background: '#f0e8e4', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Mail className="w-6 h-6" style={{ color: '#c8401a' }} />
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 8 }}>Check your inbox</div>
                <p style={{ fontSize: 14.5, color: '#6b6560', lineHeight: 1.6, marginBottom: 32 }}>
                  We've sent a 6-digit verification code to <strong style={{ color: '#0f1117' }}>{email}</strong>. The code expires in <span style={{ color: '#c8401a', fontWeight: 600 }}>{formatTime(timer)}</span>.
                </p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      style={{
                        width: isMobile ? 42 : 52, height: isMobile ? 52 : 60, textAlign: 'center', fontSize: isMobile ? 20 : 24,
                        fontWeight: 700, border: `2px solid ${digit ? '#0f1117' : '#d8d2c8'}`, borderRadius: 10,
                        color: '#0f1117', background: digit ? '#ffffff' : '#f5f2ed', outline: 'none',
                        fontFamily: "'DM Sans', sans-serif", caretColor: '#c8401a', transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>

                <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 24 }}>
                  Didn't receive the code?{' '}
                  {resendTimer > 0 ? (
                    <span>Resend in <span style={{ color: '#c8401a', fontWeight: 600 }}>{resendTimer}s</span></span>
                  ) : (
                    <button onClick={() => { setResendTimer(60); toast({ title: 'OTP Resent' }); }} style={{ background: 'none', border: 'none', color: '#c8401a', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                      Resend OTP
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={handleVerifyOtp} disabled={otp.join('').length < 6 || isVerifying} style={{ ...s.btnPrimary, opacity: otp.join('').length < 6 || isVerifying ? 0.5 : 1 }}>
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                  <button onClick={() => setStep('email')} style={s.btnSecondary}>← Back</button>
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #d8d2c8', fontSize: 12.5, color: '#6b6560' }}>
                  🔒 For demo purposes, use OTP: <strong style={{ color: '#c8401a', fontSize: 14, letterSpacing: 4 }}>4 8 2 9 1 7</strong>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ SCREEN 3: ASSETS ═══ */}
          {step === 'assets' && (
            <motion.div key="assets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Employee Card */}
              <div style={s.empCard}>
                <div style={{ width: 52, height: 52, background: '#c8401a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff', flexShrink: 0 }}>
                  RK
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#f5f2ed' }}>Rahul Kumar</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>Engineering · Pune, Maharashtra · Emp #4821</div>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#f5f2ed', fontFamily: "'DM Serif Display', serif" }}>{assets.length}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Assets</div>
                  </div>
                  <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#f5f2ed', fontFamily: "'DM Serif Display', serif" }}>{assets.length - doneCount}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pending</div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', marginBottom: 8 }}>
                  <span>Verification Progress</span>
                  <span>{doneCount} of {assets.length} confirmed</span>
                </div>
                <div style={{ height: 6, background: '#ede9e1', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #c8401a, #b8922a)', borderRadius: 3, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', width: `${(doneCount / assets.length) * 100}%` }} />
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', marginBottom: 16 }}>
                Assets Assigned to You
              </div>

              {/* Asset Cards */}
              {assets.map((asset, i) => (
                <div key={asset.id} style={s.assetCard(asset.status)}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: asset.status === 'verified' ? 'rgba(26,122,74,0.12)' : asset.status === 'issue' ? 'rgba(200,64,26,0.12)' : '#ede9e1',
                    color: asset.status === 'verified' ? '#1a7a4a' : asset.status === 'issue' ? '#c8401a' : '#6b6560',
                  }}>
                    {iconMap[asset.icon] || <Package className="w-5 h-5" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{asset.name}</div>
                    <div style={{ fontSize: 13, color: '#6b6560', marginTop: 3, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>{asset.id}</span>
                      <span>{asset.category}</span>
                      <span>S/N: {asset.serial}</span>
                    </div>
                  </div>
                  <span style={s.tag(asset.status)}>
                    {asset.status === 'verified' ? 'Verified ✓' : asset.status === 'issue' ? 'Issue Reported' : 'Pending'}
                  </span>
                  {asset.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexDirection: isMobile ? 'column' : 'row' }}>
                      <button onClick={() => handleVerifyAsset(i)} style={{ background: '#1a7a4a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check className="w-3.5 h-3.5" /> Yes, I have it
                      </button>
                      <button onClick={() => handleOpenIssue(i)} style={{ background: 'transparent', color: '#c8401a', border: '1.5px solid #c8401a', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                        Report Issue
                      </button>
                    </div>
                  )}
                  {asset.status === 'verified' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1a7a4a', fontSize: 13, fontWeight: 600 }}>
                      <Check className="w-4 h-4" /> Confirmed
                    </div>
                  )}
                  {asset.status === 'issue' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c8401a', fontSize: 13, fontWeight: 600 }}>
                      <AlertCircle className="w-4 h-4" /> Reported
                    </div>
                  )}
                </div>
              ))}

              {allDone && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <button onClick={() => setStep('consent')} style={{ ...s.btnPrimary, width: '100%', justifyContent: 'center', marginTop: 8 }}>
                    Review & Submit Declaration →
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══ SCREEN 4: CONSENT ═══ */}
          {step === 'consent' && (
            <motion.div key="consent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={s.heroLabel}>
                <div style={{ width: 24, height: 2, background: '#c8401a' }} />
                Final Step
              </div>
              <h1 style={s.h1}>
                Asset <em style={{ fontStyle: 'italic', color: '#c8401a', fontFamily: "'DM Serif Display', serif" }}>Declaration</em>
              </h1>
              <p style={s.desc}>Review your responses and provide your digital consent. This declaration is legally binding and will be recorded with timestamp.</p>

              <div style={s.consentBox}>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 16 }}>Summary of Your Responses</h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: '#6b6560', marginBottom: 20 }}>
                  You have reviewed all assets assigned to you under the Fixed Asset Register.
                </p>
                <div style={{ borderTop: '1px solid #d8d2c8', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {assets.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, fontSize: 14,
                      background: a.status === 'issue' ? '#f0e8e4' : '#f5f2ed',
                    }}>
                      {a.status === 'verified' ? <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#1a7a4a' }} /> : <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#c8401a' }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: '#6b6560' }}>
                          {a.id} · {a.serial}{a.note ? ` · Issue: ${a.note}` : ''}
                        </div>
                      </div>
                      <span style={s.tag(a.status)}>{a.status === 'verified' ? 'Verified' : 'Issue'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consent Checkbox */}
              <label
                style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', padding: 20,
                  background: consentChecked ? '#f0e8e4' : '#ede9e1', borderRadius: 12,
                  border: `2px solid ${consentChecked ? '#c8401a' : 'transparent'}`, transition: 'all 0.2s', marginBottom: 24,
                }}
                onClick={() => setConsentChecked(!consentChecked)}
              >
                <div style={{
                  width: 22, height: 22, border: `2px solid ${consentChecked ? '#c8401a' : '#d8d2c8'}`,
                  borderRadius: 6, background: consentChecked ? '#c8401a' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  {consentChecked && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.65 }}>
                  I, <strong>Rahul Kumar</strong>, hereby declare that the information provided above is true and accurate. I confirm that I am in physical possession of all verified assets. This constitutes a legally binding digital declaration.
                </div>
              </label>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleSubmit} disabled={!consentChecked || isSubmitting} style={{ ...s.btnPrimary, opacity: !consentChecked || isSubmitting ? 0.5 : 1 }}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Declaration'}
                </button>
                <button onClick={() => setStep('assets')} style={s.btnSecondary}>← Review Assets</button>
              </div>
            </motion.div>
          )}

          {/* ═══ SCREEN 5: SUCCESS ═══ */}
          {step === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}>
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                  style={s.successCircle}
                >
                  <Check className="w-12 h-12" style={{ color: '#1a7a4a' }} />
                </motion.div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, marginBottom: 12 }}>Declaration Submitted!</h2>
                <p style={{ fontSize: 16, color: '#6b6560', lineHeight: 1.65, maxWidth: 440, margin: '0 auto 36px' }}>
                  Your asset verification has been successfully recorded. The audit team will review your submission.
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, background: '#0f1117', color: '#f5f2ed',
                  padding: '12px 24px', borderRadius: 30, fontSize: 14, fontWeight: 500,
                }}>
                  Reference ID: <strong style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#b8922a' }}>{refId}</strong>
                  &nbsp;·&nbsp; {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>

                <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div style={{ background: '#fff', border: '1.5px solid #d8d2c8', borderRadius: 12, padding: '20px 28px', textAlign: 'left', maxWidth: 220 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6560', marginBottom: 8 }}>Verified Assets</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#1a7a4a' }}>{verifiedCount}</div>
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid #d8d2c8', borderRadius: 12, padding: '20px 28px', textAlign: 'left', maxWidth: 220 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6560', marginBottom: 8 }}>Issues Reported</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#c8401a' }}>{issueCount}</div>
                  </div>
                </div>

                <p style={{ marginTop: 32, fontSize: 13, color: '#6b6560' }}>You may now safely close this window.</p>
                <button onClick={() => navigate('/')} style={{ ...s.btnSecondary, marginTop: 16 }}>Back to Dashboard</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Issue Modal */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: 18, padding: 36, maxWidth: 460 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, background: '#f0e8e4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#c8401a' }} />
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24 }}>Report an Issue</div>
          </div>
          <p style={{ fontSize: 14, color: '#6b6560', marginBottom: 24, lineHeight: 1.6 }}>
            Please describe the issue with <strong style={{ color: '#0f1117' }}>
              "{issueAssetIdx !== null ? assets[issueAssetIdx]?.name : ''}"
            </strong>. Examples: missing, damaged, not working, different serial number.
          </p>
          <textarea
            value={issueNote}
            onChange={e => setIssueNote(e.target.value)}
            placeholder="e.g. The laptop screen is cracked and the battery does not hold charge..."
            style={{
              width: '100%', padding: '14px 16px', border: '1.5px solid #d8d2c8', borderRadius: 10,
              fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: '#0f1117', resize: 'vertical',
              minHeight: 100, outline: 'none', background: '#f5f2ed', marginBottom: 20,
            }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleConfirmIssue} style={{ ...s.btnPrimary }}>Report Issue</button>
            <button onClick={() => setIssueModalOpen(false)} style={s.btnSecondary}>Cancel</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
