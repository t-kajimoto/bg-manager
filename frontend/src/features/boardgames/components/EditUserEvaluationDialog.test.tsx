
import { render, screen, fireEvent } from '@testing-library/react';
import { EditUserEvaluationDialog } from './EditUserEvaluationDialog';
import { IBoardGame } from '@/features/boardgames/types';

// useAuthフックをモック化
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user123' },
  }),
}));

// モック
jest.mock('@/app/actions/boardgames', () => ({
  updateUserGameState: jest.fn(() => Promise.resolve({ error: null })),
}));

const mockUpdateUserGameState = require('@/app/actions/boardgames').updateUserGameState;

const mockGame: IBoardGame = {
  id: 'game1', name: 'カタン', min: 3, max: 4, time: 60,
  played: true, evaluation: 4, comment: '面白い'
};

describe('EditUserEvaluationDialog', () => {
  beforeEach(() => {
    mockUpdateUserGameState.mockClear();
  });

  it('フォームの初期値が正しく表示され、更新ボタンをクリックするとupdateUserEvaluationが呼ばれること', async () => {
    render(<EditUserEvaluationDialog open={true} onClose={() => {}} game={mockGame} />);

    // 初期値の確認
    expect(screen.getByLabelText('コメント')).toHaveValue('面白い');

    // fireEventを使ってRatingの値を変更（MUIのRatingは直接クリックできないため、input要素を探す）
    // Ratingコンポーネントは内部的にradio inputを使っている
    const ratingInput = screen.getByLabelText('5 Stars');
    fireEvent.click(ratingInput);

    // 更新ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '更新' }));

    // 非同期処理を待機
    await screen.findByRole('heading', { name: /カタン の評価/ }); // ダイアログが閉じないことを確認

    // updateUserGameStateが正しい引数で呼び出されたか検証
    expect(mockUpdateUserGameState).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserGameState).toHaveBeenCalledWith({
      boardGameId: 'game1',
      played: true,
      evaluation: 5,
      comment: '面白い'
    });
  });
});
