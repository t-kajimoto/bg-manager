import { render, screen, fireEvent } from '@testing-library/react';
import { EditNicknameDialog } from './EditNicknameDialog';
import '@testing-library/jest-dom';

describe('EditNicknameDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should render correctly with current nickname', () => {
    render(<EditNicknameDialog open={true} onClose={mockOnClose} currentNickname="OldNick" />);
    expect(screen.getByText('ニックネームを編集')).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'ニックネーム' }) as HTMLInputElement;
    expect(input.value).toBe('OldNick');
  });

  it('should disable save button if nickname is empty', () => {
    render(<EditNicknameDialog open={true} onClose={mockOnClose} currentNickname="" />);
    const saveButton = screen.getByRole('button', { name: '保存' });
    expect(saveButton).toBeDisabled();

    // Type something
    const input = screen.getByRole('textbox', { name: 'ニックネーム' });
    fireEvent.change(input, { target: { value: 'NewNick' } });
    expect(saveButton).toBeEnabled();

    // Clear it
    fireEvent.change(input, { target: { value: '   ' } });
    expect(saveButton).toBeDisabled();
  });

  it('should call onClose with new nickname when saved', () => {
    render(<EditNicknameDialog open={true} onClose={mockOnClose} currentNickname="OldNick" />);

    const input = screen.getByRole('textbox', { name: 'ニックネーム' });
    fireEvent.change(input, { target: { value: 'NewNick' } });

    const saveButton = screen.getByRole('button', { name: '保存' });
    fireEvent.click(saveButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledWith('NewNick');
  });

  it('should call onClose without value when cancelled', () => {
    render(<EditNicknameDialog open={true} onClose={mockOnClose} currentNickname="OldNick" />);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledWith();
  });
});
