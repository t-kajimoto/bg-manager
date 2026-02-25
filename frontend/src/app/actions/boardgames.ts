'use server';

import { createClient } from '@/lib/supabase/server';
import { IBoardGame, IBoardGameEvaluation } from '@/features/boardgames/types';
import { IMatch } from '@/features/matches/types';
import { revalidatePath } from 'next/cache';

export async function getBoardGames(
  targetUserId?: string,
  ownedOnly: boolean = false,
): Promise<{
  data: IBoardGame[];
  error: string | null;
}> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let filterGameIds: string[] | null = null;
    const effectiveUserId = targetUserId || user?.id;

    // ownedOnlyフラグが有効かつ対象ユーザーがいる場合、所持ゲームのIDリストを取得してフィルタリング
    if (ownedOnly && effectiveUserId) {
      const { data: ownedData, error: ownedError } = await supabase
        .from('owned_games')
        .select('board_game_id')
        .eq('user_id', effectiveUserId);

      if (ownedError) throw ownedError;

      // 所持ゲームがない場合は即座に空配列を返す
      if (!ownedData || ownedData.length === 0) {
        return { data: [], error: null };
      }

      filterGameIds = ownedData.map((o) => o.board_game_id);
    }

    // 1. Fetch board games (filtered if needed)
    let gamesQuery = supabase
      .from('board_games')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterGameIds) {
      gamesQuery = gamesQuery.in('id', filterGameIds);
    }

    const { data: gamesData, error: gamesError } = await gamesQuery;

    if (gamesError) throw gamesError;
    if (!gamesData || gamesData.length === 0) return { data: [], error: null };

    // 2. Fetch user states (filtered by game IDs if possible to improve performance)
    let statesQuery = supabase.from('user_board_game_states').select('*');

    // 取得したゲームIDに関連するステータスのみ取得
    const fetchedGameIds = gamesData.map((g) => g.id);
    statesQuery = statesQuery.in('board_game_id', fetchedGameIds);

    const { data: userStatesData, error: userStatesError } = await statesQuery;

    if (userStatesError) throw userStatesError;

    // 3. Fetch owned status for effective user (if check needed for isOwned flag)
    // ownedOnly=trueの場合、取得したゲームはすべて所持しているはずだが、
    // ownedOnly=falseの場合や、念のため再確認のために取得。
    // すでにfilterGameIdsがある場合はそれを使えるが、
    // effectiveUserIdの所持リストは全件取得しないと、isOwnedフラグが正しくつかない（filterGameIdsはtargetUserIdのものかもしれない）
    // targetUserIdとcurrentUserが違う場合（他人のプロフィールを見ている時）、
    // 「その人が持っているゲーム」リストの中で「自分が持っているか」判定が必要。

    const { data: ownedData } = effectiveUserId
      ? await supabase
          .from('owned_games')
          .select('board_game_id')
          .eq('user_id', effectiveUserId) // ここはcurrentUser(user.id)であるべきでは？
      : // いや、effectiveUserIdは「表示対象のユーザー」か「ログインユーザー」
        // isOwnedフラグは「ログインユーザーが持っているか」を示すべき。
        { data: [] };

    // isOwnedフラグ判定用には、常に「ログインユーザー(user.id)」の所持リストが必要
    let currentUserOwnedGameIds = new Set<string>();
    if (user) {
      const { data: myOwned } = await supabase
        .from('owned_games')
        .select('board_game_id')
        .eq('user_id', user.id);
      currentUserOwnedGameIds = new Set(
        myOwned?.map((o) => o.board_game_id) || [],
      );
    }

    // 4. Combine data (Server-side Join)
    const combinedGames: IBoardGame[] = gamesData.map((game) => {
      const allUserDataForGame =
        userStatesData?.filter((ug) => ug.board_game_id === game.id) || [];

      const currentUserData = user
        ? allUserDataForGame.find((ug) => ug.user_id === user.id)
        : undefined;

      const evaluations = allUserDataForGame
        .map((ug) => ug.evaluation)
        .filter((e): e is number => e !== null && e > 0);

      const averageEvaluation =
        evaluations.length > 0
          ? evaluations.reduce((a, b) => a + b, 0) / evaluations.length
          : 0;

      const anyPlayed = allUserDataForGame.some((ug) => ug.played);

      return {
        id: game.id,
        name: game.name,
        min: game.min_players,
        max: game.max_players,
        time: game.play_time_minutes,
        tags: game.tags || [],
        ownerName: game.owner_name || '',
        played: currentUserData?.played ?? false,
        evaluation: currentUserData?.evaluation ?? 0,
        comment: currentUserData?.comment ?? '',
        averageEvaluation: Math.round(averageEvaluation * 10) / 10,
        anyPlayed: anyPlayed,
        bggId: game.bgg_id,
        imageUrl: game.image_url,
        thumbnailUrl: game.thumbnail_url,
        description: game.description,
        minPlayTime: game.min_playtime,
        maxPlayTime: game.max_playtime,
        yearPublished: game.year_published,
        designers: game.designers,
        artists: game.artists,
        publishers: game.publishers,
        mechanics: game.mechanics,
        categories: game.categories,
        averageRating: game.average_rating,
        complexity: game.complexity,
        isOwned: currentUserOwnedGameIds.has(game.id),
      };
    });

    return { data: combinedGames, error: null };
  } catch (error) {
    console.error('Error in getBoardGames:', error);
    return { data: [], error: 'Failed to fetch board games' };
  }
}

