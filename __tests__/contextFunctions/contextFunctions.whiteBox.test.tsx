import { cookies } from 'next/headers';
import { getUserCookies, logout } from '../../src/app/lib/functions';

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
    it('should return null if a non-Error object is thrown', async () => {
        mockCookieStore.getAll.mockImplementation(() => {
            throw 'An unexpected error'; // Non-error object
        });

        const result = await getUserCookies();
        expect(result).toBeNull();
    });
});