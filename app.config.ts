import os from 'os';
import type { ConfigContext, ExpoConfig } from 'expo/config';

function normalizeUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const withProtocol = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    const protocol = url.protocol.replace(':', '').toLowerCase();
    if (protocol !== 'http' && protocol !== 'https') {
      return null;
    }
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/api/detect';
    }
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    return null;
  }
}

function firstValidUrl(values: Array<string | null | undefined>): string | null {
  for (const candidate of values) {
    const normalized = normalizeUrl(candidate ?? null);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

function localNetworkFallback(): string {
  const interfaces = os.networkInterfaces();
  for (const items of Object.values(interfaces)) {
    if (!items) continue;
    for (const entry of items) {
      if (!entry || entry.internal || entry.family !== 'IPv4') {
        continue;
      }
      return `http://${entry.address}:8000/api/detect`;
    }
  }
  return 'http://127.0.0.1:8000/api/detect';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const detectUrl =
    firstValidUrl([
      process.env.EXPO_PUBLIC_DART_DETECTION_URL,
      process.env.DART_DETECTION_URL,
      process.env.DEEP_DARTS_TUNNEL_URL ? `${process.env.DEEP_DARTS_TUNNEL_URL}` : null,
      'http://192.168.0.18:8000/api/detect',
    ]) ?? localNetworkFallback();

  const base: ExpoConfig = {
    name: 'bolt-expo-nativewind',
    slug: 'bolt-expo-nativewind',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      [
        'expo-camera',
        {
          cameraPermission:
            'Cette application utilise la camera pour detecter automatiquement les flechettes sur la cible.',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      dartDetection: {
        endpoint: detectUrl,
      },
      dartDetectionUrl: detectUrl,
      EXPO_PUBLIC_DART_DETECTION_URL: detectUrl,
    },
  };

  return {
    ...config,
    ...base,
    extra: {
      ...(config?.extra ?? {}),
      ...base.extra,
    },
  };
};
