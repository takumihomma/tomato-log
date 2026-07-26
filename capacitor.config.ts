import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.tomato.log',
  appName: 'Tomato Log',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#FF385C',
      sound: 'whatsup.wav'
    }
  }
};

export default config;
