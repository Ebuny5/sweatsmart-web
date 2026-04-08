import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// Register service worker for background notifications and offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('SW registration failed:', err);
  });
}

// Listen for service worker messages — plays sound when a real notification arrives
// This runs once at app start and handles PLAY_NOTIFICATION_SOUND from sw.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'PLAY_NOTIFICATION_SOUND') {
      try {
        // Use browser TTS with a lady's voice instead of beep tones
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel();
          const msg = new SpeechSynthesisUtterance('Attention. You have a new SweatSmart alert. Please check your notifications.');
          msg.lang = 'en-US';
          msg.rate = 1.0;
          msg.pitch = 1.0;
          msg.volume = 1.0;
          // Try to pick a female voice
          const voices = speechSynthesis.getVoices();
          const femaleKeywords = ['female', 'samantha', 'victoria', 'karen', 'fiona', 'zira', 'hazel', 'jenny', 'aria', 'sara'];
          const femaleVoice = voices.filter(v => v.lang.startsWith('en')).find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k))) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          if (femaleVoice) msg.voice = femaleVoice;
          speechSynthesis.speak(msg);
        }
      } catch (e) {
        console.warn('Could not play notification voice:', e);
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);