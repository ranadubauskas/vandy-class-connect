describe('User Ratings Page', () => {
    const baseUrl = Cypress.env('baseUrl');
    const loginUrl = `${baseUrl}/login`;
    const reviewsUrl = (userId) => `${baseUrl}/ratings/${userId}`;
    const homeUrl = `${baseUrl}/home`;

    const validUser = {
        email: Cypress.env('email'),
        password: Cypress.env('password'),
    };

    const loggedInUserId = Cypress.env('loggedInUserId');


    beforeEach(() => {
        cy.visit(loginUrl);
        cy.get('input[placeholder="Vanderbilt Email"]').type(validUser.email);
        cy.get('input[placeholder="Password"]').type(validUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1000);

        // Verify login was successful
        cy.url().should('include', '/home');
        cy.visit(reviewsUrl(loggedInUserId));
    });


    it('should display a list of reviews', () => {
        // Wait for reviews to load
        cy.get('.reviews-container').should('be.visible');
    
        // Check if there are any reviews
        cy.get('[data-testid="rating-card"]').then((cards) => {
          if (cards.length > 0) {
            // At least one review exists
            cy.get('[data-testid="rating-card"]').should('have.length.at.least', 1);
          } else {
            // No reviews available
            cy.contains('No reviews available.').should('be.visible');
          }
        });
      });
    
      it('should edit a review', () => {
        // Ensure at least one review exists
        cy.get('[data-testid="rating-card"]').should('have.length.at.least', 1);
      
        // Find the first rating card
        cy.get('[data-testid="rating-card"]').first().within(() => {
          // Click the edit button
          cy.get('[data-testid="edit-button"]').click();
      
          // Edit the comment
          cy.get('textarea').clear().type('Updated review comment.');
      
          // Change the star rating
          cy.get('.star-rating').within(() => {
            // Click the 4th star
            cy.get('.star').eq(3).click();
          });
      
          // Save the changes
          cy.contains('✅ Save').click();
      
          // Verify that the comment was updated
          cy.get('[data-testid="review-comment"]').should('contain', 'Updated review comment.');
      
          // Verify the star rating was updated
          cy.get('.star-rating .star.filled').should('have.length', 4);
        });
      });
      
    
      it('should delete a review', () => {
        // Get the initial count of rating cards
        cy.get('[data-testid="rating-card"]')
          .its('length')
          .then((initialCount) => {
            // Find and delete the first rating card
            cy.get('[data-testid="rating-card"]').first().within(() => {
              cy.get('[data-testid="delete-button"]').click();
            });
      
            // Confirm the count has decreased by 1
            cy.get('[data-testid="rating-card"]').should('have.length', initialCount - 1);
          });
      });
});
