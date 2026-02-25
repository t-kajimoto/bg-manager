'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Fab, Snackbar, IconButton, Grid,
  Skeleton, Alert, TextField, InputAdornment, Chip, Paper, Pagination
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAuth } from "@/contexts/AuthContext";
import { AddBoardgameDialog } from "@/features/boardgames/components/AddBoardgameDialog";
import { EditBoardgameDialog } from "@/features/boardgames/components/EditBoardgameDialog";
import { EditUserEvaluationDialog } from "@/features/boardgames/components/EditUserEvaluationDialog";
import { BoardGameCard } from "@/features/boardgames/components/BoardGameCard";
import { useBoardgames } from "@/features/boardgames/hooks/useBoardgames";
import { IBoardGame } from "@/features/boardgames/types";
import { BodogeGachaDialog, GachaCondition } from "@/features/gacha/components/BodogeGachaDialog";
import { GachaResultDialog } from "@/features/gacha/components/GachaResultDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GameDetailDialog } from "@/features/boardgames/components/GameDetailDialog";
import { deleteBoardGame } from '@/app/actions/boardgames';

// =============================================================================
// ボードゲーム一覧ページ（メインページ）
// M3準拠のレイアウト: 検索バー + Filter Chips + グリッドカード + FAB
// ナビゲーションはAppLayout側で提供されるため、ここでは一覧表示に集中
// =============================================================================

