
// @/lib/firebase/__mocks__/config.ts
// このファイルは、Jestのテスト環境で@/lib/firebase/configモジュールをモックするために使用されます。

// ダミーのFirestoreインスタンスをエクスポートします。
// 中身は空のオブジェクトで問題ありません。テストの目的は、`db`がnullでないことを保証することです。
export const db = {};

// ダミーのAuthインスタンスをエクスポートします。
export const auth = {};
