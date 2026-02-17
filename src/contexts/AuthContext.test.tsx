import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, setDoc, doc } from 'firebase/firestore';

// Mock firebase config
jest.mock('@/lib/firebase/config', () => ({
  auth: { currentUser: null },
  db: {},
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()),
  getAuth: jest.fn(),
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  getFirestore: jest.fn(),
}));

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
      uid: 'mock-user-id',
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

  test('should create new user with profile fields in Firestore when document does not exist (Firebase mode)', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = 'false';
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
    };

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    (doc as jest.Mock).mockReturnValue('mock-doc-ref');

    // getDoc returns { exists: () => false } to simulate new user
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);

    // Verify setDoc was called with correct data including new fields
    expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', {
      nickname: 'Test User',
      isAdmin: false,
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
    });

    expect(result.current.customUser).toEqual({
      nickname: 'Test User',
      isAdmin: false,
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
    });
  });
});
