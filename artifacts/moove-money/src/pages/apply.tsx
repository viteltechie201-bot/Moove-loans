import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { Slider } from '../components/Slider';
import { formatFCFA, setSessionId, setLoanAmount } from '../lib/store';
import { useCreateLoanSession } from '@workspace/api-client-react';
import { ChevronLeft, Loader2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COUNTRIES = [
  { flag: '🇧🇯', name: 'Bénin',                      code: '+229', iso: 'BJ', maxLen: 9 },
  { flag: '🇧🇫', name: 'Burkina Faso',                code: '+226', iso: 'BF', maxLen: 8 },
  { flag: '🇨🇫', name: 'Rép. centrafricaine',         code: '+236', iso: 'CF', maxLen: 8 },
  { flag: '🇹🇩', name: 'Tchad',                       code: '+235', iso: 'TD', maxLen: 8 },
  { flag: '🇨🇮', name: "Côte d'Ivoire",               code: '+225', iso: 'CI', maxLen: 10 },
  { flag: '🇬🇦', name: 'Gabon',                       code: '+241', iso: 'GA', maxLen: 9 },
  { flag: '🇲🇱', name: 'Mali',                        code: '+223', iso: 'ML', maxLen: 8 },
  { flag: '🇲🇷', name: 'Mauritanie',                  code: '+222', iso: 'MR', maxLen: 8 },
  { flag: '🇳🇪', name: 'Niger',                       code: '+227', iso: 'NE', maxLen: 8 },
  { flag: '🇹🇬', name: 'Togo',                        code: '+228', iso: 'TG', maxLen: 8 },
];

type FormData = {
  loanType: string;
  loanAmount: number;
  loanTermMonths: number;
  loanPurpose: string;
  loanPurposeOther: string;
  firstName: string;
  lastName: string;
  phone: string;
  employmentStatus: string;
  monthlyIncome: number;
};

export default function Apply() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    loanType: 'Prêt personnel',
    loanAmount: 500000,
    loanTermMonths: 12,
    loanPurpose: 'Affaires',
    loanPurposeOther: '',
    firstName: '',
    lastName: '',
    phone: '',
    employmentStatus: 'Employé(e)',
    monthlyIncome: 150000,
  });

  const [selectedIdx, setSelectedIdx] = useState(4);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const country = COUNTRIES[selectedIdx];

  const createLoanSession = useCreateLoanSession();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [dropdownOpen]);

  const filtered = COUNTRIES.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)
  );

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = () => {
    const purpose = formData.loanPurpose === 'Autre' ? formData.loanPurposeOther : formData.loanPurpose;
    setLoanAmount(formData.loanAmount.toString());

    createLoanSession.mutate({
      data: {
        loanType: formData.loanType,
        loanAmount: formData.loanAmount,
        loanTermMonths: formData.loanTermMonths,
        loanPurpose: purpose,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: country.code + formData.phone,
        employmentStatus: formData.employmentStatus,
        monthlyIncome: formData.monthlyIncome,
      }
    }, {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
        setLocation('/submitted');
      }
    });
  };

  return (
    <PageTransition className="bg-slate-50">
      <header className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => step === 1 ? setLocation('/') : handlePrev()} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors text-slate-700">
          <ChevronLeft size={24} />
        </button>
        <div className="font-bold text-slate-800">Demande</div>
        <div className="w-10 text-sm font-semibold text-primary text-right">{step}/3</div>
      </header>

      {/* Barre de progression */}
      <div className="w-full bg-slate-200 h-1.5">
        <motion.div
          className="bg-primary h-full"
          initial={{ width: `${((step - 1) / 3) * 100}%` }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="p-6 flex-1 flex flex-col relative overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Détails du prêt</h2>
              <p className="text-slate-500 text-sm mb-8">Dites-nous ce dont vous avez besoin.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Type de prêt</label>
                  <select
                    value={formData.loanType}
                    onChange={e => setFormData({...formData, loanType: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium appearance-none"
                  >
                    <option>Prêt personnel</option>
                    <option>Prêt professionnel</option>
                    <option>Prêt d'urgence</option>
                    <option>Prêt étudiant</option>
                  </select>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-700">Montant</label>
                    <span className="text-lg font-extrabold text-primary">{formatFCFA(formData.loanAmount)}</span>
                  </div>
                  <Slider
                    value={[formData.loanAmount]}
                    onValueChange={v => setFormData({...formData, loanAmount: v[0]})}
                    max={5000000}
                    min={10000}
                    step={10000}
                    className="py-2"
                  />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-700">Durée</label>
                    <span className="text-lg font-extrabold text-primary">{formData.loanTermMonths} mois</span>
                  </div>
                  <Slider
                    value={[formData.loanTermMonths]}
                    onValueChange={v => setFormData({...formData, loanTermMonths: v[0]})}
                    max={60}
                    min={6}
                    step={1}
                    className="py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Objet du prêt</label>
                  <select
                    value={formData.loanPurpose}
                    onChange={e => setFormData({...formData, loanPurpose: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium appearance-none mb-3"
                  >
                    <option>Éducation</option>
                    <option>Médical</option>
                    <option>Affaires</option>
                    <option>Amélioration du logement</option>
                    <option>Consolidation de dettes</option>
                    <option>Autre</option>
                  </select>

                  {formData.loanPurpose === 'Autre' && (
                    <input
                      type="text"
                      placeholder="Veuillez préciser"
                      value={formData.loanPurposeOther}
                      onChange={e => setFormData({...formData, loanPurposeOther: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    />
                  )}
                </div>
              </div>

              <div className="mt-10 mb-6">
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                >
                  Étape suivante
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Informations personnelles</h2>
              <p className="text-slate-500 text-sm mb-8">Parlez-nous de vous.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    placeholder="Entrez votre prénom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nom de famille</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    placeholder="Entrez votre nom de famille"
                  />
                </div>

                {/* Téléphone avec sélecteur de pays */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Numéro de téléphone</label>
                  <div className="flex bg-white rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-visible relative">

                    <div ref={dropdownRef} className="relative flex-shrink-0">
                      <button
                        type="button"
                        data-testid="button-apply-country-selector"
                        onClick={() => { setDropdownOpen(v => !v); setSearch(''); }}
                        className="flex items-center gap-1.5 px-3 py-3.5 border-r border-slate-200 text-slate-700 font-bold outline-none hover:bg-slate-50 transition-colors rounded-l-xl h-full"
                      >
                        <span className="text-xl leading-none">{country.flag}</span>
                        <span className="text-sm font-bold text-slate-800">{country.code}</span>
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                          <div className="p-2 border-b border-slate-100">
                            <input
                              ref={searchRef}
                              type="text"
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                              placeholder="Rechercher un pays..."
                              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              data-testid="input-apply-country-search"
                            />
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            {filtered.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-slate-400 text-center">Aucun pays trouvé</div>
                            ) : (
                              filtered.map((c) => {
                                const idx = COUNTRIES.indexOf(c);
                                const isSelected = idx === selectedIdx;
                                return (
                                  <button
                                    key={c.iso}
                                    type="button"
                                    data-testid={`option-apply-country-${c.iso}`}
                                    onClick={() => {
                                      setSelectedIdx(idx);
                                      setDropdownOpen(false);
                                      setSearch('');
                                      setFormData(prev => ({ ...prev, phone: '' }));
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left ${isSelected ? 'bg-orange-50' : ''}`}
                                  >
                                    <span className="text-xl leading-none flex-shrink-0">{c.flag}</span>
                                    <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                                      {c.name}
                                    </span>
                                    <span className="text-sm font-bold text-slate-500">{c.code}</span>
                                    {isSelected && <Check size={14} className="text-primary flex-shrink-0" />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-4 py-3.5 text-slate-800 outline-none font-medium bg-transparent"
                      placeholder="6XXXXXXXX"
                      maxLength={country.maxLen}
                      data-testid="input-apply-phone"
                    />
                  </div>
                  {formData.phone.length > 0 && formData.phone.length < 7 && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">
                      Numéro invalide pour {country.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-10 mb-6 flex gap-3">
                <button
                  onClick={handleNext}
                  disabled={!formData.firstName || !formData.lastName || formData.phone.length < 7}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none"
                >
                  Étape suivante
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Situation professionnelle</h2>
              <p className="text-slate-500 text-sm mb-8">Aidez-nous à comprendre vos revenus.</p>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Situation d'emploi</label>
                  <select
                    value={formData.employmentStatus}
                    onChange={e => setFormData({...formData, employmentStatus: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium appearance-none"
                  >
                    <option>Employé(e)</option>
                    <option>Indépendant(e)</option>
                    <option>Chef d'entreprise</option>
                    <option>Étudiant(e)</option>
                    <option>Sans emploi</option>
                  </select>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-700">Revenu mensuel</label>
                    <span className="text-lg font-extrabold text-primary">{formatFCFA(formData.monthlyIncome)}</span>
                  </div>
                  <Slider
                    value={[formData.monthlyIncome]}
                    onValueChange={v => setFormData({...formData, monthlyIncome: v[0]})}
                    max={10000000}
                    min={0}
                    step={50000}
                    className="py-2"
                  />
                </div>
              </div>

              <div className="mt-auto pt-10 mb-6">
                <button
                  onClick={handleSubmit}
                  disabled={createLoanSession.isPending}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-lg hover:shadow-orange-500/50 transition-shadow shadow-lg shadow-orange-500/30 flex items-center justify-center disabled:opacity-70 disabled:shadow-none"
                >
                  {createLoanSession.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={24} />
                  ) : (
                    "Soumettre la demande"
                  )}
                </button>

                {createLoanSession.isError && (
                  <p className="text-red-500 text-sm text-center mt-3 font-medium">Échec de la soumission. Veuillez réessayer.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
