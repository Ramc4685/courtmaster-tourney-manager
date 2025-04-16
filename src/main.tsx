import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isSupabaseConfigured } from './services/storage/StorageService'
import { toast } from 'sonner'
import { TournamentProvider } from './contexts/tournament/TournamentContext'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

// Add more detailed debugging
console.log('Application starting...');

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

// Add console log to debug rendering
console.log('Initializing app render');

// Make sure we're finding the root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found! Check if the HTML file has a div with id='root'");
} else {
  console.log('Root element found, rendering app');
  try {
    const root = createRoot(rootElement);
    console.log('Root created successfully');
    root.render(
      <TournamentProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <App />
        </LocalizationProvider>
      </TournamentProvider>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
  }
}
