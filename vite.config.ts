import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const agentApiUrl = env.AGENT_COMMAND_API_URL || '';
  const agentApiSecret = env.AGENT_COMMAND_WEBHOOK_SECRET || '';

  const target = agentApiUrl ? new URL(agentApiUrl) : null;
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
            '/api/agent-tasks': {
              target: targetOrigin,
              changeOrigin: true,
              secure: true,
              rewrite: () => targetPath,
              headers: {
                ...(agentApiSecret ? { 'x-webhook-secret': agentApiSecret } : {}),
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
