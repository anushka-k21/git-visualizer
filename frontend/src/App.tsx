import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RepositoryPage from './pages/RepositoryPage';
import RepositoryLayout from './layouts/RepositoryLayout';
import RepositoryGraphPage from './pages/RepositoryGraphPage';
import RepositoryTimelinePage from './pages/RepositoryTimelinePage';
import RepositoryInsightsPage from './pages/RepositoryInsightsPage';
import RepositoryFilesPage from './pages/RepositoryFilesPage';
import BranchComparisonPage from './pages/BranchComparisonPage';
import RepositoryPlaybackPage from './pages/RepositoryPlaybackPage';
import ImpactDashboardPage from './pages/ImpactDashboardPage';
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
          <Route path="/repositories/:repositoryId" element={<RepositoryLayout />}>
            <Route index element={<Navigate to="graph" replace />} />
            <Route path="graph" element={<RepositoryGraphPage />} />
            <Route path="timeline" element={<RepositoryTimelinePage />} />
            <Route path="files" element={<RepositoryFilesPage />} />
            <Route path="insights" element={<RepositoryInsightsPage />} />
            <Route path="compare" element={<BranchComparisonPage />} />
            <Route path="playback" element={<RepositoryPlaybackPage />} />
            <Route path="impact" element={<ImpactDashboardPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppLayout />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
