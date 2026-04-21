import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { audioAlertPlayer } from './utils/audioAlertPlayer';

// Service Worker → app: play the water sound + voice clip when a real push
// notification arrives. We no longer use browser speechSynthesis here.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data;
    if (!data) return;
    if (data.type === 'PLAY_NOTIFICATION_SOUND') {
      const kind =
        data.kind === 'reminder' ||
        data.kind === 'checkin' ||
        data.kind === 'extreme' ||
        data.kind === 'high' ||
        data.kind === 'moderate' ||
        data.kind === 'low'
          ? data.kind
          : 'reminder';
      audioAlertPlayer.playAlert(kind).catch((e) =>
        console.warn('Could not play notification audio:', e),
      );
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
