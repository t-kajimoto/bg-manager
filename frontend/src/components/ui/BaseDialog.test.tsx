import { render, screen, fireEvent } from '@testing-library/react';
import { BaseDialog } from './BaseDialog';
import { Button } from '@mui/material';

// Dialogのモック (MUIのDialogはポータルを使うためテストが難しい場合があるが、まずはそのまま試す)
// 必要であれば jest.mock で MUI コンポーネントをモックする

describe('BaseDialog', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    title: 'Test Dialog',
  };

  it('renders title and children when open', () => {
    render(
      <BaseDialog {...defaultProps}>
        <div>Test Content</div>
      </BaseDialog>
    );

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    const actions = <Button>Test Action</Button>;
    render(
      <BaseDialog {...defaultProps} actions={actions}>
        <div>Content</div>
      </BaseDialog>
    );

    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  // MUI DialogのonClose発火条件は複雑（Backdropクリックなど）なので、
  // ここではコンポーネントがMUI Dialogにpropsを渡していることの確認に留めるか、
  // ユーザー操作をシミュレートする。
  // 今回は統合的な動作確認を優先。
});
