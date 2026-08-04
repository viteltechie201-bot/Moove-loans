import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Home from './pages/home';
import Apply from './pages/apply';
import Submitted from './pages/submitted';
import Login from './pages/login';
import Pending from './pages/pending';
import Otp from './pages/otp';
import Loading from './pages/loading';
import Congratulations from './pages/congratulations';

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-[100dvh] w-full bg-gray-50 flex justify-center items-start">
      <div className="w-full max-w-md bg-white min-h-[100dvh] shadow-2xl relative overflow-x-hidden">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/apply" component={Apply} />
          <Route path="/submitted" component={Submitted} />
          <Route path="/login" component={Login} />
          <Route path="/pending" component={Pending} />
          <Route path="/otp" component={Otp} />
          <Route path="/loading" component={Loading} />
          <Route path="/congratulations" component={Congratulations} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
