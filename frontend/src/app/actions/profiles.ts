'use server';

import { createClient } from '@/lib/supabase/server';

export interface IProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  display_name: string | null;
  discriminator: string | null;
  bio: string | null;
}

/**
 * アプリの登録ユーザー一覧を取得します。
 * 公開設定が「非公開」以外のユーザーを表示します。
 */
export async function getProfiles() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, username, full_name, avatar_url, display_name, discriminator, visibility_user_list, bio',
      )
      .neq('visibility_user_list', 'private')
      .order('display_name', { ascending: true });

    if (error) throw error;
    return { data: data as IProfile[], error: null };
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return { data: [], error: 'Failed to fetch profiles' };
  }
}

/**
 * ユーザー名の重複を確認し、利用可能なディスクリミネータを生成します。
 */
export async function generateDiscriminator(displayName: string) {
  const supabase = await createClient();

  // 0001-9999のランダムな数字を生成
  // 重複しなくなるまで試行（簡易実装）
  for (let i = 0; i < 5; i++) {
    const disc = Math.floor(1 + Math.random() * 9999)
      .toString()
      .padStart(4, '0');
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('display_name', displayName)
      .eq('discriminator', disc)
      .maybeSingle();

    if (!data) return disc;
  }
  return null;
}

/**
 * プロフィール情報を更新します。
 */
export interface UpdateProfileData {
  display_name: string;
  discriminator: string;
  bio: string;
}

export async function updateProfile(profileData: UpdateProfileData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profileData.display_name,
        discriminator: profileData.discriminator,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        username: profileData.display_name, // 後方互換性のため一旦usernameも同期
        visibility_games: profileData.visibility_games,
        visibility_matches: profileData.visibility_matches,
        visibility_friends: profileData.visibility_friends,
        visibility_user_list: profileData.visibility_user_list,
      })
      .eq('id', user.id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error: 'Failed to update profile' };
  }
}

/**
 * プロフィール画像をアップロードします。
 */
export async function uploadAvatar(formData: FormData) {
  console.log('uploadAvatar called');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/${Date.now()}.${fileExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('profile_images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('profile_images').getPublicUrl(filePath);

    // プロフィール情報を更新
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    return { publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { publicUrl: null, error: 'Failed to upload image' };
  }
}

/**
 * ID指定でプロフィールを取得します。
 * 閲覧中のユーザーとのフレンド関係も併せて取得します。
 */
export async function getProfileById(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error) throw error;

    let isFriend = false;
    if (user && user.id !== targetId) {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('status')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`,
        )
        .eq('status', 'accepted')
        .maybeSingle();

      if (friendship) isFriend = true;
    }

    return {
      data: profile,
      isFriend,
      isMe: user?.id === targetId,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    return { data: null, error: 'User not found' };
  }
}
