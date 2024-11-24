import '@testing-library/jest-dom/extend-expect';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/router';
import React from 'react';
import Admin from '../../src/app/admin/page';
import { getUserCookies } from '../../src/app/lib/functions';
import pb from '../../src/app/lib/pocketbaseClient';
const { describe, test, expect } = require('@jest/globals');

// Mocking next/router
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

// Mocking pocketbaseClient
jest.mock('../../src/app/lib/pocketbaseClient', () => ({
    __esModule: true,
    default: {
        collection: jest.fn(),
    },
}));

// Mocking getUserCookies
jest.mock('../../src/app/lib/functions', () => ({
    getUserCookies: jest.fn(),
}));

// Mocking next/link
jest.mock('next/link', () => {
    return ({ children }: { children: React.ReactNode }) => {
        return children;
    };
});

// Mocking Material-UI's useMediaQuery and Tooltip
jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: jest.fn(),
    Tooltip: ({ title, children }: { title: string; children: React.ReactElement }) => {
        return React.cloneElement(children, { title });
    },
}));

describe('Admin Component', () => {
    const mockUseRouter = useRouter as jest.Mock;
    const mockCollection = pb.collection as jest.Mock;
    const mockGetUserCookies = getUserCookies as jest.Mock;
    const mockUseMediaQuery = require('@mui/material').useMediaQuery as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRouter.mockReturnValue({
            push: jest.fn(),
        });
    });

    // Ensure unique dates in mockReports to avoid getByText conflicts
    const mockReports = [
        {
            id: 'report1',
            created: new Date('2024-11-21T17:27:30').toISOString(),
            expand: {
                review: {
                    id: 'review1',
                    comment: 'Great course!',
                    rating: 5,
                },
                reviewCreator: {
                    id: 'user1',
                    firstName: 'John',
                    lastName: 'Doe',
                },
                reporter: [
                    {
                        id: 'reporter1',
                        firstName: 'Alice',
                        lastName: 'Smith',
                    },
                    {
                        id: 'reporter2',
                        firstName: 'Bob',
                        lastName: 'Johnson',
                    },
                ],
            },
        },
        {
            id: 'report2',
            created: new Date('2024-11-22T10:15:45').toISOString(), // Unique date
            expand: {
                review: {
                    id: 'review2',
                    comment: 'Needs improvement.',
                    rating: 2,
                },
                reviewCreator: null, // Anonymous
                reporter: [],
            },
        },
    ];

    it('renders correctly on small screens with card layout', async () => {
        // Mock useMediaQuery to return true (small screen)
        mockUseMediaQuery.mockReturnValue(true);

        // Mock getUserCookies
        mockGetUserCookies.mockResolvedValue({
            id: 'user1',
            username: 'admin',
        });

        // Mock pocketbaseClient collection for 'reviewReports'
        mockCollection.mockImplementation((collectionName: string) => {
            if (collectionName === 'reviewReports') {
                return {
                    getList: jest.fn().mockResolvedValue({
                        items: mockReports,
                    }),
                    delete: jest.fn().mockResolvedValue({}),
                };
            }
            return {};
        });

        render(<Admin />);

        // Wait for reports to be fetched and rendered
        await waitFor(() => {
            expect(screen.getByText('Admin Page - Reported Reviews')).toBeInTheDocument();
        });

        // Check if both reports are rendered as cards
        mockReports.forEach((report) => {
            // Find the report card
            const reportCard = screen.getByText(`Report ID: ${report.id}`).closest('div');

            // Ensure reportCard is not null
            expect(reportCard).not.toBeNull();

            const withinReportCard = within(reportCard!);

            // Check for the presence of the buttons within the specific report card
            expect(withinReportCard.getByLabelText('Approve Review')).toBeInTheDocument();
            expect(withinReportCard.getByLabelText('Delete Review')).toBeInTheDocument();
        });

        
        // Check specific content
        expect(screen.getByText('Great course!')).toBeInTheDocument();
        expect(screen.getByText('Needs improvement.')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
        expect(screen.getAllByText('Report Count:').length).toBe(2);
    });

    it('renders correctly on large screens with table layout', async () => {
        // Mock useMediaQuery to return false (large screen)
        mockUseMediaQuery.mockReturnValue(false);

        // Mock getUserCookies
        mockGetUserCookies.mockResolvedValue({
            id: 'user1',
            username: 'admin',
        });

        // Mock pocketbaseClient collection for 'reviewReports'
        mockCollection.mockImplementation((collectionName: string) => {
            if (collectionName === 'reviewReports') {
                return {
                    getList: jest.fn().mockResolvedValue({
                        items: mockReports,
                    }),
                    delete: jest.fn(),
                };
            }
            return {};
        });

        render(<Admin />);

        // Wait for reports to be fetched and rendered
        await waitFor(() => {
            expect(screen.getByText('Admin Page - Reported Reviews')).toBeInTheDocument();
        });

        // Check if both reports are rendered as table rows
        mockReports.forEach((report) => {
            // Find the report row
            const reportRow = screen.getByText(report.id).closest('tr');

            // Ensure reportRow is not null
            expect(reportRow).not.toBeNull();

            const withinReportRow = within(reportRow!);

            expect(withinReportRow.getByText(report.id)).toBeInTheDocument();
            expect(withinReportRow.getByText(new Date(report.created).toLocaleString())).toBeInTheDocument();
            expect(withinReportRow.getByText(report.expand.review.comment)).toBeInTheDocument();
            expect(withinReportRow.getByText(report.expand.review.rating.toString())).toBeInTheDocument();
        });

        // Check specific content
        expect(screen.getByText('Great course!')).toBeInTheDocument();
        expect(screen.getByText('Needs improvement.')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
        expect(screen.getByText('Report Count')).toBeInTheDocument();
    });

    it('handles approveReview action correctly', async () => {
        // Mock useMediaQuery to return true (small screen)
        mockUseMediaQuery.mockReturnValue(true);

        // Mock getUserCookies
        mockGetUserCookies.mockResolvedValue({
            id: 'user1',
            username: 'admin',
        });

        // Mock pocketbaseClient collection for 'reviewReports' and 'reviews'
        const mockDeleteReviewReports = jest.fn().mockResolvedValue({});
        const mockDeleteReviews = jest.fn().mockResolvedValue({});

        mockCollection.mockImplementation((collectionName: string) => {
            if (collectionName === 'reviewReports') {
                return {
                    getList: jest.fn().mockResolvedValue({
                        items: mockReports,
                    }),
                    delete: mockDeleteReviewReports,
                };
            }
            if (collectionName === 'reviews') {
                return {
                    delete: mockDeleteReviews,
                };
            }
            return {};
        });

        render(<Admin />);

        // Wait for reports to be fetched and rendered
        await waitFor(() => {
            expect(screen.getByText('Report ID: report1')).toBeInTheDocument();
        });

        // Find the approve button for report1 using aria-label
        const approveButtons = screen.getAllByLabelText('Approve Review');
        expect(approveButtons.length).toBe(2);

        // Click the approve button for the first report
        fireEvent.click(approveButtons[0]);

        await waitFor(() => {
            expect(mockDeleteReviewReports).toHaveBeenCalledWith('report1');
            expect(screen.queryByText('Report ID: report1')).not.toBeInTheDocument();
        });
    });

    it('handles deleteReview action correctly', async () => {
        // Mock useMediaQuery to return true (small screen)
        mockUseMediaQuery.mockReturnValue(true);

        // Mock getUserCookies
        mockGetUserCookies.mockResolvedValue({
            id: 'user1',
            username: 'admin',
        });

        // Mock pocketbaseClient collection for 'reviewReports' and 'reviews'
        const mockDeleteReviewReports = jest.fn().mockResolvedValue({});
        const mockDeleteReviews = jest.fn().mockResolvedValue({});

        mockCollection.mockImplementation((collectionName: string) => {
            if (collectionName === 'reviewReports') {
                return {
                    getList: jest.fn().mockResolvedValue({
                        items: mockReports,
                    }),
                    delete: mockDeleteReviewReports,
                };
            }
            if (collectionName === 'reviews') {
                return {
                    delete: mockDeleteReviews,
                };
            }
            return {};
        });

        render(<Admin />);

        // Wait for reports to be fetched and rendered
        await waitFor(() => {
            expect(screen.getByText('Report ID: report1')).toBeInTheDocument();
        });

        // Find the delete button for report1 using aria-label
        const deleteButtons = screen.getAllByLabelText('Delete Review');
        expect(deleteButtons.length).toBe(2);

        // Click the delete button for the first report's review
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockDeleteReviews).toHaveBeenCalledWith('review1');
            expect(screen.queryByText('Report ID: report1')).not.toBeInTheDocument();
        });
    });

    it('handles fetchReports failure gracefully', async () => {
        // Mock useMediaQuery to return true (small screen)
        mockUseMediaQuery.mockReturnValue(true);

        // Mock getUserCookies
        mockGetUserCookies.mockResolvedValue({
            id: 'user1',
            username: 'admin',
        });

        // Mock pocketbaseClient collection for 'reviewReports' to throw an error
        mockCollection.mockImplementation((collectionName: string) => {
            if (collectionName === 'reviewReports') {
                return {
                    getList: jest.fn().mockRejectedValue(new Error('Failed to fetch')),
                    delete: jest.fn(),
                };
            }
            return {};
        });

        // Mock console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<Admin />);

        // Wait for fetchReports to be called
        await waitFor(() => {
            expect(mockCollection).toHaveBeenCalledWith('reviewReports');
        });

        // Ensure no reports are rendered
        expect(screen.queryByText('Report ID: report1')).not.toBeInTheDocument();
        expect(screen.queryByText('Report ID: report2')).not.toBeInTheDocument();

        // Ensure error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch review reports:', expect.any(Error));

        consoleErrorSpy.mockRestore();
    });

    it('calls getUserCookies on mount', async () => {
        // Mock useMediaQuery to return true (small screen)
        mockUseMediaQuery.mockReturnValue(true);

        // Mock getUserCookies
        mockGetUserCookies.mockResolvedValue({
            id: 'user1',
            username: 'admin',
        });

        // Mock pocketbaseClient collection for 'reviewReports'
        mockCollection.mockImplementation((collectionName: string) => {
            if (collectionName === 'reviewReports') {
                return {
                    getList: jest.fn().mockResolvedValue({
                        items: mockReports,
                    }),
                    delete: jest.fn(),
                };
            }
            return {};
        });

        render(<Admin />);

        await waitFor(() => {
            expect(mockGetUserCookies).toHaveBeenCalled();
            expect(screen.getByText('Admin Page - Reported Reviews')).toBeInTheDocument();
        });
    });

    it('renders "No user cookies found" if getUserCookies returns null', async () => {
        // Mock useMediaQuery to return true (small screen)
        mockUseMediaQuery.mockReturnValue(true);

        // Mock getUserCookies to return null
        mockGetUserCookies.mockResolvedValue(null);

        // Mock pocketbaseClient collection for 'reviewReports'
        mockCollection.mockImplementation((collectionName: string) => {
            if (collectionName === 'reviewReports') {
                return {
                    getList: jest.fn().mockResolvedValue({
                        items: mockReports,
                    }),
                    delete: jest.fn(),
                };
            }
            return {};
        });

        // Mock console.log
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        render(<Admin />);

        await waitFor(() => {
            expect(mockGetUserCookies).toHaveBeenCalled();
            expect(screen.getByText('Admin Page - Reported Reviews')).toBeInTheDocument();
        });

        // Check that "No user cookies found" was logged
        expect(consoleLogSpy).toHaveBeenCalledWith('No user cookies found');

        consoleLogSpy.mockRestore();
    });
});
