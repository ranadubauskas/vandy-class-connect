describe('Register Page', () => {
  const baseUrl = Cypress.env('baseUrl');

  const validUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser4@vanderbilt.edu',
    username: 'testuser4',
    password: 'password123',
    passwordConfirm: 'password123',
    graduationYear: 2025,
  };

  it('should load the registration page', () => {
    cy.visit(`${baseUrl}/register`);
    cy.get('h1').should('contain', 'Register');
    cy.get('form').should('exist');
  });

  it('should show an error for empty fields', () => {
    cy.visit(`${baseUrl}/register`);
    cy.get('button[type="submit"]').click();
    cy.get('p').should('contain', 'Invalid input. Please provide all required fields.');
  });

  it('should show an error for invalid email domain', () => {
    cy.visit(`${baseUrl}/register`);
    cy.get('input[placeholder="First Name*"]').type(validUser.firstName);
    cy.get('input[placeholder="Last Name*"]').type(validUser.lastName);
    cy.get('input[placeholder="Vanderbilt Email*"]').type('invaliduser@gmail.com');
    cy.get('input[placeholder="Username*"]').type(validUser.username);
    cy.get('input[placeholder="Password*"]').type(validUser.password);
    cy.get('input[placeholder="Confirm Password*"]').type(validUser.passwordConfirm);
    cy.get('select').select(validUser.graduationYear.toString());
    cy.get('button[type="submit"]').click();
    cy.get('p').should('contain', 'Only Vanderbilt email addresses are allowed.');
  });

  it('should show an error for mismatched passwords', () => {
    cy.visit(`${baseUrl}/register`);
    cy.get('input[placeholder="First Name*"]').type(validUser.firstName);
    cy.get('input[placeholder="Last Name*"]').type(validUser.lastName);
    cy.get('input[placeholder="Vanderbilt Email*"]').type(validUser.email);
    cy.get('input[placeholder="Username*"]').type(validUser.username);
    cy.get('input[placeholder="Password*"]').type(validUser.password);
    cy.get('input[placeholder="Confirm Password*"]').type('wrongpassword');
    cy.get('select').select(validUser.graduationYear.toString());
    cy.get('button[type="submit"]').click();
    cy.get('p').should('contain', 'Passwords do not match.');
  });

  it('should successfully register a new user', () => {
    cy.visit(`${baseUrl}/register`);
    cy.get('input[placeholder="First Name*"]').type(validUser.firstName);
    cy.get('input[placeholder="Last Name*"]').type(validUser.lastName);
    cy.get('input[placeholder="Vanderbilt Email*"]').type(validUser.email);
    cy.get('input[placeholder="Username*"]').type(validUser.username);
    cy.get('input[placeholder="Password*"]').type(validUser.password);
    cy.get('input[placeholder="Confirm Password*"]').type(validUser.passwordConfirm);
    cy.get('select').select(validUser.graduationYear.toString());
    cy.get('button[type="submit"]').click();

    cy.wait(2000);

    // Verify successful navigation to the home page
    cy.url().should('include', '/home');
  });

  it('should display login link for existing users', () => {
    cy.visit(`${baseUrl}/register`);
    cy.get('a').contains('Login').should('have.attr', 'href', '/login');
  });
});
