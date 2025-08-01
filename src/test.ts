// このファイルは karma.conf.js によって読み込まれ、再帰的にすべての .spec ファイルとフレームワークファイルをロードします。
// そのため、ユニットテストを実行する際の最初のエントリーポイントとなります。

import 'zone.js/testing'; // Angularのテストにはzone.jsのテスト用モジュールが必須です。
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// まず、Angularのテスト環境を初期化します。
// getTestBed()は、現在のテスト実行環境（TestBed）への参照を取得する関数です。
getTestBed().initTestEnvironment(
  // `BrowserDynamicTestingModule`は、ブラウザベースのテストに必要な設定を提供します。
  BrowserDynamicTestingModule,
  // `platformBrowserDynamicTesting`は、テストプラットフォームを初期化します。
  platformBrowserDynamicTesting(),
  // オプション: 各テストの後にコンポーネントを自動的に破棄するかどうかの設定です。
  // `false`に設定すると、テスト間のクリーンアップを手動で制御する必要がある場合に役立ちますが、
  // 一般的には`true`（デフォルト）が推奨されます。このプロジェクトでは明示的に`false`が設定されています。
  {
    teardown: { destroyAfterEach: false }
  }
);