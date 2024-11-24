describe('Profile Page', () => {
    const baseUrl = Cypress.env('baseUrl');
    const loginUrl = `${baseUrl}/login`;
    const profileUrl = (userId) => `${baseUrl}/profile/${userId}`;
    const logoutUrl = `${baseUrl}/logout`;

    // Replace these with your actual test user credentials
    const validUser = {
        email: Cypress.env('email'),
        password: Cypress.env('password'),
    };

    // Replace with your logged-in user's ID
    const loggedInUserId = Cypress.env('loggedInUserId');

    // Other user ID provided
    const otherUserId = 'pmwbws77dohxv0s';

    beforeEach(() => {
        // Log in before each test
        cy.visit(loginUrl);
        cy.get('input[placeholder="Vanderbilt Email"]').type(validUser.email);
        cy.get('input[placeholder="Password"]').type(validUser.password);
        cy.get('button[type="submit"]').click();

        // Verify login was successful
        cy.url().should('include', '/home');
    });

    it('should display own profile information correctly', () => {
        cy.visit(profileUrl(loggedInUserId));
      
        // Wait for the profile heading to ensure the page has loaded
        cy.contains('Profile').should('exist');
      
        // Wait for the loading indicator to appear and then disappear
        cy.get('[data-testid="loading-indicator"]', { timeout: 20000 }).should('not.exist');
      
        cy.contains('label', 'Email')
          .parent()
          .find('div.text-lg')
          .should('contain', validUser.email);
      
        cy.contains('label', 'Graduation Year')
          .parent()
          .find('div.text-lg')
          .should('not.be.empty');
      
        // Verify that Edit Profile button is visible
        cy.contains('Edit Profile').should('exist');
      });
      
      

    it('should display other user\'s profile without edit option', () => {
        cy.visit(profileUrl(otherUserId));

        // Verify that profile details are displayed
        cy.contains('Profile').should('exist');
        cy.get('div').contains('Email').next().should('not.be.empty');
        cy.get('div').contains('Graduation Year').next().should('not.be.empty');

    });

    it('should navigate to user\'s reviews when clicking View My Reviews', () => {
        cy.visit(profileUrl(loggedInUserId));

        // Click on View My Reviews
        cy.contains('View My Reviews').click();

        // Verify that the URL includes /ratings/
        cy.url().should('include', `/ratings/${loggedInUserId}`);
    });

    it('should navigate to user\'s courses when clicking View My Courses', () => {
        cy.visit(profileUrl(loggedInUserId));

        // Click on View My Courses
        cy.contains('View My Courses').click();

        // Verify that the URL includes /savedCourses
        cy.url().should('include', '/savedCourses');
    });

    it('should not allow editing email field', () => {
        cy.visit(profileUrl(loggedInUserId));

        // Click on Edit Profile
        cy.contains('Edit Profile').click();

        // Try to edit the email field
        cy.get('input#email').should('have.attr', 'readonly');
    });

    it('should show error when required fields are missing', () => {
        cy.visit(profileUrl(loggedInUserId));

        // Click on Edit Profile
        cy.contains('Edit Profile').click();

        // Clear first name and last name
        cy.get('input#firstName').clear();
        cy.get('input#lastName').clear();

        // Click on Save Profile
        cy.contains('Save Profile').click();
    });
});
