import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Submitted() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      setLocation('/login');
      return;
    }

    const timer = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, setLocation]);

  return (
    <PageTransition className="justify-center items-center p-8 bg-slate-50">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-8 mx-auto"
      >
        <CheckCircle2 size={48} strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
          Application<br />Submitted Successfully
        </h1>
        <p className="text-slate-500 text-lg mb-12 font-medium">
          Your application has been received and is under review.
        </p>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm inline-block mb-10">
          <p className="text-slate-600 font-medium">
            Redirecting to login in <span className="text-primary font-bold">{countdown}</span> seconds...
          </p>
        </div>

        <button 
          onClick={() => setLocation('/login')}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
        >
          Go to Login Now
        </button>
      </motion.div>
    </PageTransition>
  );
}
