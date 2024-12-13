/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts',
    '@testing-library/jest-dom'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }]
        ],
        plugins: ['@babel/plugin-transform-runtime']
      }
    ],
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env', '@babel/preset-react']
      }
    ]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!react-dropzone|jest-axe)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironmentOptions: {
    customExportConditions: [''],
    accessibility: true
  }
};

export default config; 