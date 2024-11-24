describe('Admin Page', () => {
    const baseUrl = Cypress.env('baseUrl');
    const loginUrl = `${baseUrl}/login`;
    const homeUrl = `${baseUrl}/home`;

    const validUser = {
        email: Cypress.env('email'),
        password: Cypress.env('password'),
    };

    const loggedInUserId = Cypress.env('loggedInUserId');

    let testReportId;

    beforeEach(() => {
        cy.visit(loginUrl);
        cy.get('input[placeholder="Vanderbilt Email"]').type(validUser.email);
        cy.get('input[placeholder="Password"]').type(validUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1000);

        // Verify login was successful
        cy.url().should('include', '/home');
        cy.visit(`${baseUrl}/admin`);

        cy.wait(1000);

        cy.get('[data-testid="approve-button"]', { timeout: 10000 }).should('be.visible');

        cy.get('[data-testid="approve-button"]')
            .first()
            .invoke('attr', 'data-report-id')
            .then((id) => {
                testReportId = id;
            });
    });

    it('should display the list of reported reviews', () => {
        // Verify that the reported review is displayed
        cy.contains('Admin Page - Reported Reviews').should('be.visible');

        // Wait for the reports to load
        cy.get('table').should('be.visible');

        // Verify that the test report is present
        cy.contains(testReportId).should('be.visible');
    });

    it('should approve a reported review', () => {
        // Approve the review (delete the report)
        cy.get(`[data-testid="approve-button"][data-report-id="${testReportId}"]`).click();
    
        // Confirm the report is removed
        cy.contains(testReportId).should('not.exist');
      });

      it('should delete a reported review', () => {
        // Get the first delete button and its associated review ID
        cy.get('[data-testid="delete-button"]')
          .first()
          .then(($btn) => {
            const reviewId = $btn.attr('data-review-id');
            expect(reviewId).to.not.be.empty; // Ensure the review ID is valid
      
            // Click the delete button using the element we have
            cy.wrap($btn).click();
      
            // Confirm the review is removed from the page
            cy.contains(reviewId).should('not.exist');
          });
      });
});

