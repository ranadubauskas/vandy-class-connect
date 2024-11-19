describe('Saved Courses Page', () => {
    const baseUrl = Cypress.env('baseUrl');
    const loginUrl = `${baseUrl}/login`;
    const savedCoursesUrl = `${baseUrl}/savedCourses`;
    const logoutUrl = `${baseUrl}/logout`;
  
    // Replace these with your actual test user credentials
    const validUser = {
      email: Cypress.env('email'),
      password: Cypress.env('password'),
    };
  
    beforeEach(() => {
      // Log in before each test
      cy.visit(loginUrl);
      cy.get('input[placeholder="Vanderbilt Email"]').type(validUser.email);
      cy.get('input[placeholder="Password"]').type(validUser.password);
      cy.get('button[type="submit"]').click();
  
      // Verify login was successful
      cy.url().should('include', '/home');
    });
  
    it('should display saved courses correctly', () => {
      cy.visit(savedCoursesUrl);
  
      // Verify that the page header is displayed
      cy.contains('My Courses').should('exist');
  
      // Verify that at least one saved course is displayed
      cy.get('.bg-white .flex.items-center.justify-between').should('exist');
  
      cy.get('.text-lg').should('contain', 'CS 1151');
    });
  
    it('should navigate to course detail page when clicking View Course', () => {
      cy.visit(savedCoursesUrl);
  
      // Click on View Course button of the first course
      cy.get('button').contains('View Course').first().click();
  
      // Verify that the URL includes /course?id=
      cy.url().should('include', '/course?id=');
    });
  
    it('should enter edit mode and display remove icons', () => {
      cy.visit(savedCoursesUrl);
  
      // Click on Edit button
      cy.contains('Edit').click();
  
      // Verify that remove icons are displayed
      cy.get('[data-testid="unsave-button"]').should('exist');
    });
  
    it('should remove a course from saved courses', () => {
      cy.visit(savedCoursesUrl);
  
      // Ensure there is at least one course to remove
      cy.get('.bg-white .flex.items-center.justify-between').should('exist');
  
      // Get the number of saved courses before removal
      cy.get('.bg-white .flex.items-center.justify-between').then(($courses) => {
        const courseCountBefore = $courses.length;
  
        // Enter edit mode
        cy.contains('Edit').click();
  
        // Click on the first unsave button
        cy.get('[data-testid="unsave-button"]').first().click();
  
        // Confirm removal in the dialog
        cy.contains('Remove Course').should('exist');
        cy.contains('Remove').click();
  
        // Wait for the course to be removed
        cy.wait(1000);
      });
    });
  
    it('should toggle between edit mode and normal mode', () => {
      cy.visit(savedCoursesUrl);
  
      // Click on Edit button
      cy.contains('Edit').click();
  
      // Verify that the button now says "Save Changes"
      cy.contains('Save Changes').should('exist');
  
      // Verify that remove icons are displayed
      cy.get('[data-testid="unsave-button"]').should('exist');
  
      // Click on Save Changes button
      cy.contains('Save Changes').click();
  
      // Verify that the button now says "Edit"
      cy.contains('Edit').should('exist');
  
      // Verify that remove icons are no longer displayed
      cy.get('[data-testid="unsave-button"]').should('not.exist');
    });
  
    it('should close the confirmation dialog when clicking the close icon', () => {
      cy.visit(savedCoursesUrl);
  
      // Enter edit mode
      cy.contains('Edit').click();
  
      // Click on the first unsave button
      cy.get('[data-testid="unsave-button"]').first().click();
  
      // Verify that the confirmation dialog is open
      cy.contains('Remove Course').should('exist');
  
      // Click on the close icon
      cy.get('button[aria-label="close"]').click();
  
      // Verify that the confirmation dialog is closed
      cy.contains('Remove Course').should('not.exist');
    });
  });
  