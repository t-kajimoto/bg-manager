import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders circular progress by default', () => {
    render(<LoadingSpinner />);
    // MUI CircularProgress role is 'progressbar'
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders message when provided', () => {
    render(<LoadingSpinner message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // fullScreenプロパティのテストはDOM構造に依存するため、
  // Backdropが表示されているかなどを確認する
  it('renders correctly with fullScreen prop', () => {
    render(<LoadingSpinner fullScreen />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // Backdropの存在確認等は必要に応じて追加
  });
});
