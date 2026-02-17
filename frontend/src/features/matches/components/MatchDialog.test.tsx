import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchDialog } from './MatchDialog';
import { addMatch, updateMatch } from '@/app/actions/matches';
import { BaseDialog } from '@/components/ui/BaseDialog';

// モック
jest.mock('@/app/actions/matches', () => ({
  addMatch: jest.fn(),
  updateMatch: jest.fn(),
}));

// BaseDialogはすでにテスト済みなので、ここでは単純なdivとしてモックしても良いが、
// 統合テスト的な意味合いで実物を使うか、Dialogの制御をテストしたい場合は実物が良い。
// ただしMUIのDialogはポータルを使うので、`baseElement`などを考慮する必要がある。
// ここでは、BaseDialogの実装が変わってもテストが壊れないように、BaseDialog自体はモックせず
// 内部のMUI Dialogをモックするか、あるいはそのまま使う。
// Jest + JSDOM環境ではMUI Dialogのポータルも動作するはず。

describe('MatchDialog Integration', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  
  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    users: [], // 必要に応じてダミーデータを入れる
    initialData: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly in add mode', () => {
    // MUI Dialogのポータルを考慮してrender
    const { baseElement } = render(<MatchDialog {...defaultProps} />);
    
    // ダイアログが開いていることを確認 (role="dialog")
    // MUI Dialog renders into a portal, usually document.body
    expect(baseElement.querySelector('[role="dialog"]')).toBeInTheDocument();
    expect(screen.getByText('戦績を記録')).toBeInTheDocument();
    
    // ボタンの確認
    const submitButton = screen.getByText('記録', { selector: 'button' });
    expect(submitButton).toBeInTheDocument();
  });

  // フォーム送信のテストは複雑（react-hook-form + 非同期アクション）なので、
  // エラーハンドリングなどの基本的な振る舞いをテストする
  
  // バリデーションエラーのテストなどを追加すると良い
});
