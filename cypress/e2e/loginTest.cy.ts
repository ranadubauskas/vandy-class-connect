describe('Login Page', () => {
  const baseUrl = Cypress.env('baseUrl');
  const loginUrl = `${baseUrl}/login`;
  const homeUrl = `${baseUrl}/home`;

  const validUser = {
      email: Cypress.env('email'),
      password: Cypress.env('password'),
  };

  const invalidUser = {
      email: 'invaliduser@vanderbilt.edu',
      password: 'invalidpassword',
  };

  it('should display the login form', () => {
      cy.visit(loginUrl);

      // Verify login form elements are visible
      cy.get('input[placeholder="Vanderbilt Email"]').should('be.visible');
      cy.get('input[placeholder="Password"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Login');
  });

  it('should login successfully with valid credentials', () => {
      cy.visit(loginUrl);

      // Input valid credentials and login
      cy.get('input[placeholder="Vanderbilt Email"]').type(validUser.email);
      cy.get('input[placeholder="Password"]').type(validUser.password);
      cy.get('button[type="submit"]').click();

      // Verify redirection to home page
      cy.url().should('include', '/home');
  });

  it('should display an error message with invalid credentials', () => {
      cy.visit(loginUrl);

      // Input invalid credentials and attempt login
      cy.get('input[placeholder="Vanderbilt Email"]').type(invalidUser.email);
      cy.get('input[placeholder="Password"]').type(invalidUser.password);
      cy.get('button[type="submit"]').click();

      // Verify error message is displayed
      cy.get('p').should('contain', 'Login failed. Please check your credentials.');
  });
});
