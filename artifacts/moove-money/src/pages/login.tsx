import { useState } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { useSubmitLogin } from '@workspace/api-client-react';
import { getSessionId, setSessionId } from '../lib/store';
import { CircleDollarSign, Loader2 } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [countryCode, setCountryCode] = useState('+237');
  
  const submitLogin = useSubmitLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8 || pin.length !== 4) return;

    let sessionId = getSessionId() || 'new-session-id'; // Fallback if direct entry

    submitLogin.mutate({
      sessionId,
      data: { phone: countryCode + phone, pin }
    }, {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
        setLocation('/pending');
      }
    });
  };

  return (
    <PageTransition>
      <div className="flex-1 flex flex-col pt-12 pb-8 px-6">
        <div className="flex items-center gap-2 justify-center mb-12">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <CircleDollarSign size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-800">Moove Money</span>
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Log in to check your application</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
            <div className="flex bg-slate-50 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary border border-slate-200 transition-all overflow-hidden">
              <select 
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="bg-transparent border-r border-slate-200 px-3 py-4 text-slate-700 font-bold outline-none appearance-none"
              >
                <option value="+237">+237 (CMR)</option>
                <option value="+225">+225 (CIV)</option>
                <option value="+221">+221 (SEN)</option>
                <option value="+233">+233 (GHA)</option>
                <option value="+234">+234 (NGA)</option>
              </select>
              <input 
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-4 text-slate-900 outline-none font-medium bg-transparent text-lg tracking-wide"
                placeholder="6XXXXXXXX"
                maxLength={9}
              />
            </div>
          </div>

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
            />
          </div>

          <button 
            type="submit"
            disabled={submitLogin.isPending || phone.length < 8 || pin.length !== 4}
            className="w-full py-4 mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-lg hover:shadow-orange-500/50 transition-shadow shadow-lg shadow-orange-500/30 flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
          >
            {submitLogin.isPending ? <Loader2 className="animate-spin" size={24} /> : "Login"}
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
        <div className="w-12 h-1.5 bg-orange-200 rounded-full"></div>
      </div>
    </PageTransition>
  );
}
