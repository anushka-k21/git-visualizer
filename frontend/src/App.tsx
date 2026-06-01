import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RepositoryPage from './pages/RepositoryPage';
import RepositoryGraphPage from './pages/RepositoryGraphPage';
import RepositoryTimelinePage from './pages/RepositoryTimelinePage';
import { useRepositories } from './hooks/useRepositories';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout() {
  const { data: repositories } = useRepositories();

  return (
    <div className="min-h-screen">
      <Navbar repositoryCount={repositories?.length} />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repositories" element={<RepositoryPage />} />
          <Route path="/repositories/:id/graph" element={<RepositoryGraphPage />} />
          <Route path="/repositories/:id/timeline" element={<RepositoryTimelinePage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