export default function Home() {
  const { boardGames, loading, error, refetch } = useBoardgames();
  const { customUser } = useAuth();

  // --- ダイアログの開閉状態 ---
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // --- 選択中のゲーム ---
  const [selectedGame, setSelectedGame] = useState<IBoardGame | null>(null);
  /** 詳細ダイアログ用の選択ゲーム（編集/削除と独立して管理） */
  const [detailGame, setDetailGame] = useState<IBoardGame | null>(null);

  // --- フィルター・検索・ソート状態 ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [onlyOwned, setOnlyOwned] = useState(false);

  // --- ページネーション状態 ---
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // --- Snackbar ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /** Snackbarを表示するヘルパー */
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  /** ゲーム削除処理 */
  const handleDelete = async () => {
    if (selectedGame) {
      await deleteBoardGame(selectedGame.id);
      setDeleteDialogOpen(false);
      setSelectedGame(null);
      showSnackbar('ボードゲームを削除しました');
      // 削除後にリストを即座に更新
      refetch();
    }
  };

  /** タグクリック: フィルタータグの追加/除去 */
  const handleTagClick = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };





  // --- 検索やフィルター条件変更時にページをリセット ---
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTags, onlyOwned, sortBy]);

  // --- ゲームのフィルタリングとソート ---
  const filteredAndSortedGames = boardGames
    // 検索クエリによるフィルタリング
    .filter((game) => game.name.toLowerCase().includes(searchQuery.toLowerCase()))
    // タグフィルタリング
    .filter((game) =>
      filterTags.length === 0 || filterTags.some((tag) => game.tags?.includes(tag))
    )
    // 所持フィルタ
    .filter((game) => !onlyOwned || game.isOwned)
    // ソート
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'time') return (a.time || 0) - (b.time || 0);
      if (sortBy === 'evaluation') return (b.evaluation || 0) - (a.evaluation || 0);
      return 0;
    });

  // --- ページネーション設定 ---
  const totalPages = Math.ceil(filteredAndSortedGames.length / ITEMS_PER_PAGE);
  const currentGames = filteredAndSortedGames.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // --- ソートオプション定義 ---
  const sortOptions = [
    { value: 'name', label: '名前順' },
    { value: 'time', label: '時間順' },
    { value: 'evaluation', label: '評価順' },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
      {/* --- ページヘッダー --- */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          ボードゲーム一覧
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {boardGames.length > 0
            ? `${boardGames.length}件のゲームが登録されています`
            : 'ゲームを追加して管理を始めましょう'}
        </Typography>
      </Box>

      {/* --- 検索・フィルターエリア --- */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        {/* 検索バー */}
        <TextField
          fullWidth
          placeholder="ゲームを検索..."
          label="検索"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />

        {/* ソート + フィルターチップ */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <SortIcon sx={{ fontSize: 18, color: 'var(--md-sys-color-on-surface-variant)' }} />
          {sortOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              size="small"
              variant={sortBy === option.value ? 'filled' : 'outlined'}
              color={sortBy === option.value ? 'primary' : 'default'}
              onClick={() => setSortBy(option.value)}
              sx={{
                fontWeight: sortBy === option.value ? 600 : 400,
                transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
              }}
            />
          ))}

          <Box sx={{ mx: 0.5, height: 20, borderLeft: '1px solid var(--md-sys-color-outline-variant)' }} />

          <Chip
            label="所持のみ"
            size="small"
            variant={onlyOwned ? 'filled' : 'outlined'}
            color={onlyOwned ? 'secondary' : 'default'}
            onClick={() => setOnlyOwned(!onlyOwned)}
            icon={<FilterListIcon />}
          />
        </Box>

        {/* 選択中のタグフィルター */}
        {filterTags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mr: 0.5 }}>
              タグ:
            </Typography>
            {filterTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={() => handleTagClick(tag)}
              />
            ))}
            <Chip
              label="クリア"
              size="small"
              variant="outlined"
              onClick={() => setFilterTags([])}
              sx={{ ml: 0.5, color: 'var(--md-sys-color-error)' }}
            />
          </Box>
        )}
      </Paper>

      {/* --- ゲーム一覧コンテンツ --- */}
      {loading ? (
        // ローディング: M3風スケルトンカード
        <Grid container spacing={2} data-testid="board-game-skeleton">
          {[...Array(6)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton
                variant="rounded"
                height={260}
                sx={{ borderRadius: 3, bgcolor: 'var(--md-sys-color-surface-container)' }}
              />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        // エラー表示
        <Alert
          severity="error"
          variant="outlined"
          sx={{ borderRadius: 3 }}
        >
          <Typography variant="subtitle2">データの読み込み中にエラーが発生しました</Typography>
          <Typography variant="body2">{error.message}</Typography>
        </Alert>
      ) : filteredAndSortedGames.length === 0 ? (
        // 空状態
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            borderRadius: 4,
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            border: '1px dashed var(--md-sys-color-outline-variant)',
          }}
        >
          <Typography variant="h1" sx={{ fontSize: '3rem', mb: 2 }}>
            🦔
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'var(--md-sys-color-on-surface)' }}>
            {searchQuery || filterTags.length > 0
              ? '検索結果が見つかりません'
              : '登録されているボードゲームはありません。'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {searchQuery || filterTags.length > 0
              ? '別のキーワードで検索してみてください'
              : '右下の「＋」ボタンからゲームを追加しましょう'}
          </Typography>
        </Box>
      ) : (
        // ゲームカードグリッド
        <Box>
          <Grid container spacing={2}>
            {currentGames.map((game, index) => (
              <Grid
              key={game.id}
              size={{ xs: 12, sm: 6, md: 4 }}
              sx={{
                // 各カードに遅延付きのフェードインアニメーション
                animation: 'm3-fade-in 300ms cubic-bezier(0.2, 0, 0, 1) both',
                animationDelay: `${index * 50}ms`,
              }}
            >
              <BoardGameCard
                game={game}
                onEdit={(g) => { setSelectedGame(g); setEditDialogOpen(true); }}
                onDelete={(g) => { setSelectedGame(g); setDeleteDialogOpen(true); }}
                onEvaluation={(g) => { setSelectedGame(g); setEvaluationDialogOpen(true); }}
                onTagClick={handleTagClick}
                onCardClick={(g) => { setDetailGame(g); setDetailDialogOpen(true); }}
              />
            </Grid>
          ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => {
                  setPage(value);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Box>
      )}

      {/* --- FAB: ゲーム追加ボタン（ログイン時のみ表示） --- */}
      {customUser && (
        <Fab
          color="primary"
          aria-label="ゲームを追加"
          onClick={() => setAddDialogOpen(true)}
          sx={{
            position: 'fixed',
            // z-indexをBottom Navigation(1100)より上に設定
            zIndex: 1150,
            // モバイルではBottom Nav(80px)の上に配置。セーフエリアも考慮
            bottom: { xs: 'max(112px, calc(96px + env(safe-area-inset-bottom)))', sm: 24 },
            right: 24,
            // M3 FABスタイル
            boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
            '&:hover': {
              transform: 'scale(1.05)',
            },
            transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* --- 各種ダイアログ --- */}
      <AddBoardgameDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => { setAddDialogOpen(false); showSnackbar('ボードゲームを追加しました'); }}
      />

      {selectedGame && (
        <>
          <EditBoardgameDialog
            open={editDialogOpen}
            onClose={() => { setEditDialogOpen(false); setSelectedGame(null); }}
            game={selectedGame}
            onSuccess={() => { setEditDialogOpen(false); setSelectedGame(null); showSnackbar('ボードゲームを更新しました'); }}
          />
          <EditUserEvaluationDialog
            open={evaluationDialogOpen}
            onClose={() => { setEvaluationDialogOpen(false); setSelectedGame(null); }}
            game={selectedGame}
            onSuccess={() => {
              setEvaluationDialogOpen(false);
              setSelectedGame(null);
              showSnackbar('評価を更新しました');
              // 評価保存後にボードゲームデータを再取得してカード上の星を即座に反映
              refetch();
            }}
          />
        </>
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="ボードゲームの削除"
        message={`「${selectedGame?.name}」を削除してもよろしいですか？`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialogOpen(false); setSelectedGame(null); }}
        isDangerous
      />

      {/* ゲーム詳細ダイアログ */}
      <GameDetailDialog
        open={detailDialogOpen}
        onClose={() => { setDetailDialogOpen(false); setDetailGame(null); }}
        game={detailGame}
      />

      {/* 通知Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnackbarOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}
