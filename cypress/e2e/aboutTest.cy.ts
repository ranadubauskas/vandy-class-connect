describe('About Page', () => {
    const baseUrl = Cypress.env('baseUrl');

    beforeEach(() => {
        // Navigate to the About page
        cy.visit(`${baseUrl}/about`);
    });

    it('should display the About page with correct heading and intro text', () => {
        // Verify heading
        cy.get('h1').should('contain.text', 'About');

        // Verify intro text
        cy.get('p')
            .contains(
                'VandyClassConnect is a platform to help Vanderbilt students navigate course registration.'
            )
            .should('be.visible');
    });

    it('should navigate back when clicking the Back button', () => {
        // Stub the router back functionality
        cy.window().then((win) => {
            cy.stub(win.history, 'back').as('goBack');
        });

        // Click the Back button
        cy.get('button').contains('← Back').click();

        // Verify that the router back method was called
        cy.get('@goBack').should('have.been.calledOnce');
    });

    it('should display all FAQ questions and allow toggling of answers', () => {
        const faqData = [
            {
                question: 'What is VandyClassConnect?',
                answer:
                    'VandyClassConnect is a platform designed for Vanderbilt students to review courses, find tutors, and upload/view syllabi.',
            },
            {
                question: 'How can I find a tutor?',
                answer: 'You can find tutors by searching for specific courses and checking tutor availability on the platform.',
            },
            {
                question: 'Can I leave course reviews?',
                answer: 'Yes, students can leave reviews for courses they have taken to help future students.',
            },
            {
                question: 'How do I upload a syllabus?',
                answer: 'Uploading a syllabus is easy. Just log in, navigate to the course, and add a review with the syllabus uploaded.',
            },
        ];

        // Verify that each FAQ question exists and behaves correctly
        faqData.forEach((faq, index) => {
            const faqSelector = `[data-testid="faq-item-${index}"]`;

            // Check that the FAQ question is rendered correctly
            cy.get(faqSelector)
                .find(`[data-testid="faq-question-${index}"]`)
                .should('contain.text', faq.question);

            // Expand the FAQ
            cy.get(faqSelector)
                .find(`[data-testid="faq-button-${index}"]`)
                .click();

            // Verify the FAQ answer is displayed
            cy.get(faqSelector)
                .find(`[data-testid="faq-answer-${index}"]`)
                .should('be.visible')
                .and('contain.text', faq.answer);

            // Collapse the FAQ
            cy.get(faqSelector)
                .find(`[data-testid="faq-button-${index}"]`)
                .click();
        });
    });

    it('should toggle the FAQ answer and Chevron icon for each item', () => {
        // Wait for the FAQ items to load
        cy.get('[data-testid^="faq-item"]').should('have.length.at.least', 1);

        // Loop through each FAQ item
        cy.get('[data-testid^="faq-item"]').each(($faqItem, index) => {
            // Verify the FAQ question is visible
            cy.wrap($faqItem)
                .find(`[data-testid="faq-question-${index}"]`)
                .should('be.visible');

            // Verify the ChevronDownIcon is visible initially
            cy.wrap($faqItem)
                .find(`[data-testid="chevron-down-${index}"]`)
                .should('be.visible');

            // Click to expand the FAQ
            cy.wrap($faqItem)
                .find(`[data-testid="faq-button-${index}"]`)
                .click();

            // Verify the FAQ answer is displayed
            cy.wrap($faqItem)
                .find(`[data-testid="faq-answer-${index}"]`, { timeout: 10000 })
                .should('be.visible');

            // Verify the ChevronUpIcon is visible
            cy.wrap($faqItem)
                .find(`[data-testid="chevron-up-${index}"]`)
                .should('be.visible');

            // Click to collapse the FAQ
            cy.wrap($faqItem)
                .find(`[data-testid="faq-button-${index}"]`)
                .click();
        });
    });
});