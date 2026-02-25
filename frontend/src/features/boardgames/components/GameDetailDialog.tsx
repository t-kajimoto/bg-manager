'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
  CardMedia, Chip, Stack, Divider, Tabs, Tab, Rating, CircularProgress,
  useTheme, useMediaQuery, Alert, Button, TextField, FormControlLabel, Switch, Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import { IBoardGame, IBoardGameEvaluation } from '../types';
import { IMatch } from '@/features/matches/types';
import { getMatchesAction, getBoardGameEvaluations, updateUserGameState } from '@/app/actions/boardgames';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendships } from '@/app/actions/friends';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

// =============================================================================
// ゲーム詳細ダイアログ
// 基本情報、評価・レビュー、戦績タブを統合したダイアログ
// =============================================================================

interface GameDetailDialogProps {
  open: boolean;
  onClose: () => void;
  game: IBoardGame | null;
  onEvaluationUpdated?: () => void;
}

type MainTab = 'info' | 'evaluations' | 'matches';
type MatchFilter = 'all' | 'mine' | 'friends';
type EvalFilter = 'all' | 'friends';

type MyEvalFormInput = {
  isOwned: boolean;
  played: boolean;
  evaluation: number;
  comment: string;
};

export const GameDetailDialog = ({ open, onClose, game, onEvaluationUpdated }: GameDetailDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [mainTab, setMainTab] = useState<MainTab>('info');

  const [matches, setMatches] = useState<IMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchTab, setMatchTab] = useState<MatchFilter>('all');

  const [evaluations, setEvaluations] = useState<IBoardGameEvaluation[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalFilter, setEvalFilter] = useState<EvalFilter>('all');

  const [friendIds, setFriendIds] = useState<string[]>([]);

  // 自分の評価編集用
  const [isEditingMyEval, setIsEditingMyEval] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<MyEvalFormInput>();

  useEffect(() => {
    if (!open || !game) {
      setMatches([]);
      setEvaluations([]);
      setMainTab('info');
      setIsEditingMyEval(false);
      return;
    }

    const fetchData = async () => {
      setMatchLoading(true);
      setEvalLoading(true);
      setMatchError(null);
      setEvalError(null);

      try {
        const [matchesRes, evalsRes, friendsRes] = await Promise.all([
          getMatchesAction(game.id),
          getBoardGameEvaluations(game.id),
          getFriendships()
        ]);

        if (matchesRes && 'data' in matchesRes) setMatches(matchesRes.data || []);
        if (evalsRes && !evalsRes.error) setEvaluations(evalsRes.data || []);

        if (friendsRes && friendsRes.data) {
          const ids = friendsRes.data
            .filter(f => f.status === 'accepted')
            .map(f => f.friend_profile.id);
          setFriendIds(ids);
        }
      } catch (e) {
        setMatchError('戦績の取得に失敗しました');
        setEvalError('評価の取得に失敗しました');
      } finally {
        setMatchLoading(false);
        setEvalLoading(false);
      }
    };

    fetchData();

    if (user) {
      reset({
        isOwned: game.isOwned || false,
        played: game.played || false,
        evaluation: game.evaluation || 0,
        comment: game.comment || '',
      });
    }
  }, [open, game, user, reset]);

  const handleMyEvalSubmit: SubmitHandler<MyEvalFormInput> = async (data) => {
    if (!game || !user) return;
    setUpdateLoading(true);
    setUpdateError(null);

    // 星評価が0より大きい場合は強制的にプレイ済みにする
    const played = data.evaluation > 0 ? true : data.played;

    const result = await updateUserGameState({
      boardGameId: game.id,
      isOwned: data.isOwned,
      played: played,
      evaluation: data.evaluation,
      comment: data.comment,
    });

    setUpdateLoading(false);

    if (result.error) {
      setUpdateError('更新に失敗しました: ' + result.error);
    } else {
      setIsEditingMyEval(false);
      if (onEvaluationUpdated) onEvaluationUpdated();
      // 最新の評価一覧を再取得
      const evalsRes = await getBoardGameEvaluations(game.id);
      if (evalsRes.data) setEvaluations(evalsRes.data);
    }
  };

  const filteredMatches = useMemo(() => {
    if (matchTab === 'all') return matches;
    if (matchTab === 'mine' && user) {
      return matches.filter(m =>
        m.createdBy === user.id ||
        m.players.some(p => p.user_id === user.id)
      );
    }
    if (matchTab === 'friends') {
      return matches.filter(m =>
        m.players.some(p => p.user_id && friendIds.includes(p.user_id))
      );
    }
    return matches;
  }, [matches, matchTab, user, friendIds]);

  const filteredEvals = useMemo(() => {
    // 自分の評価は「あなたの評価」エリアに分離して出すため、一覧からは省くのもアリだが、全ユーザーとして出すか？
    // 一般的には出す。
    // しかし評価値または長めのコメントがあるものだけ出す。
    const validEvals = evaluations.filter(e => e.evaluation > 0 || e.comment || e.isOwned || e.played);

    if (evalFilter === 'all') return validEvals;
    if (evalFilter === 'friends') {
      return validEvals.filter(e => friendIds.includes(e.userId));
    }
    return validEvals;
  }, [evaluations, evalFilter, friendIds]);

  if (!game) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          {game.name}
        </Typography>
        <IconButton onClick={onClose} aria-label="閉じる" sx={{ mb: 1 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} variant="fullWidth">
          <Tab label="基本情報" value="info" />
          <Tab label="評価・レビュー" value="evaluations" />
          <Tab label="戦績" value="matches" />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ pt: 3 }}>
        {/* ========================================================================= */}
        {/* 基本情報タブ */}
        {/* ========================================================================= */}
        {mainTab === 'info' && (
          <Box>
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
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {game.min} 〜 {game.max} 人
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {game.minPlayTime && game.maxPlayTime
                      ? `${game.minPlayTime} 〜 ${game.maxPlayTime} 分`
                      : `約 ${game.time} 分`}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <StarIcon fontSize="small" color="action" />
                  <Rating value={game.averageEvaluation || 0} precision={0.1} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({game.averageEvaluation?.toFixed(1) || '0.0'})
                  </Typography>
                </Stack>

                {game.yearPublished && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    出版年: {game.yearPublished}
                  </Typography>
                )}
                {game.averageRating && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    BGG評価: {game.averageRating.toFixed(1)}
                  </Typography>
                )}
                {game.complexity && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    複雑さ: {game.complexity.toFixed(1)} / 5
                  </Typography>
                )}
                
                {game.isOwned && (
                  <Chip label="所有しています" size="small" color="primary" variant="outlined" sx={{ mt: 1 }} />
                )}
              </Box>
            </Box>

            {game.description && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>説明</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {game.description}
                </Typography>
              </Box>
            )}

            {game.tags && game.tags.length > 0 && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2, gap: 0.5 }}>
                {game.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>
            )}

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
          </Box>
        )}

        {/* ========================================================================= */}
        {/* 評価・レビュータブ */}
        {/* ========================================================================= */}
        {mainTab === 'evaluations' && (
          <Box>
            {user && (
              <Box sx={{ p: 2, mb: 4, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 2, border: '1px solid var(--md-sys-color-outline-variant)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: isEditingMyEval ? 2 : 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">あなたの状態・評価</Typography>
                  {!isEditingMyEval && (
                    <Button size="small" startIcon={<EditIcon />} onClick={() => setIsEditingMyEval(true)} sx={{ mt: -1, mr: -1 }}>
                      編集する
                    </Button>
                  )}
                </Box>

                {isEditingMyEval ? (
                  <form onSubmit={handleSubmit(handleMyEvalSubmit)}>
                    {updateError && <Alert severity="error" sx={{ mb: 2 }}>{updateError}</Alert>}
                    
                    <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                      <Controller
                        name="isOwned"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch checked={field.value} onChange={field.onChange} />}
                            label={<Typography variant="body2">このゲームを所有している</Typography>}
                          />
                        )}
                      />
                      
                      <Controller
                        name="played"
                        control={control}
                        render={({ field }) => (
                           <FormControlLabel
                            control={<Switch checked={field.value} onChange={field.onChange} />}
                            label={<Typography variant="body2">遊んだことがある</Typography>}
                          />
                        )}
                      />
                    </Stack>

                    <Box sx={{ mb: 2 }}>
                       <Typography component="legend" variant="caption" color="text.secondary">評価 (星)</Typography>
                       <Controller
                         name="evaluation"
                         control={control}
                         render={({ field }) => (
                           <Rating {...field} onChange={(e, v) => field.onChange(v || 0)} size="large" />
                         )}
                       />
                    </Box>

                    <Controller
                      name="comment"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="コメント・感想" fullWidth multiline rows={2} sx={{ mb: 2 }} />
                      )}
                    />

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                       <Button onClick={() => { setIsEditingMyEval(false); reset(); }} disabled={updateLoading}>キャンセル</Button>
                       <Button type="submit" variant="contained" disabled={updateLoading}>
                         {updateLoading ? <CircularProgress size={24} color="inherit" /> : '保存'}
                       </Button>
                    </Stack>
                  </form>
                ) : (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: game.comment ? 1.5 : 0 }}>
                      {game.isOwned && <Chip label="所有" size="small" color="primary" variant="outlined" />}
                      {game.played && <Chip label="プレイ済" size="small" color="success" variant="outlined" />}
                      {game.evaluation > 0 && <Rating value={game.evaluation} readOnly size="small" />}
                      {!game.isOwned && !game.played && game.evaluation === 0 && (
                        <Typography variant="body2" color="text.secondary">記録がありません</Typography>
                      )}
                    </Stack>
                    {game.comment && (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', bgcolor: 'var(--md-sys-color-surface)', p: 1.5, borderRadius: 1 }}>{game.comment}</Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
             みんなの評価
            </Typography>

            <Tabs
              value={evalFilter}
              onChange={(_, v) => setEvalFilter(v)}
              sx={{ mb: 2, minHeight: 36 }}
              TabIndicatorProps={{ sx: { height: 2 } }}
            >
              <Tab label="全ユーザー" value="all" sx={{ minHeight: 36, fontSize: '0.875rem' }} />
              <Tab label="フレンド" value="friends" sx={{ minHeight: 36, fontSize: '0.875rem' }} />
            </Tabs>

            {evalLoading ? (
               <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                 <CircularProgress size={32} />
               </Box>
            ) : evalError ? (
               <Alert severity="error">{evalError}</Alert>
            ) : filteredEvals.length === 0 ? (
               <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                 {evalFilter === 'all' ? 'まだ評価がありません' : 'フレンドの評価はまだありません'}
               </Typography>
            ) : (
               <Stack spacing={2}>
                 {filteredEvals.map(ev => (
                   <Box key={ev.userId} sx={{ pb: 2, borderBottom: '1px solid var(--md-sys-color-outline-variant)', '&:last-child': { borderBottom: 'none' } }}>
                     <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                       <Avatar src={ev.avatarUrl || undefined} sx={{ width: 32, height: 32 }} />
                       <Box sx={{ flex: 1 }}>
                         <Typography variant="body2" fontWeight="medium">{ev.userName}</Typography>
                         <Typography variant="caption" color="text.secondary">
                           {new Date(ev.updatedAt).toLocaleDateString()}
                         </Typography>
                       </Box>
                       <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5} alignItems="flex-end">
                         {ev.isOwned && <Chip label="所有" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                         {ev.played && <Chip label="プレイ済" size="small" variant="outlined" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />}
                       </Stack>
                     </Stack>
                     
                     {ev.evaluation > 0 && (
                       <Box sx={{ mb: 1 }}>
                         <Rating value={ev.evaluation} readOnly size="small" />
                       </Box>
                     )}
                     
                     {ev.comment && (
                       <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{ev.comment}</Typography>
                     )}
                   </Box>
                 ))}
               </Stack>
            )}
          </Box>
        )}

        {/* ========================================================================= */}
        {/* 戦績タブ */}
        {/* ========================================================================= */}
        {mainTab === 'matches' && (
          <Box>
            <Tabs
              value={matchTab}
              onChange={(_, v) => setMatchTab(v)}
              sx={{ mb: 2, minHeight: 36 }}
              TabIndicatorProps={{ sx: { height: 2 } }}
            >
              <Tab label="全ユーザー" value="all" sx={{ minHeight: 36, fontSize: '0.875rem' }} />
              <Tab label="自分" value="mine" sx={{ minHeight: 36, fontSize: '0.875rem' }} />
              <Tab label="フレンド" value="friends" sx={{ minHeight: 36, fontSize: '0.875rem' }} />
            </Tabs>

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

                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                      {match.players.map(player => (
                        <Chip
                          key={player.id}
                          label={`${player.player_name}${player.is_winner ? ' 🏆' : ''}${player.score !== null && player.score !== undefined ? ` (${player.score})` : ''}`}
                          size="small"
                          color={player.is_winner ? 'primary' : 'default'}
                          variant={player.is_winner ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Stack>

                    {match.note && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {match.note}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
