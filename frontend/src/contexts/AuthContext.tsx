"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { MOCK_USER } from "@/lib/mock/data";

/**
 * @interface ICustomUser
 * @description Supabaseのprofilesテーブルに保存されている、アプリケーション独自のユーザー情報の型定義です。
 */
export type Visibility = "public" | "friends" | "private";

/**
 * @interface ICustomUser
 * @description Supabaseのprofilesテーブルに保存されている、アプリケーション独自のユーザー情報の型定義です。
 */
interface ICustomUser {
  nickname: string;
  isAdmin: boolean;
  /** profilesテーブルにdiscriminatorが設定済みかどうかのフラグ */
  isProfileSetup: boolean;
  displayName?: string;
  email?: string;
  photoURL?: string;
  discriminator?: string;
  bio?: string;
  visibilityGames?: Visibility;
  visibilityMatches?: Visibility;
  visibilityFriends?: Visibility;
  visibilityUserList?: Visibility;
}

/**
 * @interface AuthContextType
 * @description AuthContextが提供する値の型定義です。
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  customUser: ICustomUser | null;
  loading: boolean;
  updateNickname: (nickname: string) => Promise<void>;
  updateProfile: (data: Partial<ICustomUser>) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * @const AuthContext
 */
export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  customUser: null,
  loading: true,
  updateNickname: async () => {},
  updateProfile: async () => {},
  signOut: async () => {},
});

/**
 * @component AuthProvider
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [customUser, setCustomUser] = useState<ICustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  }, [user, loading, session]);

  // Mock handling (if needed)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
      setUser({
        id: MOCK_USER.uid,
        email: MOCK_USER.email,
        user_metadata: {
          full_name: MOCK_USER.displayName,
          avatar_url: MOCK_USER.photoURL,
        },
      } as unknown as User);
      setCustomUser({
        nickname: MOCK_USER.nickname || "",
        isAdmin: MOCK_USER.isAdmin || false,
        isProfileSetup: true,
      });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "true") return;

    let mounted = true;

    const fetchProfile = async (sessionUser: User) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .maybeSingle();

        if (mounted) {
          if (profile) {
            // Google等のOAuthから画像を取得できているが、DBに保存されていない場合は初回同期
            const googleAvatarUrl = sessionUser.user_metadata?.avatar_url;
            if (!profile.avatar_url && googleAvatarUrl) {
              await supabase
                .from("profiles")
                .update({ avatar_url: googleAvatarUrl })
                .eq("id", sessionUser.id);
            }

            setCustomUser({
              nickname:
                profile.username ||
                sessionUser.user_metadata?.full_name ||
                "No Name",
              isAdmin: profile.username === "admin",
              // discriminatorが存在すれば初期設定完了とみなす
              isProfileSetup: !!profile.discriminator,
              displayName:
                profile.display_name || sessionUser.user_metadata?.full_name,
              email: sessionUser.email,
              photoURL: profile.avatar_url || googleAvatarUrl,
              discriminator: profile.discriminator,
              bio: profile.bio,
              visibilityGames: profile.visibility_games as Visibility,
              visibilityMatches: profile.visibility_matches as Visibility,
              visibilityFriends: profile.visibility_friends as Visibility,
              visibilityUserList: profile.visibility_user_list as Visibility,
            });
          } else {
            setCustomUser({
              nickname: sessionUser.user_metadata?.full_name || "No Name",
              isAdmin: false,
              // profilesテーブルにレコードがない = 初期設定未完了
              isProfileSetup: false,
              displayName: sessionUser.user_metadata?.full_name,
              email: sessionUser.email,
              photoURL: sessionUser.user_metadata?.avatar_url,
              visibilityGames: "public",
              visibilityMatches: "public",
              visibilityFriends: "public",
              visibilityUserList: "public",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            setLoading(false); // プロフィール取得を待たずにUIを表示
            await fetchProfile(session.user);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        // Ignore AbortError which can happen on navigation
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Auth initialization aborted');
          if (mounted) setLoading(false);
          return;
        }
        console.error("Error initializing auth:", err);
        if (mounted) setLoading(false);
      }
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Only re-fetch if state actually changed or it's a critical event
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED" ||
        event === "INITIAL_SESSION"
      ) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(false); // プロフィール取得を待たずにUIを表示
          await fetchProfile(session.user);
        } else {
          setLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setCustomUser(null);
        setLoading(false);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const updateNickname = async (nickname: string) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
      setCustomUser((prev) => (prev ? { ...prev, nickname } : null));
      return;
    }
    if (!user) return;

    // Optimistic Update
    const previousUser = customUser;
    setCustomUser((prev) => (prev ? { ...prev, nickname } : null));

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, username: nickname });

      if (error) {
        console.error("Error updating nickname:", error);
        // Revert on error
        setCustomUser(previousUser);
        throw error; // Component側でエラーハンドリングできるように再スロー
      }
    } catch (error) {
      console.error("Error updating nickname:", error);
      setCustomUser(previousUser);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<ICustomUser>) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
      setCustomUser((prev) => (prev ? { ...prev, ...data } : null));
      return;
    }
    if (!user) return;

    // Optimistic Update
    const previousUser = customUser;
    setCustomUser((prev) => (prev ? { ...prev, ...data } : null));

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: data.displayName,
          discriminator: data.discriminator,
          bio: data.bio,
          avatar_url: data.photoURL,
          username: data.displayName, // 同期
          visibility_games: data.visibilityGames,
          visibility_matches: data.visibilityMatches,
          visibility_friends: data.visibilityFriends,
          visibility_user_list: data.visibilityUserList,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error updating profile:", error);
        // Revert on error
        setCustomUser(previousUser);
        throw error;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setCustomUser(previousUser);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      user,
      session,
      customUser,
      loading,
      updateNickname,
      updateProfile,
      signOut,
    }),
    [user, session, customUser, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
