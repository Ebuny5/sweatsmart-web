import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sweatsmart.app',
  appName: 'SweatSmart',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      sound: 'water_sound.mp3',
    },
  },
};

export default config;
