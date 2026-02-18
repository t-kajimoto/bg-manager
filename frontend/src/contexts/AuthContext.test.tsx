import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { ReactNode } from 'react';
// Mock firebase config (removing as unused)
// jest.mock('@/lib/firebase/config', ...); 

// Mock firebase/auth (removing code)
// Mock firebase/firestore (removing code)

describe('AuthContext', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should provide mock user when NEXT_PUBLIC_USE_MOCK is true', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = 'true';

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(expect.objectContaining({
      id: 'mock-user-id',
      email: 'mock@example.com',
    }));
    expect(result.current.customUser).toEqual(expect.objectContaining({
      nickname: 'MockNick',
      isAdmin: true,
    }));
  });

  test('should update nickname in mock mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = 'true';

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateNickname('NewNick');
    });

    expect(result.current.customUser?.nickname).toBe('NewNick');
  });

});
