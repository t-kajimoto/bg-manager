'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface IFriendship {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  friend_profile: {
    id: string;
    display_name: string;
    discriminator: string;
    avatar_url: string | null;
  };
}

/**
 * フレンド申請を送信します。
 * @param targetUsernameWithCode 受信者の「名前#1234」
 */
export async function sendFriendRequest(targetUsernameWithCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const [name, discriminator] = targetUsernameWithCode.split('#');
  if (!name || !discriminator) return { error: 'Invalid username format' };

  try {
    // 相手のプロファイルを特定
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('display_name', name)
      .eq('discriminator', discriminator)
      .single();

    if (profileError || !targetProfile) return { error: 'User not found' };
    if (targetProfile.id === user.id) return { error: 'Cannot add yourself' };

    // 既存の申請をチェック
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${targetProfile.id}),and(sender_id.eq.${targetProfile.id},receiver_id.eq.${user.id})`,
      )
      .maybeSingle();

    if (existing) return { error: 'Request already exists or already friends' };

    const { error: insertError } = await supabase.from('friendships').insert({
      sender_id: user.id,
      receiver_id: targetProfile.id,
      status: 'pending',
    });

    if (insertError) throw insertError;

    revalidatePath('/mypage');
    return { error: null };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { error: 'Failed to send friend request' };
  }
}

/**
 * フレンド一覧および申請一覧を取得します。
 */
export async function getFriendships() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Not authenticated' };

  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(
        `
        *,
        sender:profiles!friendships_sender_id_fkey(id, display_name, discriminator, avatar_url),
        receiver:profiles!friendships_receiver_id_fkey(id, display_name, discriminator, avatar_url)
      `,
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) throw error;

    const friendships = (data as any[]).map((f) => {
      const isSender = f.sender_id === user.id;
      return {
        ...f,
        friend_profile: isSender ? f.receiver : f.sender,
      };
    });

    return { data: friendships as IFriendship[], error: null };
  } catch (error) {
    console.error('Error fetching friendships:', error);
    return { data: [], error: 'Failed' };
  }
}

/**
 * フレンド申請に応答します。
 */
export async function respondToFriendRequest(
  requestId: string,
  status: 'accepted' | 'rejected',
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('id', requestId)
      .eq('receiver_id', user.id);

    if (error) throw error;

    revalidatePath('/mypage');
    return { error: null };
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return { error: 'Failed' };
  }
}

/**
 * 指定されたユーザーのフレンド一覧を取得します（公開プロフィール用）。
 */
export async function getFriendshipsByUserId(targetUserId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(
        `
        *,
        sender:profiles!friendships_sender_id_fkey(id, display_name, discriminator, avatar_url),
        receiver:profiles!friendships_receiver_id_fkey(id, display_name, discriminator, avatar_url)
      `,
      )
      .or(`sender_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
      .eq('status', 'accepted');

    if (error) throw error;

    const friendships = (data as any[]).map((f) => {
      const isTargetSender = f.sender_id === targetUserId;
      return {
        ...f,
        friend_profile: isTargetSender ? f.receiver : f.sender,
      };
    });

    return { data: friendships as IFriendship[], error: null };
  } catch (error) {
    console.error('Error fetching target friendships:', error);
    return { data: [], error: 'Failed' };
  }
}
