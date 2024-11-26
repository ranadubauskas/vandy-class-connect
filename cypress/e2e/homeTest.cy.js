describe('Home Page', () => {
  const baseUrl = Cypress.env('baseUrl');
  const loginUrl = `${baseUrl}/login`;
  const homeUrl = `${baseUrl}/home`;

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
    cy.url().should('eq', homeUrl);
  });

  it('should search for courses and display relevant results', () => {
    const searchQuery = 'MATH';
    cy.get('input[placeholder="Search for a course"]').type(searchQuery);
    cy.get('button').contains('Search').click();

    // Wait for the results to load
    cy.get('.grid-container .course-card', { timeout: 10000 }).should('have.length.greaterThan', 0);

    // Verify search results contain the search query
    cy.get('.grid-container .course-card').each(($course) => {
      cy.wrap($course).contains(searchQuery, { matchCase: false });
    });
  });

  it('should filter courses by subject', () => {
    const subjectFilter = 'MATH'; // Use a valid subject from your dataset

    // Click on the subject filter button to open the dropdown
    cy.get('button[aria-label="Open subject filter"]').click();

    // Wait for the dropdown to be visible
    cy.get('div[role="listbox"]').should('be.visible');

    // Select the 'MATH' subject
    cy.get('div[role="listbox"]').within(() => {
      cy.contains('label', subjectFilter).find('input[type="checkbox"]').check({ force: true });
    });

    // Close the dropdown by clicking outside
    cy.get('body').click(0, 0); // Click at the top-left corner to close the dropdown

    // Allow time for the filter to apply and the UI to update
    cy.wait(1000);

    // Wait for the results to load
    cy.get('.grid-container .course-card', { timeout: 10000 }).should('have.length.greaterThan', 0);

    // Verify that only courses with the selected subject are displayed
    cy.get('.grid-container .course-card').each(($course) => {
      cy.wrap($course).find('.course-subject').invoke('text').then((text) => {
        expect(text.toUpperCase()).to.include(subjectFilter);
      });
    });
  });

  it('should filter courses by minimum rating', () => {
    const minimumRating = '4'; // Filter courses with a rating of 4+

    // Wait for the select element to be enabled
    cy.get('select#ratingFilter').should('not.be.disabled');

    cy.get('select#ratingFilter').select(minimumRating);

    // Wait for the results to load
    cy.get('.grid-container .course-card', { timeout: 10000 }).should('have.length.greaterThan', 0);

    // Verify all displayed courses have ratings >= 4
    cy.get('.grid-container .course-card').each(($course) => {
      cy.wrap($course).find('.rating-box').invoke('text').then((ratingText) => {
        const rating = parseFloat(ratingText);
        expect(rating).to.be.gte(4);
      });
    });
  });

  it('should search and filter courses together', () => {
    const searchQuery = 'DS';
    const subjectFilter = 'DS'; // Use a valid subject from your dataset

    cy.get('input[placeholder="Search for a course"]').type(searchQuery);

    // Open the subject filter dropdown
    cy.get('button[aria-label="Open subject filter"]').click();

    // Wait for the dropdown to be visible
    cy.get('div[role="listbox"]').should('be.visible');

    // Select the subject
    cy.get('div[role="listbox"]').within(() => {
      cy.contains('label', subjectFilter).find('input[type="checkbox"]').check({ force: true });
    });

    // Close the dropdown
    cy.get('body').click(0, 0); // Click outside to close the dropdown

    cy.get('button').contains('Search').click();

    // Wait for the results to load
    cy.get('.grid-container .course-card', { timeout: 10000 }).should('have.length.greaterThan', 0);

    // Verify results match both the search query and subject filter
    cy.get('.grid-container .course-card').each(($course) => {
      cy.wrap($course).contains(searchQuery, { matchCase: false }).should('exist');
      cy.wrap($course).find('.course-subject').invoke('text').then((text) => {
        expect(text.toUpperCase()).to.include(subjectFilter);
      });
    });
  });

  it('should allow the user to click a course and navigate to the course page', () => {
    // Wait for courses to load
    cy.get('.grid-container > div', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
      .first()
      .within(() => {
        cy.get('.view-course')
          .should('exist') // Ensure the button exists
          .and('be.visible') // Ensure the button is visible
          .click(); // Click the button
      });

    // Verify navigation to the course page
    cy.url().should('include', '/course?code='); // Check the URL includes course code
    cy.get('.course-details', { timeout: 10000 }).should('exist'); // Check course details are visible
  });
});
