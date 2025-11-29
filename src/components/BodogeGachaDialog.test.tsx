import { render, screen, fireEvent } from '@testing-library/react';
import { BodogeGachaDialog, GachaCondition } from './BodogeGachaDialog';
import '@testing-library/jest-dom';

describe('BodogeGachaDialog', () => {
  const mockOnClose = jest.fn();
  const allTags = ['Tag1', 'Tag2'];

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should render correctly', () => {
    render(<BodogeGachaDialog open={true} onClose={mockOnClose} allTags={allTags} />);
    expect(screen.getByText('ボドゲガチャ')).toBeInTheDocument();
    expect(screen.getByLabelText('プレイ人数')).toBeInTheDocument();
    expect(screen.getByLabelText('指定なし')).toBeChecked();
  });

  it('should call onClose with condition when executing gacha', () => {
    render(<BodogeGachaDialog open={true} onClose={mockOnClose} allTags={allTags} />);

    // Set players
    const playersInput = screen.getByLabelText('プレイ人数');
    fireEvent.change(playersInput, { target: { value: '4' } });

    // Set play status
    const unplayedRadio = screen.getByLabelText('未プレイ');
    fireEvent.click(unplayedRadio);

    // Click Execute
    const executeButton = screen.getByRole('button', { name: 'ガチャ実行' });
    fireEvent.click(executeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    const result: GachaCondition = mockOnClose.mock.calls[0][0];
    expect(result.players).toBe(4);
    expect(result.playStatus).toBe('unplayed');
    expect(result.timeRange).toEqual([0, 180]);
    expect(result.ratingRange).toEqual([0, 5]);
  });

  it('should call onClose without condition when cancelled', () => {
    render(<BodogeGachaDialog open={true} onClose={mockOnClose} allTags={allTags} />);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    // When cancelled, it calls onClose() which is onClose(undefined) in JS
    expect(mockOnClose).toHaveBeenCalledWith();
  });
});
