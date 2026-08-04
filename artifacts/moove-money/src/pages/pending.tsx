import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { useGetLoginStatus, getGetLoginStatusQueryKey } from '@workspace/api-client-react';
import { getSessionId } from '../lib/store';
import { motion } from 'framer-motion';

export default function Pending() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();

  const { data: statusData, error } = useGetLoginStatus(sessionId || '', {
    query: {
      enabled: !!sessionId,
      queryKey: getGetLoginStatusQueryKey(sessionId || ''),
      refetchInterval: 3000, // poll every 3 seconds
    }
  });

  useEffect(() => {
    if (!sessionId) {
      setLocation('/login');
      return;
    }

    if (statusData?.status === 'approved') {
      setLocation('/otp');
    }
  }, [statusData, sessionId, setLocation]);

  const isRejected = statusData?.status === 'rejected';

  return (
    <PageTransition className="justify-center items-center p-8 bg-slate-50">
      
      {isRejected ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center w-full"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Application Not Approved</h1>
          <p className="text-slate-500 font-medium mb-8">
            {statusData.message || "Your application was not approved at this time."}
          </p>
          <button 
            onClick={() => setLocation('/login')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            Try Again
          </button>
        </motion.div>
      ) : (
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[4px] border-orange-100 border-t-primary"
            />
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Under Review</h1>
          <p className="text-slate-500 font-medium mb-2 text-lg">
            Please wait for approval.
          </p>
          <p className="text-slate-400 text-sm">
            Our team is reviewing your application.<br/>This usually takes a few minutes.
          </p>

          {error && (
            <p className="text-red-500 text-sm mt-4 font-medium">Connection error. Reconnecting...</p>
          )}
        </div>
      )}

    </PageTransition>
  );
}
