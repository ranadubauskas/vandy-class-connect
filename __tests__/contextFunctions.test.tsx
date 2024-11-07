import { getUserCookies, logout } from '../src/app/lib/functions';
import { cookies } from 'next/headers';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('getUserCookies', () => {
  let mockCookieStore: { getAll: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    mockCookieStore = {
      getAll: jest.fn(),
      delete: jest.fn(),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);
  });

  it('should return user object if required cookies are present', async () => {
    const mockCookies = [
      { name: 'id', value: '1' },
      { name: 'firstName', value: 'John' },
      { name: 'lastName', value: 'Doe' },
      { name: 'email', value: 'john.doe@example.com' },
      { name: 'savedCourses', value: JSON.stringify(['course1', 'course2']) },
    ];
    mockCookieStore.getAll.mockReturnValue(mockCookies);

    const user = await getUserCookies();
    expect(user).toEqual({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      savedCourses: ['course1', 'course2'],
    });
  });

  it('should return null if required cookies are missing', async () => {
    mockCookieStore.getAll.mockReturnValue([{ name: 'otherCookie', value: 'value' }]);

    const user = await getUserCookies();
    expect(user).toBeNull();
  });

  it('should handle JSON parsing error for savedCourses and return empty array', async () => {
    const mockCookies = [
      { name: 'id', value: '1' },
      { name: 'firstName', value: 'John' },
      { name: 'lastName', value: 'Doe' },
      { name: 'email', value: 'john.doe@example.com' },
      { name: 'savedCourses', value: 'invalidJSON' }, // Invalid JSON
    ];
    mockCookieStore.getAll.mockReturnValue(mockCookies);

    const user = await getUserCookies();
    expect(user).toEqual({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      savedCourses: [], // Defaults to empty array
    });
  });

  it('should return error message if there is an error fetching cookies', async () => {
    const errorMessage = 'Cookie fetch error';
    mockCookieStore.getAll.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const result = await getUserCookies();
    expect(result).toBe(errorMessage);
  });
});

describe('logout', () => {
  let mockCookieStore: { delete: jest.Mock };

  beforeEach(() => {
    mockCookieStore = {
      delete: jest.fn(),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);
  });

  it('should delete all specified cookies', async () => {
    await logout();

    const cookiesToDelete = [
      'id',
      'username',
      'firstName',
      'lastName',
      'email',
      'graduationYear',
      'profilePic',
      'reviews',
      'savedCourses',
    ];

    cookiesToDelete.forEach((cookie) => {
      expect(mockCookieStore.delete).toHaveBeenCalledWith(cookie);
    });
  });
});