describe('NavBar Component', () => {
    const baseUrl = Cypress.env('baseUrl');
    const loginUrl = `${baseUrl}/login`;
    const savedCoursesUrl = `${baseUrl}/savedCourses`;
    const profileUrl = `${baseUrl}/profile`;
    const adminUrl = `${baseUrl}/admin`;
    const ratingsUrl = `${baseUrl}/ratings`;
  
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
  
    it('should display all navigation links when logged in', () => {
      // Verify the presence of navigation links
      cy.get('header').within(() => {
        cy.contains('About').should('exist');
        cy.contains('Home').should('exist');
        cy.contains('Saved Courses').should('exist');
        cy.contains('Profile').should('exist');
        cy.contains('Log Out').should('exist');
      });
    });
  
    it('should navigate to the "About" page', () => {
      cy.contains('About').click();
      cy.url().should('include', '/about');
    });
  
    it('should navigate to the "Saved Courses" page', () => {
      cy.contains('Saved Courses').click();
      cy.url().should('include', '/savedCourses');
    });
  
    it('should navigate to the "Profile" page', () => {
      cy.contains('Profile').click();
      cy.url().should('include', `/profile`);
    });
  
    it('should navigate to "Admin" page if user is an admin', () => {
      // Check if the "Admin" link is visible
      cy.get('header').then(($header) => {
        if ($header.find('a:contains("Admin")').length > 0) {
          cy.contains('Admin').click();
          cy.url().should('include', '/admin');
        }
      });
    });
  
    it('should log out successfully', () => {
      cy.contains('Log Out').click();
  
      // Verify redirection to the login page
      cy.url().should('include', '/login');
    });
  
    it('should navigate to "View My Reviews" when profile dropdown is clicked', () => {
      cy.contains('Profile').click(); // Open the dropdown
      cy.contains('View My Reviews').click(); // Click the "View My Reviews" option
      cy.url().should('include', `/ratings/${Cypress.env('loggedInUserId')}`); // Verify navigation
    });
  });
  