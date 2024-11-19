describe('Course Detail Page', () => {
    const baseUrl = Cypress.env('baseUrl');
    const loginUrl = `${baseUrl}/login`;
    const courseDetailUrl = (courseId) => `${baseUrl}/course?id=${courseId}`;

    const validUser = {
        email: Cypress.env('email'),
        password: Cypress.env('password'),
    };

    const validCourseId = '0ohc8yi22aqot0h';

    beforeEach(() => {
        // Log in before each test
        cy.visit(loginUrl);
        cy.get('input[placeholder="Vanderbilt Email"]').type(validUser.email);
        cy.get('input[placeholder="Password"]').type(validUser.password);
        cy.get('button[type="submit"]').click();

        // Verify login was successful
        cy.url().should('include', '/home');
    });

    it('should display course details correctly', () => {
        cy.visit(courseDetailUrl(validCourseId));

        // Wait for the course details to load
        cy.get('.course-details', { timeout: 10000 }).should('exist');

        // Verify course code and name are displayed
        cy.get('.course-details h1').should('contain.text', 'CS 2212: Discrete Structures');
    });

    it('should navigate to Add Review page when clicking Add a Review', () => {
        cy.visit(courseDetailUrl(validCourseId));

        cy.get('button').contains('Add a Review').click();

        // Verify navigation to the add review page
        cy.url().should('include', `/addReview?id=${validCourseId}`);
    });

    it('should display tutors when clicking Find a Tutor', () => {
        cy.visit(courseDetailUrl(validCourseId));

        cy.get('button').contains('Find a Tutor').click();

        // Verify the tutors modal is displayed
        cy.get('.fixed').contains('Tutors').should('exist');
    });

    it('should allow the user to copy a tutor email', () => {
        cy.visit(courseDetailUrl(validCourseId));

        cy.get('button').contains('Find a Tutor').click();

        // Wait for tutors to load
        cy.get('.fixed').contains('Tutors').should('exist');

        // Stub the clipboard API
        cy.window().then((win) => {
            cy.stub(win.navigator.clipboard, 'writeText').resolves();
        });

        // Assuming there's at least one tutor
        cy.get('.fixed').contains('Copy Email').first().click();

        // Verify that the copied message is displayed
        cy.get('.fixed').contains('Email copied').should('exist');
    });

    it('should add user as tutor when clicking Tutor this Course', () => {
        cy.visit(courseDetailUrl(validCourseId));
    
        // Click the "Tutor this Course" button
        cy.get('button').contains('Tutor this Course').click();
    
        // Verify that the popup appears with either of the valid messages
        cy.get('.fixed', { timeout: 10000 }) // Increase timeout to allow popup to render
            .should('be.visible')
            .then(($popup) => {
                const popupText = $popup.text();
                expect(popupText).to.satisfy((text) => 
                    text.includes('Successfully added as a tutor for this course.') || 
                    text.includes('You have already added yourself as a tutor for this course.')
                );
            });
    
        // Close the popup
        cy.get('.fixed').contains('Close').click();
    
        // Ensure the popup is no longer visible
        cy.get('.fixed').should('not.exist');
    });

    it('should filter reviews by professor', () => {
      cy.visit(courseDetailUrl(validCourseId));

      // Select a professor from the filter dropdown
      cy.get('select#professorFilter').select('John Doe'); // Adjust as needed

      // Allow time for the filter to apply
      cy.wait(1000);

      // Verify that reviews are filtered correctly
      cy.get('.review-card').each(($review) => {
        cy.wrap($review).contains('Professor: John Doe').should('exist');
      });
    });

    it('should filter reviews by rating', () => {
      cy.visit(courseDetailUrl(validCourseId));

      // Select a minimum rating
      cy.get('select#ratingFilter').select('4');

      // Allow time for the filter to apply
      cy.wait(1000);

      // Verify that all reviews have rating >= 4
      cy.get('.review-card').each(($review) => {
        cy.wrap($review).find('.rating-box').invoke('text').then((text) => {
          const rating = parseFloat(text);
          expect(rating).to.be.gte(4);
        });
      });
    });

    it('should download syllabus when clicking Download Syllabus', () => {
      cy.visit(courseDetailUrl(validCourseId));

      // Stub the window.open method
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });

      // Click the Download Syllabus button
      cy.get('.download-syllabus').click();

      // Verify that window.open was called with the syllabus URL
      cy.get('@windowOpen').should('be.called');
    });

    it('should report a review when clicking Report Review', () => {
        cy.visit(courseDetailUrl(validCourseId));
      
        // Ensure reviews are present
        cy.get('.review-card').should('exist');
      
        // Target the first review's Report Review button
        cy.get('[data-testid^="report-review-"]').first().click();
      
        // Verify that the popup message is displayed
        cy.get('.fixed')
          .contains('Review has been reported and will be reviewed further.')
          .should('be.visible');
      
        // Close the popup
        cy.get('.fixed').contains('Close').click();
      
        // Ensure the popup is no longer visible
        cy.get('.fixed').should('not.exist');
      });

    it('should navigate to user profile when clicking on reviewer name', () => {
      cy.visit(courseDetailUrl(validCourseId));

      // Assume there is at least one review
      cy.get('.review-card').first().within(() => {
        cy.get('a').contains(/^[A-Za-z ]+$/).click(); // Click on the reviewer's name
      });

      // Verify that the profile page is opened
      cy.url().should('include', '/profile/');
    });
});
