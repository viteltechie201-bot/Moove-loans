import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { getLoanAmount, getSessionId, formatFCFA } from '../lib/store';
import { CheckCircle2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Congratulations() {
  const [, setLocation] = useLocation();
  const loanAmount = getLoanAmount() ? Number(getLoanAmount()) : null;
  const sessionId = getSessionId();
  const reference = sessionId ? sessionId.substring(0, 8).toUpperCase() : 'APP12345';

  return (
    <PageTransition className="bg-slate-900 text-white relative">
      {/* Éléments décoratifs */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none" />
      <div className="absolute top-20 right-[-100px] w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-40 left-[-100px] w-64 h-64 bg-red-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex-1 flex flex-col p-8 pt-20 z-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          className="w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/30 mx-auto mb-10"
        >
          <CheckCircle2 size={56} strokeWidth={3} />
        </motion.div>

        <div className="text-center mb-10">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70"
          >
            Félicitations !
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-primary font-bold text-xl tracking-tight"
          >
            Votre prêt a été approuvé
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 border border-white/10 rounded-3xl p-6 backdrop-blur-md mb-8"
        >
          <div className="text-center mb-6 border-b border-white/10 pb-6">
            <p className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider">Montant approuvé</p>
            <p className="text-4xl font-black text-white">
              {loanAmount ? formatFCFA(loanAmount) : "Le montant demandé"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <p className="text-slate-300 text-sm font-medium leading-relaxed">
                Les fonds seront versés sur votre portefeuille Moove Money dans les <strong className="text-white">24 heures</strong>.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                <Copy size={18} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Numéro de référence</p>
                <p className="text-white font-mono font-bold tracking-widest">{reference}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-auto"
        >
          <button
            onClick={() => setLocation('/')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-lg hover:shadow-orange-500/50 transition-shadow shadow-lg shadow-orange-500/30"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
