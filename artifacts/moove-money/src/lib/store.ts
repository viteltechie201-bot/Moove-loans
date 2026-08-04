export const getSessionId = () => localStorage.getItem('moove_session_id');
export const setSessionId = (id: string) => localStorage.setItem('moove_session_id', id);

export const getLoanAmount = () => localStorage.getItem('moove_loan_amount');
export const setLoanAmount = (amt: string) => localStorage.setItem('moove_loan_amount', amt);

export const formatFCFA = (amount: number) => {
  return amount.toLocaleString('fr-FR') + ' FCFA';
};
