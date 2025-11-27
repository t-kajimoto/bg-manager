// jest.setup.js

// [Polyfill for TextEncoder/TextDecoder]
// Jestのテスト環境(jsdom)にはTextEncoder/TextDecoderがデフォルトで含まれていないため、
// Node.jsの組み込み`util`モジュールからインポートしてグローバルスコープに設定します。
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

// [Polyfill for fetch API]
// Firebase SDKなどがテスト環境で正常に動作するよう、`node-fetch`をグローバルスコープに設定します。
const fetch = require('node-fetch');
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;

// [@testing-library/jest-dom]
// すべてのテストファイルでjest-domのマッチャー（例: .toBeInTheDocument()）が
// 自動的に利用できるようになります。
require('@testing-library/jest-dom');

// Firebaseの初期化をモック化します。
// これにより、テスト実行時に実際のFirebaseプロジェクトに接続しようとすることを防ぎます。
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => [{ name: '[DEFAULT]' }]),
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})), // ダミーのFirestoreオブジェクトを返す
  // collection, query, onSnapshotは各テストファイルで個別にモックする
}));
