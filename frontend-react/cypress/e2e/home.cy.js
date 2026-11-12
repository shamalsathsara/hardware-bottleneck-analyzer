describe('Navigation', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { statusCode: 200, body: [] });
  });

  it('loads the home page with the main heading', () => {
    cy.visit('/');
    cy.get('#hero-main-title').should('be.visible');
    cy.title().should('contain', 'Project Aura');
  });

  it('shows a 404 page for unknown routes instead of the home page', () => {
    cy.visit('/this-page-does-not-exist');
    cy.contains('Page not found').should('be.visible');
  });

  it('serves deep links to the calculator', () => {
    cy.visit('/bottleneck-calculator/');
    cy.get('#run-analysis-btn').should('be.visible');
  });
});
