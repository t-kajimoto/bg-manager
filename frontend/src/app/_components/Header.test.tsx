import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';
import { AuthContext } from '@/contexts/AuthContext';
import { User } from 'firebase/auth';

const mockUser: User = {
  uid: '12345',
  displayName: 'Test User',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test Full Name',
  },
} as unknown as User;



describe('Header Component', () => {

  it('should display a spinner while loading', () => {
    render(
      <AuthContext.Provider value={{ user: null, customUser: null, loading: true } as any}>
        <Header />
      </AuthContext.Provider>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display the login button when the user is not logged in', () => {
    render(
      <AuthContext.Provider value={{ user: null, customUser: null, loading: false } as any}>
        <Header />
      </AuthContext.Provider>
    );
    expect(screen.getByRole('button', { name: /Googleでログイン/i })).toBeInTheDocument();
  });

  it('should display nickname and menu options when the user is logged in', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser, customUser: { displayName: 'TestDisplayName', isAdmin: false } as any, loading: false } as any}>
        <Header />
      </AuthContext.Provider>
    );

    // Check for user button
    const userButton = screen.getByRole('button', { name: /TestDisplayName/i });
    expect(userButton).toBeInTheDocument();

    // Open menu
    fireEvent.click(userButton);

    // Check for menu items
    expect(screen.getByText(/マイページ/i)).toBeInTheDocument();
    expect(screen.getByText(/ログアウト/i)).toBeInTheDocument();
  });

  it('should display DisplayName when nickname is not available', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser, customUser: null, loading: false } as any}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('button', { name: /Test Full Name/i })).toBeInTheDocument();
  });
});
