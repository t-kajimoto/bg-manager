import { render } from '@testing-library/react';
import { BoardGameSkeleton } from './BoardGameSkeleton';
import '@testing-library/jest-dom';

describe('BoardGameSkeleton', () => {
  it('should render skeleton items', () => {
    const { container } = render(<BoardGameSkeleton />);
    expect(container.firstChild).not.toBeNull();
    // We expect 6 cards
    const cards = container.querySelectorAll('.MuiCard-root');
    expect(cards.length).toBe(6);
  });
});
