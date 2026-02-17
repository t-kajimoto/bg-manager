import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const defaultProps = {
    open: true,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    title: 'Confirm Title',
    message: 'Are you sure?',
  };

  it('renders title and message', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Title')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Yes" />);
    fireEvent.click(screen.getByText('Yes'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('renders dangerous style when isDangerous is true', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Delete" isDangerous={true} />);
    const confirmButton = screen.getByText('Delete').closest('button');
    // MUI color="error" class checking usually involves CSS classes like MuiButton-colorError
    // Or we can check if it has the class.
    expect(confirmButton?.className).toContain('MuiButton-colorError');
  });
});
