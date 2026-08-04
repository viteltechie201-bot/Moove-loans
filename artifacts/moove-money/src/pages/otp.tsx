import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { useSubmitOtp } from '@workspace/api-client-react';
import { getSessionId } from '../lib/store';
import { ChevronLeft, CircleDollarSign, Loader2 } from 'lucide-react';

export default function Otp() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(80);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const submitOtp = useSubmitOtp();

  useEffect(() => {
    if (!sessionId) {
      setLocation('/login');
    }
  }, [sessionId, setLocation]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take just the last character if they pasted or typed quickly
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all filled
    if (newOtp.every(v => v !== '')) {
      handleFinalSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFinalSubmit = (code: string) => {
    if (!sessionId) return;
    submitOtp.mutate({
      sessionId,
      data: { otp: code }
    }, {
      onSuccess: () => {
        setLocation('/loading');
      }
    });
  };

  return (
    <PageTransition className="bg-slate-900 text-white">
      <header className="px-6 py-5 flex items-center relative">
        <button onClick={() => setLocation('/login')} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 absolute">
          <ChevronLeft size={24} />
        </button>
        <div className="font-bold text-white mx-auto">Verification</div>
      </header>

      <div className="flex-1 flex flex-col p-8 pt-12 text-center">
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary">
            <CircleDollarSign size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">Moove Money</span>
        </div>

        <h1 className="text-3xl font-bold mb-3">Enter OTP Code</h1>
        <p className="text-slate-400 font-medium mb-12">
          We sent a 6-digit verification code to your phone via SMS.
        </p>

        <div className="flex justify-between gap-2 mb-10 max-w-sm mx-auto w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-12 h-14 bg-white/10 border border-white/20 rounded-xl text-center text-2xl font-bold text-white focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {submitOtp.isPending && (
          <div className="flex justify-center mb-6">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        <div className="text-slate-400 font-medium text-sm">
          {countdown > 0 ? (
            <p>Resend OTP in <span className="text-primary font-bold">{countdown}s</span></p>
          ) : (
            <button className="text-primary font-bold hover:text-white transition-colors" onClick={() => setCountdown(80)}>
              Resend OTP Code
            </button>
          )}
        </div>
      </div>

      <div className="h-24 w-full bg-slate-800 mt-auto rounded-t-[50%] flex flex-col items-center justify-end pb-6 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 font-medium mb-1">Version 1.0.0</div>
        <button className="text-xs text-primary font-bold hover:text-white transition-colors">Help & Support</button>
      </div>
    </PageTransition>
  );
}
