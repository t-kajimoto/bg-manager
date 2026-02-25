'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
  CardMedia, Chip, Stack, Divider, Tabs, Tab, Rating, CircularProgress,
  useTheme, useMediaQuery, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { IBoardGame } from '../types';
import { IMatch } from '@/features/matches/types';
import { getMatchesAction } from '@/app/actions/boardgames';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendships } from '@/app/actions/friends';

// =============================================================================
// ゲーム詳細ダイアログ
// ゲームの基本情報と、そのゲームに関連する戦績を表示するモーダル
// =============================================================================

interface GameDetailDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 表示するゲーム（nullの場合は何も表示しない） */
  game: IBoardGame | null;
}

/** 戦績のフィルタータブ */
type MatchFilter = 'all' | 'mine' | 'friends';

export const GameDetailDialog = ({ open, onClose, game }: GameDetailDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // --- 戦績データの状態 ---
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchTab, setMatchTab] = useState<MatchFilter>('all');

  // --- フレンドのユーザーIDリスト（フレンドタブ用） ---
  const [friendIds, setFriendIds] = useState<string[]>([]);

  // ダイアログが開いたらそのゲームの戦績を取得
  useEffect(() => {
    if (!open || !game) {
      setMatches([]);
      setMatchError(null);
      return;
    }

    const fetchMatches = async () => {
      setMatchLoading(true);
      setMatchError(null);
      try {
        // boardGameIdを指定して全ユーザーの戦績を取得
        const result = await getMatchesAction(game.id);
        if (result && 'data' in result) {
          setMatches(result.data || []);
        }
      } catch {
        setMatchError('戦績の取得に失敗しました');
      } finally {
        setMatchLoading(false);
      }
    };

    const fetchFriends = async () => {
      try {
        const result = await getFriendships();
        if (result.data) {
          // acceptedなフレンドのみ抽出
          const ids = result.data
            .filter(f => f.status === 'accepted')
            .map(f => f.friend_profile.id);
          setFriendIds(ids);
        }
      } catch {
        // フレンド取得失敗は無視（フレンドタブが空になるだけ）
      }
    };

    fetchMatches();
    fetchFriends();
  }, [open, game]);

  // フィルタリングされた戦績
  const filteredMatches = useMemo(() => {
    if (matchTab === 'all') return matches;
    if (matchTab === 'mine' && user) {
      // 自分が参加したマッチのみ
      return matches.filter(m =>
        m.createdBy === user.id ||
        m.players.some(p => p.user_id === user.id)
      );
    }
    if (matchTab === 'friends') {
      // フレンドが参加したマッチのみ
      return matches.filter(m =>
        m.players.some(p => p.user_id && friendIds.includes(p.user_id))
      );
    }
    return matches;
  }, [matches, matchTab, user, friendIds]);

  if (!game) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
    >
      {/* ヘッダー: ゲーム名 + 閉じるボタン */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          {game.name}
        </Typography>
        <IconButton onClick={onClose} aria-label="閉じる">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* ----- ゲーム基本情報セクション ----- */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
          {/* サムネイル */}
          <CardMedia
            component="img"
            image={game.thumbnailUrl || game.imageUrl || '/no_image.svg'}
            alt={game.name}
            sx={{
              width: { xs: '100%', sm: 200 },
              height: { xs: 200, sm: 'auto' },
              objectFit: 'contain',
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
              flexShrink: 0,
            }}
          />

          {/* 基本スペック */}
          <Box sx={{ flex: 1 }}>
            {/* プレイ人数 */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <PeopleIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {game.min} 〜 {game.max} 人
              </Typography>
            </Stack>

            {/* プレイ時間 */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {game.minPlayTime && game.maxPlayTime
                  ? `${game.minPlayTime} 〜 ${game.maxPlayTime} 分`
                  : `約 ${game.time} 分`}
              </Typography>
            </Stack>

            {/* 平均評価 */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <StarIcon fontSize="small" color="action" />
              <Rating value={game.averageEvaluation || 0} precision={0.1} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                ({game.averageEvaluation?.toFixed(1) || '0.0'})
              </Typography>
            </Stack>

            {/* 自分の評価 */}
            {game.evaluation > 0 && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">あなたの評価:</Typography>
                <Rating value={game.evaluation} precision={0.5} readOnly size="small" />
              </Stack>
            )}

            {/* 出版年 */}
            {game.yearPublished && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                出版年: {game.yearPublished}
              </Typography>
            )}

            {/* BGG評価 */}
            {game.averageRating && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                BGG評価: {game.averageRating.toFixed(1)}
              </Typography>
            )}

            {/* 複雑さ */}
            {game.complexity && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                複雑さ: {game.complexity.toFixed(1)} / 5
              </Typography>
            )}
          </Box>
        </Box>

        {/* 説明 */}
        {game.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>説明</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {game.description}
            </Typography>
          </Box>
        )}

        {/* タグ */}
        {game.tags && game.tags.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2, gap: 0.5 }}>
            {game.tags.map(tag => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        {/* デザイナー・メカニクス等 */}
        {game.designers && game.designers.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>デザイナー:</strong> {game.designers.join(', ')}
          </Typography>
        )}
        {game.mechanics && game.mechanics.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>メカニクス:</strong> {game.mechanics.join(', ')}
          </Typography>
        )}
        {game.categories && game.categories.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>カテゴリ:</strong> {game.categories.join(', ')}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ----- 戦績セクション ----- */}
        <Typography variant="h6" sx={{ mb: 1 }}>
          <EmojiEventsIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          戦績
        </Typography>

        {/* フィルタータブ */}
        <Tabs
          value={matchTab}
          onChange={(_, v) => setMatchTab(v)}
          sx={{ mb: 2, minHeight: 36 }}
          TabIndicatorProps={{ sx: { height: 3 } }}
        >
          <Tab label="全ユーザー" value="all" sx={{ minHeight: 36 }} />
          <Tab label="自分" value="mine" sx={{ minHeight: 36 }} />
          <Tab label="フレンド" value="friends" sx={{ minHeight: 36 }} />
        </Tabs>

        {/* 戦績コンテンツ */}
        {matchLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : matchError ? (
          <Alert severity="error">{matchError}</Alert>
        ) : filteredMatches.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {matchTab === 'all' ? 'まだ戦績がありません' :
             matchTab === 'mine' ? 'あなたの戦績はまだありません' :
             'フレンドの戦績はまだありません'}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {filteredMatches.map(match => (
              <Box
                key={match.id}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                {/* 日付・場所 */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {match.date instanceof Date
                      ? match.date.toLocaleDateString('ja-JP')
                      : new Date(match.date).toLocaleDateString('ja-JP')}
                  </Typography>
                  {match.location && (
                    <Typography variant="body2" color="text.secondary">
                      @ {match.location}
                    </Typography>
                  )}
                </Stack>

                {/* プレイヤー一覧 */}
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                  {match.players.map(player => (
                    <Chip
                      key={player.id}
                      label={`${player.player_name}${player.is_winner ? ' 🏆' : ''}${player.score ? ` (${player.score})` : ''}`}
                      size="small"
                      color={player.is_winner ? 'primary' : 'default'}
                      variant={player.is_winner ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>

                {/* メモ */}
                {match.note && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {match.note}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};
