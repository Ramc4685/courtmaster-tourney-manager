import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { toast } from 'sonner'
import { TournamentProvider } from './contexts/tournament/TournamentContext'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

// Add more detailed debugging
console.log('Application starting...');

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
