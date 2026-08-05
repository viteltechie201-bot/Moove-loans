import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { useSubmitLogin } from '@workspace/api-client-react';
import { getSessionId, setSessionId } from '../lib/store';
import { ChevronLeft, Loader2, ChevronDown, Check } from 'lucide-react';

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

export default function Login() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(4); // Côte d'Ivoire par défaut
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const submitLogin = useSubmitLogin();
  const country = COUNTRIES[selectedIdx];

  // Fermer le dropdown au clic extérieur
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 7 || pin.length !== 4 || !termsAccepted) return;

    const sessionId = getSessionId() || 'new-session-id';
    submitLogin.mutate(
      { sessionId, data: { phone: country.code + phone, pin } },
      {
        onSuccess: (data) => {
          setSessionId(data.sessionId);
          setLocation('/pending');
        },
      }
    );
  };

  const isValid = phone.length >= 7 && pin.length === 4 && termsAccepted;

  return (
    <PageTransition className="bg-white flex flex-col">
      {/* Orange header bar */}
      <div className="bg-primary px-5 pt-12 pb-6">
        <button
          onClick={() => setLocation('/')}
          className="w-10 h-10 flex items-center justify-center text-white"
          aria-label="Retour"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* White content */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-10">
        {/* Heading */}
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Démarrez</h1>
        <p className="text-slate-400 text-base mb-8 font-medium leading-relaxed">
          Entrez votre numéro de téléphone pour commencer
        </p>

        <form onSubmit={handleLogin} className="flex flex-col flex-1">
          {/* Numéro de téléphone */}
          <div className="mb-5">
            <div className="flex bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-visible relative">
              {/* Sélecteur de pays */}
              <div ref={dropdownRef} className="relative flex-shrink-0">
                <button
                  type="button"
                  data-testid="button-country-selector"
                  onClick={() => { setDropdownOpen(v => !v); setSearch(''); }}
                  className="flex items-center gap-1.5 px-3 py-4 border-r border-slate-200 text-slate-700 font-bold outline-none hover:bg-slate-100 transition-colors rounded-l-2xl h-full"
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
                        data-testid="input-country-search"
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
                              data-testid={`option-country-${c.iso}`}
                              onClick={() => {
                                setSelectedIdx(idx);
                                setDropdownOpen(false);
                                setSearch('');
                                setPhone('');
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

              {/* Champ téléphone */}
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-4 text-slate-900 outline-none font-medium bg-transparent text-lg tracking-wide"
                placeholder="6XXXXXXXX"
                maxLength={country.maxLen}
                data-testid="input-phone"
              />
            </div>
            {phone.length > 0 && phone.length < 7 && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">
                Numéro invalide pour {country.name}
              </p>
            )}
          </div>

          {/* Code PIN */}
          <div className="mb-8">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-4 text-slate-900 outline-none font-black bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center tracking-[1em] text-2xl"
              placeholder="••••"
              maxLength={4}
              data-testid="input-pin"
            />
          </div>

          {/* Spacer pour pousser les éléments en bas */}
          <div className="flex-1" />

          {/* Case à cocher CGU */}
          <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
            <div
              onClick={() => setTermsAccepted(v => !v)}
              className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                termsAccepted
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-slate-300'
              }`}
            >
              {termsAccepted && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <polyline points="2 7 5.5 10.5 12 3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-slate-700 text-sm font-medium">
              j'accepte les{' '}
              <span className="text-blue-600 font-semibold">Conditions d'utilisation</span>
            </span>
          </label>

          {/* Bouton Continuer */}
          <button
            type="submit"
            disabled={submitLogin.isPending || !isValid}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
            data-testid="button-login"
          >
            {submitLogin.isPending ? <Loader2 className="animate-spin" size={24} /> : 'Continuer'}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
