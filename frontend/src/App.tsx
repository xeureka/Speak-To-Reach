import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

import { AuthProvider } from './auth';
import { queryClient } from './lib/query-client';
import { router } from './lib/router';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
        <Analytics />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