// -----------------------------------------------------
// GET ALL UNIQUE TAGS
// -----------------------------------------------------

/**
 * DB内の board_games テーブル全体から重複のないタグの一覧を取得します
 */
export async function getAllTags(): Promise<{
  data: string[];
  error: string | null;
}> {
  const supabase = await createClient();

  try {
    const { data: games, error } = await supabase
      .from('board_games')
      .select('tags')
      .not('tags', 'is', null);

    if (error) {
      throw error;
    }

    const allTags = new Set<string>();
    games.forEach((game) => {
      if (game.tags && Array.isArray(game.tags)) {
        game.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return { data: Array.from(allTags).sort(), error: null };
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return { data: [], error: error.message };
  }
}

export async function addBoardGame(game: {
  name: string;
  min: number;
  max: number;
  time: number;
  tags: string[];
  isOwned: boolean;
  bggId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  minPlayTime?: number;
  maxPlayTime?: number;
  yearPublished?: number;
  designers?: string[];
  artists?: string[];
  publishers?: string[];
  publishers?: string[];
  averageRating?: number;
  complexity?: number;
}) {
  console.log('ServerAction: addBoardGame called with:', game);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const { data: newGame, error } = await supabase
      .from('board_games')
      .insert({
        name: game.name,
        min_players: game.min,
        max_players: game.max,
        play_time_minutes: game.time,
        tags: game.tags,
        bgg_id: game.bggId,
        image_url: game.imageUrl,
        thumbnail_url: game.thumbnailUrl,
        description: game.description,
        min_playtime: game.minPlayTime,
        max_playtime: game.maxPlayTime,
        year_published: game.yearPublished,
        designers: game.designers,
        artists: game.artists,
        publishers: game.publishers,
        average_rating: game.averageRating,
        complexity: game.complexity,
      })
      .select()
      .single();

    if (error) throw error;
    if (!newGame) throw new Error('Failed to retrieve new game');

    // Add to owned_games if requested
    if (game.isOwned) {
      await supabase.from('owned_games').insert({
        user_id: user.id,
        board_game_id: newGame.id,
      });
    }

    revalidatePath('/');
    return { error: null };
  } catch (error) {
    console.error('Error adding board game:', error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).message)
      console.error('Error message:', (error as any).message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).details)
      console.error('Error details:', (error as any).details);

    return {
      error: `Failed to add board game: ${(error as any).message || String(error)}`,
    };
  }
}

export async function updateBoardGame(game: {
  id: string;
  name: string;
  min: number;
  max: number;
  time: number;
  tags: string[];
  isOwned: boolean;
  minPlayTime?: number;
  maxPlayTime?: number;
  yearPublished?: number;
  description?: string;
  designers?: string[];
  artists?: string[];
  publishers?: string[];
  publishers?: string[];
  averageRating?: number;
  complexity?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // strict admin check can be added here
    return { error: 'Not authenticated' };
  }

  try {
    const { error } = await supabase
      .from('board_games')
      .update({
        name: game.name,
        min_players: game.min,
        max_players: game.max,
        play_time_minutes: game.time,
        tags: game.tags,
        min_playtime: game.minPlayTime,
        max_playtime: game.maxPlayTime,
        year_published: game.yearPublished,
        description: game.description,
        designers: game.designers,
        artists: game.artists,
        publishers: game.publishers,
        mechanics: game.mechanics,
        categories: game.categories,
        average_rating: game.averageRating,
        complexity: game.complexity,
      })
      .eq('id', game.id);

    if (error) throw error;

    // Handle ownership
    if (game.isOwned) {
      await supabase.from('owned_games').upsert({
        user_id: user.id,
        board_game_id: game.id,
      });
    } else {
      await supabase
        .from('owned_games')
        .delete()
        .eq('user_id', user.id)
        .eq('board_game_id', game.id);
    }

    revalidatePath('/');
    return { error: null };
  } catch (error) {
    console.error('Error updating board game:', error);
    return { error: 'Failed to update board game' };
  }
}

