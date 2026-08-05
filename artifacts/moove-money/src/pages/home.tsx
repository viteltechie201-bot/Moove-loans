import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { Slider } from '../components/Slider';
import { formatFCFA } from '../lib/store';
import { Zap, ShieldCheck, CircleDollarSign } from 'lucide-react';

export default function Home() {
  const [amount, setAmount] = useState([500000]);
  const [months, setMonths] = useState([12]);

  const monthlyPayment = useMemo(() => {
    const p = amount[0];
    const n = months[0];
    const total = p * (1 + 0.015 * n);
    return Math.round(total / n);
  }, [amount, months]);

  return (
    <PageTransition className="pb-10">
      {/* En-tête */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <CircleDollarSign size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">Moove Money</span>
        </div>
        <Link href="/login" className="text-sm font-semibold text-primary">Connexion</Link>
      </header>

      {/* Hero */}
      <section className="px-6 pt-8 pb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 leading-[1.1] mb-4">
          Obtenez votre prêt<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Approuvé rapidement</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg leading-relaxed mb-8">
          Approbation rapide &bull; Taux compétitifs &bull; Conditions flexibles
        </p>

        {/* Calculateur */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-50">
          <div className="mb-6">
            <div className="flex justify-between items-end mb-4">
              <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Montant du prêt</label>
              <span className="text-xl font-bold text-primary">{formatFCFA(amount[0])}</span>
            </div>
            <Slider
              value={amount}
              onValueChange={setAmount}
              max={5000000}
              min={10000}
              step={10000}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
              <span>10K</span>
              <span>5M</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Durée du prêt</label>
              <span className="text-xl font-bold text-primary">{months[0]} mois</span>
            </div>
            <Slider
              value={months}
              onValueChange={setMonths}
              max={60}
              min={6}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
              <span>6 mois</span>
              <span>60 mois</span>
            </div>
          </div>

          <div className="bg-orange-50 rounded-2xl p-5 mb-6">
            <div className="text-sm text-orange-800 font-medium mb-1">Mensualité estimée</div>
            <div className="text-3xl font-extrabold text-orange-600">{formatFCFA(monthlyPayment)}</div>
          </div>

          <Link href="/apply" className="block w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center font-bold text-lg rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow">
            Faire une demande
          </Link>
        </div>
      </section>

      {/* Avantages */}
      <section className="px-6 py-8 bg-slate-50 mt-auto rounded-t-[40px]">
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Approbation rapide</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Obtenez une réponse en minutes, pas en jours.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <CircleDollarSign size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Faibles taux d'intérêt</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Taux compétitifs à partir de 1,5%.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Traitement sécurisé</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Sécurité bancaire pour vos données.</p>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
