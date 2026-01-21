import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '**/*.d.ts',
      '**/vendor/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'text-summary',
        'json',
        'json-summary',
        'html',
        'lcov',
        'clover'
      ],
      reportsDirectory: './coverage',
      exclude: [
        // Dependencies and build files
        'node_modules/',
        'dist/',
        'build/',
        'coverage/',
        'playwright-report/',
        'test-results/',

        // Test files themselves
        'src/test/',
        'e2e/',
        '**/*.{test,spec}.{js,jsx,ts,tsx}',
        '**/*.d.ts',

        // Configuration files
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        'tailwind.config.js',
        'postcss.config.js',

        // Generated or vendor files
        '**/vendor/**',
        '**/.generated/**',
        '**/sw.js',
        '**/sw-enhanced.js',

        // Development only files
        'src/main.tsx', // Entry point
        '**/dev-dist/**',

        // Type definitions and interfaces
        'src/types/**/*.ts',
        '**/*.types.ts',

        // Mock and helper files
        'src/test/**',
        'src/mocks/**',
        '**/test-utils.tsx',

        // Assets and static files
        'public/**',
        '**/*.css',
        '**/*.scss',
        '**/*.less'
      ],
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '!src/test/**',
        '!src/types/**',
        '!src/main.tsx'
      ],
      all: true,
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80
        },
        // Critical business logic should have higher coverage
        'src/services/**/*.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/utils/**/*.ts': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/hooks/**/*.ts': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      // Enable source map support for better debugging
      clean: true,
      cleanOnRerun: true
    },
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    // Performance
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    // Reporter configuration
    reporter: [
      'verbose',
      'json'
    ],
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-report.html'
    },
    // Watch mode configuration
    watch: false,
    // Disable isolation for better performance in large codebases
    isolate: false,
    // Mock configuration
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  }
});