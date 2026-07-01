// cypress/e2e/analyzer.cy.js
describe('Project Aura Analyzer', () => {
  it('should run a bottleneck analysis', () => {
    // Intercept backend API calls to provide robust, deterministic test data
    cy.intercept('GET', '**/api/cpus', [{ cpuName: 'Test CPU Pro', cpuMark: 25000, cores: 12 }]).as('cpus')
    cy.intercept('GET', '**/api/gpus', [{ Device: 'Test GPU Max', CUDA: 10000 }]).as('gpus')
    cy.intercept('POST', '**/api/predict', { predicted_fps: 120.5 }).as('predict')

    // 1. Go to your local React app and mock the login session
    cy.visit('http://localhost:5173', {
      onBeforeLoad(win) {
        // Set fake user session to bypass the Auth (login) screen
        win.localStorage.setItem('aura_user', JSON.stringify({
          name: "Test User",
          email: "test@example.com"
        }))
      }
    })

    // Wait for the mock hardware lists to load into the app
    cy.wait('@cpus')
    cy.wait('@gpus')

    // 2. Type the mocked CPU name into the input
    cy.get('input[placeholder*="Type to search CPUs"]').clear().type('Test CPU Pro')
    
    // 3. Type the mocked GPU name
    cy.get('input[placeholder*="Type to search GPUs"]').clear().type('Test GPU Max')
    
    // 4. Click the Run Analysis button
    cy.contains('Run Analysis').click()

    // Wait for the prediction request to finish
    cy.wait('@predict')
    
    // 5. Verify that the results appear and show an FPS number
    cy.contains('Predicted Performance').should('exist')
    cy.contains('FPS').should('exist')
  })
})
