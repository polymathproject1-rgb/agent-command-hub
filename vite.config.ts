import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const clawBuddyUrl = env.CLAWBUDDY_API_URL || '';
  const clawBuddySecret = env.CLAWBUDDY_WEBHOOK_SECRET || '';

  const target = clawBuddyUrl ? new URL(clawBuddyUrl) : null;
  const targetOrigin = target ? `${target.protocol}//${target.host}` : undefined;
  const targetPath = target?.pathname || '/functions/v1/ai-tasks';

  return {
    server: {
      host: '::',
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: targetOrigin
        ? {
            '/api/clawbuddy': {
              target: targetOrigin,
              changeOrigin: true,
              secure: true,
              rewrite: () => targetPath,
              headers: {
                ...(clawBuddySecret ? { 'x-webhook-secret': clawBuddySecret } : {}),
              },
            },
          }
        : undefined,
    },
    plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
