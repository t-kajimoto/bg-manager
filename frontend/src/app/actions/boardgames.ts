'use server';

import { createClient } from '@/lib/supabase/server';
import { IBoardGame } from '@/features/boardgames/types';
import { IMatch } from '@/features/matches/types';
import { revalidatePath } from 'next/cache';

export async function getBoardGames(targetUserId?: string): Promise<{
  data: IBoardGame[];
  error: string | null;
}> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch all board games
    const { data: gamesData, error: gamesError } = await supabase
      .from('board_games')
      .select('*')
      .order('created_at', { ascending: false });

    if (gamesError) throw gamesError;
    if (!gamesData) return { data: [], error: null };

    // 2. Fetch all user states (for calculating averages and checking if played)
    const { data: userStatesData, error: userStatesError } = await supabase
      .from('user_board_game_states')
      .select('*');

    if (userStatesError) throw userStatesError;

    // 3. Fetch owned status for effective user
    const effectiveUserId = targetUserId || user?.id;
    const { data: ownedData } = effectiveUserId
      ? await supabase
          .from('owned_games')
          .select('board_game_id')
          .eq('user_id', effectiveUserId)
      : { data: [] };
    const ownedGameIds = new Set(ownedData?.map((o) => o.board_game_id) || []);

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
        isOwned: ownedGameIds.has(game.id),
      };
    });

    return { data: combinedGames, error: null };
  } catch (error) {
    console.error('Error in getBoardGames:', error);
    return { data: [], error: 'Failed to fetch board games' };
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
  mechanics?: string[];
  categories?: string[];
  averageRating?: number;
  complexity?: number;
}) {
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
        mechanics: game.mechanics,
        categories: game.categories,
        average_rating: game.averageRating,
        complexity: game.complexity,
        created_by: user.id,
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
    return { error: 'Failed to add board game' };
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
  mechanics?: string[];
  categories?: string[];
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
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    // Upsert logic
    // First, we need to handle "partial" updates effectively.
    // Supabase `upsert` replaces the row if PK matches.
    // If we want to update only specific fields without overwriting others with null,
    // we might need to fetch first or use dynamic query building?
    // Actually, for this specific table (user_id, board_game_id),
    // we typically send the FULL state from the client or we just update what changed.
    // However, `upsert` expects a complete row or defaults.
    // Let's use `select` to check existence then `update` or `insert`?
    // OR, just use upsert with all fields if the client sends them.
    // For simpler "toggle played", we assume client sends only changed field.
    // If so, `update` is better, but what if new?
    // Let's safe-guard by checking first.

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

export async function getMatches(boardGameId?: string, userId?: string) {
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
    const targetUserId = userId || user.id;

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