export async function updateUserGameState(data: {
  boardGameId: string;
  played?: boolean;
  evaluation?: number;
  comment?: string;
  isOwned?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { data: existing } = await supabase
      .from('user_board_game_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('board_game_id', data.boardGameId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_board_game_states')
        .update({
          played: data.played ?? existing.played,
          evaluation: data.evaluation ?? existing.evaluation,
          comment: data.comment ?? existing.comment,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('board_game_id', data.boardGameId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('user_board_game_states').insert({
        user_id: user.id,
        board_game_id: data.boardGameId,
        played: data.played ?? false,
        evaluation: data.evaluation ?? 0,
        comment: data.comment ?? null,
      });
      if (error) throw error;
    }

    if (data.isOwned !== undefined) {
      if (data.isOwned) {
        await supabase.from('owned_games').upsert({
          user_id: user.id,
          board_game_id: data.boardGameId,
        });
      } else {
        await supabase
          .from('owned_games')
          .delete()
          .eq('user_id', user.id)
          .eq('board_game_id', data.boardGameId);
      }
    }

    revalidatePath('/');
    return { error: null };
  } catch (error) {
    console.error('Error updating user state:', error);
    return { error: 'Failed' };
  }
}

export async function deleteBoardGame(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase.from('board_games').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/');
    return { error: null };
  } catch (error) {
    return { error: 'Failed' };
  }
}

export async function addMatch(
  matchData: {
    boardGameId: string;
    date: Date;
    location?: string;
    note?: string;
    imageUrl?: string;
  },
  players: {
    userId?: string;
    playerName: string;
    score?: string;
    rank?: number;
    isWinner: boolean;
    role?: string;
  }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    // 1. Insert Match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        board_game_id: matchData.boardGameId,
        date: matchData.date.toISOString(),
        location: matchData.location,
        note: matchData.note,
        image_url: matchData.imageUrl,
        created_by: user.id,
      })
      .select()
      .single();

    if (matchError) throw matchError;
    if (!match) throw new Error('Failed to create match');

    // 2. Insert Players
    const playersToInsert = players.map((p) => ({
      match_id: match.id,
      user_id: p.userId || null,
      player_name: p.playerName,
      score: p.score,
      rank: p.rank,
      is_winner: p.isWinner,
      role: p.role,
    }));

    const { error: playersError } = await supabase
      .from('match_players')
      .insert(playersToInsert);

    if (playersError) throw playersError;

    return { error: null };
  } catch (error) {
    console.error('Error adding match:', error);
    return { error: 'Failed to add match' };
  }
}

export async function updateMatch(
  matchId: string,
  matchData: {
    boardGameId: string;
    date: Date;
    location: string;
    note: string;
    imageUrl?: string;
  },
  players: {
    userId?: string;
    playerName: string;
    score?: string;
    rank?: number;
    isWinner: boolean;
    role?: string;
  }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    // 1. Update Match
    const { error: matchError } = await supabase
      .from('matches')
      .update({
        board_game_id: matchData.boardGameId,
        date: matchData.date.toISOString(),
        location: matchData.location,
        note: matchData.note,
        image_url: matchData.imageUrl,
      })
      .eq('id', matchId)
      .eq('created_by', user.id);

    if (matchError) throw matchError;

    // 2. Delete Existing Players
    const { error: deleteError } = await supabase
      .from('match_players')
      .delete()
      .eq('match_id', matchId);

    if (deleteError) throw deleteError;

    // 3. Insert New Players
    const playersToInsert = players.map((p) => ({
      match_id: matchId,
      user_id: p.userId || null,
      player_name: p.playerName,
      score: p.score,
      rank: p.rank,
      is_winner: p.isWinner,
      role: p.role,
    }));

    const { error: playersError } = await supabase
      .from('match_players')
      .insert(playersToInsert);

    if (playersError) throw playersError;

    revalidatePath('/');
    return { error: null };
  } catch (error) {
    console.error('Error updating match:', error);
    return { error: 'Failed to update match' };
  }
}

export async function deleteMatch(matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId)
      .eq('created_by', user.id);

    if (error) throw error;

    revalidatePath('/');
    return { error: null };
  } catch (error) {
    console.error('Error deleting match:', error);
    return { error: 'Failed to delete match' };
  }
}

