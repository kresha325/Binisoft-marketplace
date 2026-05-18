import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const functionsTarget =
    env.VITE_FUNCTIONS_PROXY ||
    'https://us-central1-jon-sport.cloudfunctions.net';

  return {
    server: {
      port: Number(env.PORT) || 5179,
      open: true,
      proxy: {
        '/api/shop': {
          target: functionsTarget,
          changeOrigin: true,
          rewrite: (path) => `/publicApi${path}`,
        },
        '/api/public': {
          target: functionsTarget,
          changeOrigin: true,
          rewrite: (path) => `/publicApi${path}`,
        },
      },
    },
  };
});
