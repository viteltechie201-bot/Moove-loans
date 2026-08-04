import { useState } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '../components/PageTransition';
import { Slider } from '../components/Slider';
import { formatFCFA, setSessionId, setLoanAmount } from '../lib/store';
import { useCreateLoanSession } from '@workspace/api-client-react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    loanType: 'Personal Loan',
    loanAmount: 500000,
    loanTermMonths: 12,
    loanPurpose: 'Business',
    loanPurposeOther: '',
    firstName: '',
    lastName: '',
    phone: '',
    employmentStatus: 'Employed',
    monthlyIncome: 150000,
  });

  const createLoanSession = useCreateLoanSession();

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = () => {
    // Determine actual purpose
    const purpose = formData.loanPurpose === 'Other' ? formData.loanPurposeOther : formData.loanPurpose;
    
    // Save loan amount for later
    setLoanAmount(formData.loanAmount.toString());

    createLoanSession.mutate({
      data: {
        loanType: formData.loanType,
        loanAmount: formData.loanAmount,
        loanTermMonths: formData.loanTermMonths,
        loanPurpose: purpose,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: "+237" + formData.phone, // Fixed prefix
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
        <div className="font-bold text-slate-800">Application</div>
        <div className="w-10 text-sm font-semibold text-primary text-right">{step}/3</div>
      </header>
      
      {/* Progress Bar */}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Loan Details</h2>
              <p className="text-slate-500 text-sm mb-8">Tell us about what you need.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Loan Type</label>
                  <select 
                    value={formData.loanType}
                    onChange={e => setFormData({...formData, loanType: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium appearance-none"
                  >
                    <option>Personal Loan</option>
                    <option>Business Loan</option>
                    <option>Emergency Loan</option>
                    <option>Education Loan</option>
                  </select>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-700">Amount</label>
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
                    <label className="text-sm font-bold text-slate-700">Term</label>
                    <span className="text-lg font-extrabold text-primary">{formData.loanTermMonths} months</span>
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">Purpose of Loan</label>
                  <select 
                    value={formData.loanPurpose}
                    onChange={e => setFormData({...formData, loanPurpose: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium appearance-none mb-3"
                  >
                    <option>Education</option>
                    <option>Medical</option>
                    <option>Business</option>
                    <option>Home Improvement</option>
                    <option>Debt Consolidation</option>
                    <option>Other</option>
                  </select>
                  
                  {formData.loanPurpose === 'Other' && (
                    <input 
                      type="text"
                      placeholder="Please specify"
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
                  Next Step
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
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Personal Details</h2>
              <p className="text-slate-500 text-sm mb-8">Tell us about yourself.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                  <input 
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                  <input 
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                  <div className="flex bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden">
                    <div className="px-4 py-3.5 bg-slate-50 border-r border-slate-200 text-slate-600 font-bold">
                      +237
                    </div>
                    <input 
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-4 py-3.5 text-slate-800 outline-none font-medium bg-transparent"
                      placeholder="6XXXXXXXX"
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 mb-6 flex gap-3">
                <button 
                  onClick={handleNext}
                  disabled={!formData.firstName || !formData.lastName || formData.phone.length < 8}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none"
                >
                  Next Step
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
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Employment</h2>
              <p className="text-slate-500 text-sm mb-8">Help us understand your income.</p>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Employment Status</label>
                  <select 
                    value={formData.employmentStatus}
                    onChange={e => setFormData({...formData, employmentStatus: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium appearance-none"
                  >
                    <option>Employed</option>
                    <option>Self-Employed</option>
                    <option>Business Owner</option>
                    <option>Student</option>
                    <option>Unemployed</option>
                  </select>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-700">Monthly Income</label>
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
                    "Submit Application"
                  )}
                </button>
                
                {createLoanSession.isError && (
                  <p className="text-red-500 text-sm text-center mt-3 font-medium">Failed to submit application. Please try again.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
