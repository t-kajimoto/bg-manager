
import { render, screen, fireEvent } from '@testing-library/react';
import { AddBoardgameDialog } from './AddBoardgameDialog';

// useBoardgameManagerフックをモック化
jest.mock('@/hooks/useBoardgameManager', () => ({
  useBoardgameManager: () => ({
    addBoardgame: jest.fn(),
    loading: false,
    error: null,
  }),
}));

describe('AddBoardgameDialog', () => {
  it('ダイアログが開いている時に、フォーム要素が正しく表示されること', () => {
    render(<AddBoardgameDialog open={true} onClose={() => {}} />);

    // ダイアログのタイトルが表示されているか
    expect(screen.getByRole('heading', { name: /新しいボードゲームを追加/ })).toBeInTheDocument();

    // 各入力フィールドが表示されているか
    expect(screen.getByLabelText('ゲーム名')).toBeInTheDocument();
    expect(screen.getByLabelText('最小人数')).toBeInTheDocument();
    expect(screen.getByLabelText('最大人数')).toBeInTheDocument();
    expect(screen.getByLabelText('プレイ時間 (分)')).toBeInTheDocument();

    // ボタンが表示されているか
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
  });

  it('キャンセルボタンをクリックした時にonCloseが呼び出されること', () => {
    const handleClose = jest.fn();
    render(<AddBoardgameDialog open={true} onClose={handleClose} />);

    // キャンセルボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

    // onCloseコールバックが1回呼び出されたことを確認
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
