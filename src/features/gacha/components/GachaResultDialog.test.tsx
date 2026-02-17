import { render, screen, fireEvent } from '@testing-library/react';
import { GachaResultDialog } from './GachaResultDialog';
import { IBoardGame } from '@/features/boardgames/types';
import '@testing-library/jest-dom';

describe('GachaResultDialog', () => {
  const mockOnClose = jest.fn();
  const mockGame: IBoardGame = {
    id: '1',
    name: 'Test Game',
    min: 2,
    max: 4,
    time: 60,
    tags: ['Strategy', 'Card'],
    played: true,
    evaluation: 4,
    averageEvaluation: 4.5,
    anyPlayed: true,
    userId: 'user1',
    boardGameId: '1'
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should render nothing when game is null', () => {
    const { container } = render(<GachaResultDialog open={true} onClose={mockOnClose} game={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render game details correctly', () => {
    render(<GachaResultDialog open={true} onClose={mockOnClose} game={mockGame} />);

    expect(screen.getByText('これに決まり！')).toBeInTheDocument();
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('2～4人')).toBeInTheDocument();
    expect(screen.getByText('60分')).toBeInTheDocument();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('should call onClose when OK button is clicked', () => {
    render(<GachaResultDialog open={true} onClose={mockOnClose} game={mockGame} />);

    const okButton = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(okButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
