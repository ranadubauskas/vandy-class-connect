describe('Add Review Page', () => {
    const baseUrl = 'http://localhost:3000';
    const loginUrl = `${baseUrl}/login`;
    const addReviewUrl = (courseId, courseCode) => `${baseUrl}/addReview?code=${courseCode}&id=${courseId}`;
  
    const validUser = {
      email: Cypress.env('email'),
      password: Cypress.env('password'),
    };
  
    const validCourseCode = 'DS%201000'
    const validCourseId = 'lmcslfhrvek0q39';
  
    beforeEach(() => {
      // Log in before each test
      cy.visit(loginUrl);
      cy.get('input[placeholder="Vanderbilt Email"]').type(validUser.email);
      cy.get('input[placeholder="Password"]').type(validUser.password);
      cy.get('button[type="submit"]').click();
  
      // Verify login was successful
      cy.url().should('include', '/home');
    });
  
    it('should display add review form correctly', () => {
      // Navigate to the addReview page
      cy.visit(addReviewUrl(validCourseId, validCourseCode));
  
      // Verify that the form fields are present
      cy.get('input[aria-label="Rating Input"]').should('exist');
      cy.get('textarea[placeholder="Enter your review here..."]').should('exist');
      cy.get('input[placeholder="Professor\'s First Name"]').should('exist');
      cy.get('input[placeholder="Professor\'s Last Name"]').should('exist');
      cy.get('input[type="file"]').should('exist');
    });
  
    it('should show error when required fields are missing', () => {
      cy.visit(addReviewUrl(validCourseId, validCourseCode));
  
      // Click on Save Review button without filling fields
      cy.contains('Save Review').click();
  
      // Verify that error messages are shown
      cy.get('.text-red-500').should('contain', 'Please provide a valid rating.');
    });
  
    it('should show error when comment exceeds maximum word limit', () => {
      cy.visit(addReviewUrl(validCourseId, validCourseCode));
  
      // Enter rating
      cy.get('input[aria-label="Rating Input"]').type('4');
  
      // Enter a comment that exceeds max word count
      const overLimitComment = 'word '.repeat(401); // 401 words
  
      cy.get('textarea[placeholder="Enter your review here..."]').type(overLimitComment);
  
      // Enter professor's names
      cy.get('input[placeholder="Professor\'s First Name"]').type('John');
      cy.get('input[placeholder="Professor\'s Last Name"]').type('Doe');
  
      // Click on Save Review button
      cy.contains('Save Review').click();
  
      // Verify that error message is shown
      cy.get('.text-red-500').should('contain', 'Your comment exceeds the maximum word limit of 400 words.');
    });
  
    it('should successfully submit review when all fields are valid', () => {
      cy.visit(addReviewUrl(validCourseId, validCourseCode));
  
      // Enter rating
      cy.get('input[aria-label="Rating Input"]').clear().type('4');
  
      // Enter a valid comment
      const validComment = 'This is a test review. '.repeat(10); // 10 sentences
  
      cy.get('textarea[placeholder="Enter your review here..."]').type(validComment);
  
      // Enter professor's names
      cy.get('input[placeholder="Professor\'s First Name"]').type('John');
      cy.get('input[placeholder="Professor\'s Last Name"]').type('Doe');
  
      // Click on Save Review button
      cy.contains('Save Review').click();
  
      // Verify that saving indicator appears
      cy.contains('Saving...').should('exist');
  
      // After submission, verify that we are redirected to the course page
      cy.url().should('include', `/course?code=${validCourseCode}&id=${validCourseId}`);
  
      // Optionally, verify that the new review appears on the course page
      cy.contains('This is a test review').should('exist');
    });
  });
  