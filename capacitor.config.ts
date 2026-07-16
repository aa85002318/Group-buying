import type { CapacitorConfig } from "@capacitor/cli";

const productionUrl = "https://shop.chimeidiygroupbuying.com";
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() || productionUrl;

const config: CapacitorConfig = {
  appId: "com.chimeidiy.groupbuy",
  appName: "CHIMEIDIY 團購",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#E53935",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#E53935",
    },
  },
};

export default config;
