import { Routes } from '@angular/router';
import { ListComponent } from './page/list/list.component';

/**
 * アプリケーションのルーティング定義。
 * 現在はボードゲームのリスト表示ページへのルートのみが定義されている。
 */
export const routes: Routes = [
    // 'list' パスが指定された場合、ListComponent を表示する
    {path:'list',component:ListComponent},
    // 上記以外のすべてのパスは 'list' パスにリダイレクトする
    {path: '**', redirectTo: '/list', pathMatch: 'full'}
];
