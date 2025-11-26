// jest.config.js
const nextJest = require('next/jest')

// next/jestを呼び出して、Next.js用のJest設定を作成します。
const createJestConfig = nextJest({
  // Next.jsアプリのルートディレクトリへのパスを提供します。
  dir: './',
})

// Jestに渡すカスタム設定
const customJestConfig = {
  // 各テストの前にセットアップするファイルを追加します。
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // テスト環境をjsdomに設定します。
  testEnvironment: 'jest-environment-jsdom',

  // TypeScriptのパスエイリアス（例: @/components/*）をJestが解決できるように設定します。
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // ts-jestプリセットを使用します。
  preset: 'ts-jest',
};

// createJestConfigをエクスポートして、Next.jsがJestの設定をロードできるようにします。
module.exports = createJestConfig(customJestConfig)
