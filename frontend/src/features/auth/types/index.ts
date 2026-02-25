/**
 * @interface IUser
 * @description
 * Firestoreの`users`コレクションに保存される、ユーザーのプロフィール情報を表すインターフェースです。
 * Firebase Authenticationの基本情報に加えて、アプリケーション固有の情報を持ちます。
 */
export interface IUser {
  /** Firebase Authenticationによって割り当てられる一意なユーザーID */
  uid: string;
  /** ユーザーのメールアドレス（提供されている場合） */
  email: string | null;
  /** Googleアカウントなどの表示名 */
  displayName: string | null;
  /** Googleアカウントなどのプロフィール写真のURL */
  photoURL: string | null;
  /** ユーザーが管理者権限を持つかを示すフラグ */
  isAdmin?: boolean;
}
