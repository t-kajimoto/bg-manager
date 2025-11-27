// 'use client' ディレクティブは、このコンポーネントがクライアントサイドで実行されるべき
// 「クライアントコンポーネント」であることをNext.jsに伝えます。
// useStateやuseEffectといったReactのフックはクライアントコンポーネントでのみ使用可能です。
'use client';

import { Box, Container, Typography, CircularProgress, Card, CardActions, CardContent, Chip, Rating, Alert, Button } from "@mui/material";
import Header from "./_components/Header";
import { useBoardgames } from "@/hooks/useBoardgames";
import { useAuth } from "@/contexts/AuthContext";
import { IBoardGame } from "@/types/boardgame";
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import { AddBoardgameDialog } from "@/components/AddBoardgameDialog";
import { EditBoardgameDialog } from "@/components/EditBoardgameDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { EditUserEvaluationDialog } from "@/components/EditUserEvaluationDialog";
import { useBoardgameManager } from '@/hooks/useBoardgameManager';

/**
 * @page Home
 * @description アプリケーションのメインページ。ボードゲームの一覧を表示します。
 * useBoardgamesフックから取得したデータに基づき、ローディング状態、エラー状態、
 * そしてボードゲームのリストを適切にレンダリングします。
 */
import { useState } from "react";

export default function Home() {
  // useBoardgamesカスタムフックを呼び出して、ボードゲームのデータ、
  // ローディング状態、エラー情報を取得します。
  const { boardGames, loading, error } = useBoardgames();
  // useAuthフックから認証情報を取得
  const { customUser } = useAuth();
  // ダイアログの開閉状態を管理するstate
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openEvaluationDialog, setOpenEvaluationDialog] = useState(false);
  // 編集・削除対象のボードゲームデータを保持するstate
  const [selectedGame, setSelectedGame] = useState<IBoardGame | null>(null);
  // ボードゲーム管理フック
  const { deleteBoardgame, loading: isDeleting } = useBoardgameManager();

  // 編集ボタンクリック時のハンドラ
  const handleEditClick = (game: IBoardGame) => {
    setSelectedGame(game);
    setOpenEditDialog(true);
  };

  // 削除ボタンクリック時のハンドラ
  const handleDeleteClick = (game: IBoardGame) => {
    setSelectedGame(game);
    setOpenDeleteConfirm(true);
  };

  // 削除確認ダイアログで「削除」を押した時の処理
  const handleDeleteConfirm = async () => {
    if (selectedGame) {
      await deleteBoardgame(selectedGame.id);
      setOpenDeleteConfirm(false);
      setSelectedGame(null); // 選択をクリア
    }
  };

  // 評価編集エリアクリック時のハンドラ
  const handleEvaluationClick = (game: IBoardGame) => {
    setSelectedGame(game);
    setOpenEvaluationDialog(true);
  };

  /**
   * @function renderContent
   * @description 現在の 상태(loading, error, データ)に基づいてメインコンテンツを描画するヘルパー関数。
   * @returns {JSX.Element} 描画するReact要素。
   */
  const renderContent = () => {
    // ローディング中の場合、画面中央に進捗を示すスピナーを表示します。
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    // データ取得でエラーが発生した場合、エラーメッセージを表示します。
    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          データの読み込み中にエラーが発生しました: {error.message}
        </Alert>
      );
    }

    // ボードゲームのデータが空の場合、その旨を伝えるメッセージを表示します。
    if (boardGames.length === 0) {
      return (
        <Typography sx={{ mt: 4, textAlign: 'center' }}>
          登録されているボードゲームはありません。
        </Typography>
      );
    }

    // データが正常に取得できた場合、ボードゲームのリストをレスポンシブなグリッドレイアウトで表示します。
    // MUIのGridコンポーネントの代わりに、BoxとCSS Gridを使用して実装しています。
    // これにより、Gridコンポーネントのバージョン間の互換性の問題を回避できます。
    return (
      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gap: 3,
          // 画面サイズに応じてカラム数を変更するレスポンシブ設定
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)', // 画面幅がxs以上の場合、1カラム
            sm: 'repeat(2, 1fr)', // 画面幅がsm以上の場合、2カラム
            md: 'repeat(3, 1fr)', // 画面幅がmd以上の場合、3カラム
          },
        }}
      >
        {/* boardGames配列をループ処理し、各ゲームの情報をCardコンポーネントで表示 */}
        {boardGames.map((game) => (
          <Box key={game.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                {/* ゲーム名 */}
                <Typography variant="h6" component="h2" gutterBottom>
                  {game.name}
                </Typography>

                {/* プレイ人数と時間 */}
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">{game.min}～{game.max}人</Typography>
                  <AccessTimeIcon sx={{ mx: 1 }} />
                  <Typography variant="body2">{game.time}分</Typography>
                </Box>

                {/* あなたの評価 */}
                <Box
                  sx={{ mt: 1, cursor: customUser ? 'pointer' : 'default' }}
                  onClick={() => customUser && handleEvaluationClick(game)}
                >
                  <Typography component="legend" variant="caption">あなたの評価</Typography>
                  <Rating value={game.evaluation} readOnly />
                </Box>

                {/* 平均評価 */}
                <Box sx={{ mt: 1 }}>
                  <Typography component="legend" variant="caption">平均評価</Typography>
                  <Rating value={game.averageEvaluation} precision={0.1} readOnly />
                </Box>

                {/* タグ */}
                <Box sx={{ mt: 2 }}>
                  {game.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Box>
              </CardContent>
              {/* 管理者には編集・削除ボタンを表示 */}
              {customUser?.isAdmin && (
                <CardActions>
                  <Button size="small" onClick={() => handleEditClick(game)}>編集</Button>
                  <Button size="small" color="error" onClick={() => handleDeleteClick(game)}>削除</Button>
                </CardActions>
              )}
            </Card>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      {/* 全ページ共通のヘッダーコンポーネント */}
      <Header />
      {/* メインコンテンツ用のコンテナ */}
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            ボードゲーム一覧
          </Typography>
          {/* 管理者ユーザーの場合のみ、追加ボタンを表示 */}
          {customUser?.isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              追加
            </Button>
          )}
        </Box>
        {/* 状態に応じたコンテンツを描画 */}
        {renderContent()}
      </Container>
      {/* ボードゲーム追加ダイアログ */}
      <AddBoardgameDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
      />
      {/* ボードゲーム編集ダイアログ */}
      <EditBoardgameDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        game={selectedGame}
      />
      {/* 削除確認ダイアログ */}
      <ConfirmationDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="ボードゲームの削除"
        message={`本当に「${selectedGame?.name}」を削除しますか？この操作は元に戻せません。`}
        confirmText="削除"
        loading={isDeleting}
      />
      {/* ユーザー評価編集ダイアログ */}
      <EditUserEvaluationDialog
        open={openEvaluationDialog}
        onClose={() => setOpenEvaluationDialog(false)}
        game={selectedGame}
      />
    </Box>
  );
}
