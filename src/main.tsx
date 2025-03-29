
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isSupabaseConfigured } from './lib/supabase.ts'
import { toast } from 'sonner'

// Check if Supabase is configured and show a warning if not
if (!isSupabaseConfigured()) {
  console.warn('Supabase is not configured. Some features may not work correctly.');
  // We'll display a toast notification after the app loads
  setTimeout(() => {
    toast.warning(
      'Supabase connection not configured',
      {
        description: 'Please connect your Supabase project in the Lovable dashboard to enable full functionality.',
        duration: 6000
      }
    );
  }, 1000);
}

createRoot(document.getElementById("root")!).render(<App />);
