import { render, screen, fireEvent } from '@testing-library/react';
import { AddBoardgameDialog } from './AddBoardgameDialog';

// モック
jest.mock('@/app/actions/boardgames', () => ({
  addBoardGame: jest.fn(),
}));

jest.mock('@/app/actions/bgg', () => ({
  searchBoardGame: jest.fn(),
  getBoardGameDetails: jest.fn(),
}));

const mockAddBoardGame = require('@/app/actions/boardgames').addBoardGame;

describe('AddBoardgameDialog', () => {
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    mockOnClose = jest.fn();
    // モック関数のリセット
    mockAddBoardGame.mockClear();
    // @ts-ignore
    mockAddBoardGame.mockResolvedValue({ error: null });
  });

  it('should render dialog when open is true', () => {
    render(<AddBoardgameDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByText('新しいボードゲームを追加')).toBeInTheDocument();
  });

  // 注: 自動入力ロジックのテストは複雑なため、統合テストまたはE2Eテストでカバーすることを推奨
  // ここでは基本的な描画と閉じる動作のみ確認
  it('ダイアログが開いている時に、フォーム要素が正しく表示されること', () => {
    render(<AddBoardgameDialog open={true} onClose={() => {}} />);

    // ダイアログのタイトルが表示されているか
    expect(screen.getByRole('heading', { name: /新しいボードゲームを追加/ })).toBeInTheDocument();

    // 各入力フィールドが表示されているか
    expect(screen.getByLabelText('ゲーム名 (BGG検索)')).toBeInTheDocument();
    expect(screen.getByLabelText('最小人数')).toBeInTheDocument();
    expect(screen.getByLabelText('最大人数')).toBeInTheDocument();
    expect(screen.getByLabelText('平均プレイ時間 (分)')).toBeInTheDocument();

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
