import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { environment } from './../environments/environment';

/**
 * @constant appConfig
 * @description
 * このアプリケーションの全体的な設定と、DI（依存性注入）コンテナに提供するプロバイダーを定義します。
 * Angular v15以降のStandalone Componentsベースのアプリケーションにおける中心的な設定ファイルです。
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Zone.jsの変更検知設定を最適化します。
    provideZoneChangeDetection({ eventCoalescing: true }),
    // app.routes.tsで定義されたルーティング設定を提供します。
    provideRouter(routes),
    // Firebaseアプリを初期化し、DIコンテナに提供します。
    // environmentファイルから取得した設定情報を使用します。
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Firebase AuthenticationサービスをDIコンテナに提供します。
    provideAuth(() => getAuth()),
    // FirestoreデータベースサービスをDIコンテナに提供します。
    provideFirestore(() => getFirestore()),
    // Angular Materialのアニメーションを有効にするために必要です。
    provideAnimations(),
    // Angular Materialのフォームフィールドのデフォルトオプションを設定します。
    // `subscriptSizing: 'dynamic'`は、ヒントやエラーメッセージの表示領域を動的に確保する設定です。
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    // NgModuleベースのライブラリ（この場合はAngular Materialの各モジュール）を
    // Standalone環境に提供するためのヘルパー関数です。
    importProvidersFrom(
      MatSnackBarModule, 
      MatDialogModule, 
      MatFormFieldModule, 
      MatInputModule, 
      FormsModule, 
      MatSliderModule
    )
  ]
};