export async function getMatchesAction(boardGameId?: string, userId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    let query = supabase
      .from('matches')
      .select(
        `
        *,
        match_players!left (*, profiles:user_id(display_name, discriminator)),
        board_games (name)
      `,
      )
      .order('date', { ascending: false });

    if (boardGameId) {
      query = query.eq('board_game_id', boardGameId);
    }

    // 閲覧対象のユーザーID（指定がない場合は自分自身）
    const targetUserId = userId || user?.id; // userがnullの場合はundefinedになるが、その後のロジックで考慮が必要

    if (!targetUserId) return []; // ユーザーIDが特定できない場合は空配列を返す

    if (targetUserId) {
      // 1. まず、そのユーザーが参加者(player)として登録されているマッチのIDリストを取得
      const { data: participationData } = await supabase
        .from('match_players')
        .select('match_id')
        .eq('user_id', targetUserId);

      const participatedMatchIds =
        participationData?.map((p) => p.match_id) || [];

      // 2. 「作成者が自分」または「参加者に自分が含まれる」マッチを抽出
      if (participatedMatchIds.length > 0) {
        query = query.or(
          `created_by.eq.${targetUserId},id.in.(${participatedMatchIds.join(',')})`,
        );
      } else {
        query = query.eq('created_by', targetUserId);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error in getMatches:', error);
      throw error;
    }

    // console.log(`Fetched ${data?.length || 0} matches for targetUserId: ${targetUserId}`);

    if (!data) return { data: [], error: null };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedData: IMatch[] = (data as any[]).map((m) => ({
      id: m.id,
      boardGameId: m.board_game_id,
      date: new Date(m.date),
      location: m.location,
      note: m.note,
      imageUrl: m.image_url,
      createdBy: m.created_by,
      createdAt: new Date(m.created_at),
      boardGameName: m.board_games?.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      players: (m.match_players || []).map((p: any) => {
        const profile = p.profiles;
        const formattedName = profile
          ? `${profile.display_name}#${profile.discriminator}`
          : p.player_name;

        return {
          id: p.id,
          match_id: p.match_id,
          user_id: p.user_id,
          player_name: formattedName,
          score: p.score,
          rank: p.rank,
          is_winner: p.is_winner,
          role: p.role,
        };
      }),
    }));

    return { data: mappedData, error: null };
  } catch (error) {
    console.error('Error fetching matches:', error);
    return { data: [], error: 'Failed to fetch matches' };
  }
}

export async function uploadMatchImage(file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('match_images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('match_images').getPublicUrl(filePath);

    return { publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { error: 'Upload failed' };
  }
}

/**
 * 指定のボードゲームに対する全ユーザーの評価情報を取得する
 */
export async function getBoardGameEvaluations(
  boardGameId: string,
): Promise<{ data: IBoardGameEvaluation[]; error: string | null }> {
  const supabase = await createClient();
  try {
    const { data: states, error: statesError } = await supabase
      .from('user_board_game_states')
      .select(
        'user_id, evaluation, comment, played, updated_at, created_at, profiles(display_name, avatar_url, discriminator)',
      )
      .eq('board_game_id', boardGameId);

    if (statesError) throw statesError;

    const { data: owned, error: ownedError } = await supabase
      .from('owned_games')
      .select('user_id')
      .eq('board_game_id', boardGameId);

    if (ownedError) throw ownedError;

    const ownedUserIds = new Set(owned?.map((o) => o.user_id) || []);

    const evaluations: IBoardGameEvaluation[] = states.map((state: any) => {
      const profile = Array.isArray(state.profiles)
        ? state.profiles[0]
        : state.profiles;
      const formattedName = profile
        ? profile.discriminator
          ? `${profile.display_name}#${profile.discriminator}`
          : profile.display_name
        : '名称未設定ユーザー';

      return {
        userId: state.user_id,
        userName: formattedName,
        avatarUrl: profile?.avatar_url || null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        evaluation: state.evaluation || 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        comment: state.comment || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        played: state.played || false,
        isOwned: ownedUserIds.has(state.user_id),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        updatedAt: state.updated_at || state.created_at,
      };
    });

    // 評価が高い順、同点なら更新日が新しい順にソートする
    evaluations.sort((a, b) => {
      if (b.evaluation !== a.evaluation) return b.evaluation - a.evaluation;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return { data: evaluations, error: null };
  } catch (error) {
    console.error('Error in getBoardGameEvaluations:', error);
    return { data: [], error: 'Failed to fetch evaluations' };
  }
}
