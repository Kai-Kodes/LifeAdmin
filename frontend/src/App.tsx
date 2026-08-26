import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import ObligationList from './pages/ObligationList';
import ObligationDetail from './pages/ObligationDetail';
import Documents from './pages/Documents';
import Bills from './pages/Bills';
import PlaceholderPage from './pages/PlaceholderPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="obligations" element={<ObligationList />} />
            <Route path="obligations/:id" element={<ObligationDetail />} />
            <Route path="bills" element={<Bills />} />
            <Route
              path="calendar"
              element={
                <PlaceholderPage
                  title="Calendar"
                  description="Calendar view of your upcoming deadlines and renewals. This feature is in development."
                />
              }
            />
            <Route path="documents" element={<Documents />} />
            <Route
              path="settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  description="Configure your LifeAdmin preferences, notifications, and account settings. This feature is in development."
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
