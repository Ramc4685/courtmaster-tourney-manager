import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files (consolidated at bottom)
    
    // Global test configuration
    globals: true,
    
    // Coverage configuration for MVP requirements
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Strict coverage thresholds for MVP
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
        'src/services/rules/**': { lines: 90, branches: 85, functions: 90, statements: 90 },
        'src/utils/scoringRules.ts': { lines: 95, branches: 90, functions: 95, statements: 95 },
        'src/services/tournament/formats/**': { lines: 85, branches: 80, functions: 85, statements: 85 },
      },
      
      // Include patterns for MVP features
      include: [
        'src/components/**/*.{ts,tsx}',
        'src/services/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/contexts/**/*.{ts,tsx}'
      ],
      
      // Exclude patterns
      exclude: [
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/types/**',
        'src/config/**',
        'src/assets/**',
        'node_modules/**',
        'dist/**'
      ],
      
      // Exclude lines from coverage
      excludeNodeModules: true,
      
      // Skip coverage for files with no tests
      skipFull: false,
      
      // Clean coverage directory before each run
      clean: true,
      
      // Generate detailed reports
      all: true
    },
    
    // Test file patterns for MVP
    include: [
      'src/test/unit/**/*.test.{ts,tsx}',
      'src/test/integration/**/*.test.{ts,tsx}',
      'src/test/components/**/*.test.{ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '**/*.config.{ts,js}',
      '**/e2e/**'
    ],
    
    // Test timeouts for different test types
    testTimeout: 10000, // 10 seconds for unit tests
    hookTimeout: 15000, // 15 seconds for setup/teardown
    
    // Retry configuration for flaky tests
    retry: 2,
    
    // Concurrent test execution
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // Reporter configuration
    reporter: [
      'default',
      'json',
      'html',
      ['junit', { outputFile: './coverage/junit.xml' }]
    ],
    
    // Output configuration
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-report.html'
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    
    // Performance testing configuration
    benchmark: {
      include: ['src/test/performance/**/*.bench.{ts,tsx}'],
      exclude: ['node_modules/**'],
      reporters: ['default', 'json'],
      outputFile: './coverage/benchmark-results.json'
    },
    
    // Watch mode configuration
    watch: {
      ignore: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.log'
      ]
    },
    
    // Environment variables for MVP testing
    env: {
      NODE_ENV: 'test',
      VITE_APP_ENV: 'mvp-test',
      VITE_APPWRITE_ENDPOINT: 'http://localhost:8080/v1',
      VITE_APPWRITE_PROJECT_ID: 'test-project',
      VITE_ENABLE_OFFLINE: 'true',
      VITE_ENABLE_PWA: 'true'
    },
    
    // Pool options for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    },
    
    // Snapshot configuration
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace('/src/', '/src/test/__snapshots__/') + snapExtension;
    },
    
    // Custom matchers and utilities
    setupFiles: [
      './src/test/setup.ts',
      './src/test/mvp-setup.ts'
    ]
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './src/test')
    }
  },
  
  // Define configuration for different environments
  define: {
    __TEST__: true,
    __MVP__: true,
    __DEV__: false,
    __PROD__: false
  },
  
  // Optimizations for test performance
  esbuild: {
    target: 'node14',
    sourcemap: true
  },
  
  // CSS handling in tests
  css: {
    modules: {
      classNameStrategy: 'non-scoped'
    }
  }
});

// Export additional configurations for different test scenarios
export const integrationConfig = defineConfig({
  ...defineConfig({}).test,
  test: {
    ...defineConfig({}).test?.test,
    include: ['src/test/integration/**/*.test.{ts,tsx}'],
    testTimeout: 30000, // Longer timeout for integration tests
    coverage: {
      ...defineConfig({}).test?.test?.coverage,
      thresholds: {
        lines: 70, // Slightly lower for integration tests
        branches: 70,
        functions: 70,
        statements: 70
      }
    }
  }
});

export const unitConfig = defineConfig({
  ...defineConfig({}).test,
  test: {
    ...defineConfig({}).test?.test,
    include: ['src/test/unit/**/*.test.{ts,tsx}'],
    testTimeout: 5000, // Shorter timeout for unit tests
    coverage: {
      ...defineConfig({}).test?.test?.coverage,
      thresholds: {
        lines: 85, // Higher coverage for unit tests
        branches: 85,
        functions: 85,
        statements: 85
      }
    }
  }
});

export const componentConfig = defineConfig({
  ...defineConfig({}).test,
  test: {
    ...defineConfig({}).test?.test,
    include: ['src/test/unit/components/**/*.test.{ts,tsx}'],
    testTimeout: 8000, // Medium timeout for component tests
    coverage: {
      ...defineConfig({}).test?.test?.coverage,
      include: ['src/components/**/*.{ts,tsx}'],
      thresholds: {
        lines: 75,
        branches: 75,
        functions: 75,
        statements: 75
      }
    }
  }
});
