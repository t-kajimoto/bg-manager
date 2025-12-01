
import { render, screen } from '@testing-library/react';
import { EditBoardgameDialog } from './EditBoardgameDialog';
import { IBoardGame } from '@/features/boardgames/types';

jest.mock('@/features/boardgames/hooks/useBoardgameManager', () => ({
  useBoardgameManager: () => ({
    updateBoardgame: jest.fn(),
    loading: false,
    error: null,
  }),
}));

const mockGame: IBoardGame = {
  id: '1', name: 'カタン', min: 3, max: 4, time: 60, evaluation: 0, played: false
};

describe('EditBoardgameDialog', () => {
  it('渡されたゲームデータがフォームの初期値として表示されること', () => {
    render(<EditBoardgameDialog open={true} onClose={() => {}} game={mockGame} />);

    // 初期値がTextFieldにセットされているかを確認 (valueを持つinput要素を取得)
    expect(screen.getByLabelText('ゲーム名')).toHaveValue('カタン');
    expect(screen.getByLabelText('最小人数')).toHaveValue(3);
    expect(screen.getByLabelText('最大人数')).toHaveValue(4);
    expect(screen.getByLabelText('プレイ時間 (分)')).toHaveValue(60);
  });
});
