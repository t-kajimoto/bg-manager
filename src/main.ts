import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * @file main.ts
 * @description
 * このアプリケーションのメインエントリーポイント（起動ファイル）です。
 * ここからAngularアプリケーションのブートストラップ（起動プロセス）が開始されます。
 */

// `bootstrapApplication`関数を呼び出して、Angularアプリケーションを起動します。
// 第一引数には、ルートとなるコンポーネント（AppComponent）を指定します。
// 第二引数には、アプリケーション全体の設定（appConfig）を渡します。
bootstrapApplication(AppComponent, appConfig)
  // 起動プロセス中にエラーが発生した場合、それをキャッチしてコンソールに出力します。
  .catch((err) => console.error(err));