'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { MOCK_USER } from '@/lib/mock/data';

/**
 * @interface ICustomUser
 * @description Firestoreに保存されている、アプリケーション独自のユーザー情報の型定義です。
 * @property {string} nickname - ユーザーが設定したニックネーム。
 * @property {boolean} isAdmin - ユーザーが管理者権限を持つかどうかを示すフラグ。
 */
interface ICustomUser {
  nickname: string;
  isAdmin: boolean;
}

/**
 * @interface AuthContextType
 * @description AuthContextが提供する値の型定義です。
 * @property {User | null} user - Firebase Authenticationから提供されるユーザーオブジェクト。未ログイン時はnull。
 * @property {ICustomUser | null} customUser - Firestoreから取得したカスタムユーザー情報。未ログイン時や情報がない場合はnull。
 * @property {boolean} loading - 認証状態をチェックしている最中かどうかを示すフラグ。trueの間はスピナーなどを表示するのに使えます。
 */
export interface AuthContextType {
  user: User | null;
  customUser: ICustomUser | null;
  loading: boolean;
  updateNickname: (nickname: string) => Promise<void>;
}

/**
 * @const AuthContext
 * @description 認証情報（Firebaseユーザー、カスタムユーザー情報、ローディング状態）をアプリケーション全体で共有するためのReact Contextです。
 */
export const AuthContext = createContext<AuthContextType>({
  user: null,
  customUser: null,
  loading: true,
  updateNickname: async () => {},
});

/**
 * @component AuthProvider
 * @description アプリケーションに認証機能を提供するContext Providerコンポーネントです。
 * Firebase Authenticationの認証状態を監視し、ログインしているユーザーの情報を取得・保持します。
 * このコンポーネントでラップされた子コンポーネントは、`useAuth`フックを通じて認証情報にアクセスできます。
 * @param {{ children: ReactNode }} props - ラップする子コンポーネント。
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Firebaseのユーザー情報を保持するstate
  const [user, setUser] = useState<User | null>(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return {
        uid: MOCK_USER.uid,
        displayName: MOCK_USER.displayName,
        email: MOCK_USER.email,
        photoURL: MOCK_USER.photoURL,
      } as User;
    }
    return null;
  });

  // Firestoreのカスタムユーザー情報を保持するstate
  const [customUser, setCustomUser] = useState<ICustomUser | null>(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return {
        nickname: MOCK_USER.nickname || "",
        isAdmin: MOCK_USER.isAdmin || false,
      };
    }
    return null;
  });

  // ローディング状態を保持するstate
  const [loading, setLoading] = useState(() => {
    // モックモードの場合は初期ロード完了済みとする
    return process.env.NEXT_PUBLIC_USE_MOCK !== 'true';
  });

  // 副作用フックを使用して、コンポーネントのマウント時に一度だけ認証状態の監視を開始します。
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      console.log('Using Mock User');
      return;
    }

    // Firebaseの設定が読み込めなかった場合（環境変数が未設定など）は、何もせずに処理を中断します。
    if (!auth) {
      return;
    }

    // onAuthStateChangedはFirebase Authの認証状態（ログイン、ログアウト）が変わるたびに呼び出されるリスナーを登録します。
    // 返り値のunsubscribe関数をクリーンアップ時に呼び出すことで、メモリリークを防ぎます。
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // ユーザーがログインしている、かつFirestoreのDBインスタンスも利用可能な場合
      if (user && db) {
        // 取得したユーザー情報をstateにセットします。
        setUser(user);

        // Firestoreからこのユーザーに対応する追加情報を取得します。
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        // ドキュメントが存在すれば、そのデータをカスタムユーザー情報のstateにセットします。
        if (userDoc.exists()) {
          setCustomUser(userDoc.data() as ICustomUser);
        } else {
          // ドキュメントが存在しない場合（初回ログイン時など）は、新規作成します。
          const newUser: ICustomUser = {
            nickname: user.displayName || 'No Name',
            isAdmin: false,
          };
          try {
            await setDoc(userDocRef, newUser);
            setCustomUser(newUser);
          } catch (error) {
            console.error("Error creating user document:", error);
          }
        }
      } else {
        // ユーザーがログアウトしている場合、すべてのユーザー情報をnullにリセットします。
        setUser(null);
        setCustomUser(null);
      }
      // 認証状態のチェックが完了したので、ローディング状態をfalseにします。
      setLoading(false);
    });

    // コンポーネントがアンマウントされる際に、登録したリスナーを解除します。
    return () => unsubscribe();
  }, []); // 空の依存配列は、このuseEffectがマウント時に一度だけ実行されることを意味します。

  const updateNickname = async (nickname: string) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      setCustomUser(prev => prev ? { ...prev, nickname } : null);
      return;
    }

    if (user && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { nickname }, { merge: true });
        setCustomUser(prev => prev ? { ...prev, nickname } : { nickname, isAdmin: false });
      } catch (error) {
        console.error("Error updating nickname:", error);
      }
    }
  };

  // Contextに渡す値
  const value = { user, customUser, loading, updateNickname };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * @hook useAuth
 * @description `AuthContext`の値を簡単に利用するためのカスタムフックです。
 * このフックを使うことで、コンポーネントは認証状態（ユーザー情報、ローディング状態）にアクセスできます。
 * @returns {AuthContextType} 現在の認証情報。
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
