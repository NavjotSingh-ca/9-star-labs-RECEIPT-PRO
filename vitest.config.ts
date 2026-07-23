import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules'],
    coverage: {
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder-test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-test-key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
