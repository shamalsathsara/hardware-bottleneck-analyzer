describe('Hardware Analyzer App', () => {
  it('successfully loads the app', () => {
    // Visit the base URL (which is http://localhost:5173 as configured in cypress.config.js)
    cy.visit('/')

    // Verify the page loaded by checking for common elements
    // The exact text will depend on your UI, but checking for "hardware" or "analyzer" is a safe bet
    cy.get('body').should('be.visible')
  })

  it('handles navigation correctly', () => {
    cy.visit('/')
    // Ensure that clicking links or navigating works without crashing
    // This is a placeholder test that you can expand upon!
    cy.window().should('have.property', 'document')
  })
})
