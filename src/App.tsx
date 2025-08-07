import { Toaster } from 'sonner';
import { TournamentProvider } from '@/contexts/tournament/TournamentContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppRouter } from './router';
import { NotificationProvider } from '@/contexts/notification/NotificationProvider';

export default function App() {
  return (
    <TournamentProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AppRouter />
        <Toaster />
      </LocalizationProvider>
    </TournamentProvider>
  );
}
