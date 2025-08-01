import { Routes } from '@angular/router';
import { ListComponent } from './page/list/list.component';

/**
 * @constant routes
 * @description
 * このアプリケーションのルーティング設定を定義する配列です。
 * URLのパスと、それに対応して表示するコンポーネントをマッピングします。
 */
export const routes: Routes = [
    // 'list' パスにアクセスされた場合、ListComponent を表示します。
    // これがアプリケーションのメインページとなります。
    {path:'list',component:ListComponent},
    // 上記で定義されたどのパスにも一致しない場合（例: ルートパス'/'など）は、
    // 自動的に'/list'パスにリダイレクトします。
    // `pathMatch: 'full'`は、URL全体が完全に一致する場合にのみリダイレクトを適用する設定です。
    {path: '**', redirectTo: '/list', pathMatch: 'full'}
];