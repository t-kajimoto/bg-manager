
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  it('渡されたタイトルとメッセージが正しく表示されること', () => {
    render(
      <ConfirmationDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="テストタイトル"
        message="テストメッセージ"
      />
    );

    expect(screen.getByRole('heading', { name: 'テストタイトル' })).toBeInTheDocument();
    expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
  });

  it('確認ボタンをクリックした時にonConfirmが呼び出されること', () => {
    const handleConfirm = jest.fn();
    render(
      <ConfirmationDialog
        open={true}
        onClose={() => {}}
        onConfirm={handleConfirm}
        title="テスト"
        message="テスト"
        confirmText="実行"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '実行' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
