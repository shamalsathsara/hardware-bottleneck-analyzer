// End-to-end tests for the Bottleneck Calculator with a stubbed API.
// Run with the dev server up: `npm run dev` then `npm test`.

const CPU = { _id: 'cpu1', displayName: 'Test CPU Pro', cpuMark: 25000, cores: 12, hardwareSource: 'legacy', legacyId: 'cpu1' };
const GPU = { _id: 'gpu1', displayName: 'Test GPU Max', CUDA: 200000, hardwareSource: 'legacy', legacyId: 'gpu1' };

function stubApi() {
  cy.intercept('GET', '**/api/cpus/all-lightweight', [{ cpuName: 'Faster CPU', cpuMark: 40000 }]).as('cpuList');
  cy.intercept('GET', '**/api/gpus/all-lightweight', [{ Device: 'Faster GPU', CUDA: 300000 }]).as('gpuList');
  cy.intercept('GET', '**/api/hardware/stats', { maxCpuMark: 100000, maxGpuCuda: 500000 });
  cy.intercept('GET', '**/api/cpus/search*', [CPU]).as('cpuSearch');
  cy.intercept('GET', '**/api/gpus/search*', [GPU]).as('gpuSearch');
  cy.intercept('GET', '**/api/games/search*', [{ name: 'Fortnite', slug: 'fortnite', dataQuality: 'verified' }]).as('gameSearch');
}

function pickHardware() {
  cy.get('#cpu-search-input').type('Test CPU');
  cy.wait('@cpuSearch');
  cy.contains('[role="option"]', 'Test CPU Pro').click();

  cy.get('#gpu-search-input').type('Test GPU');
  cy.wait('@gpuSearch');
  cy.contains('[role="option"]', 'Test GPU Max').click();
}

describe('Bottleneck Calculator', () => {
  beforeEach(() => {
    stubApi();
    cy.visit('/bottleneck-calculator');
  });

  it('runs a general bottleneck analysis without a game', () => {
    pickHardware();
    cy.get('#run-analysis-btn').click();
    cy.contains('Bottleneck Analysis Result').should('be.visible');
    cy.contains('%').should('exist');
  });

  it('predicts FPS when a game is selected', () => {
    cy.intercept('POST', '**/api/predict', {
      predictedFps: 120.5, modelVersion: 'v2', gameCoverage: 'known', preset: 'Medium', game: 'fortnite',
    }).as('predict');

    pickHardware();
    cy.get('#game-search-input').type('fort');
    cy.wait('@gameSearch');
    cy.contains('li', 'Fortnite').click();

    cy.get('#run-analysis-btn').click();
    cy.wait('@predict').its('request.body').should((body) => {
      expect(body.CPU).to.eq('Test CPU Pro');
      expect(body['Graphics Settings']).to.eq('Medium');
    });
    cy.contains('Game Performance Result').should('be.visible');
    cy.get('.gauge-fps-value').should('have.text', '121');
  });

  it('only offers the presets the FPS model supports', () => {
    cy.get('#settings-select option').then((options) => {
      expect([...options].map((o) => o.value)).to.deep.eq(['Medium', 'Ultra']);
    });
  });

  it('does not analyze stale hardware after the CPU text is edited', () => {
    pickHardware();
    cy.get('#cpu-search-input').type(' edited');
    cy.get('#run-analysis-btn').click();
    cy.contains('Please select both a CPU and a GPU').should('be.visible');
  });

  it('shows a friendly message when the AI service is down', () => {
    cy.intercept('POST', '**/api/predict', {
      statusCode: 503,
      body: { error: 'AI_SERVICE_UNAVAILABLE', message: 'The prediction service is temporarily unavailable. Please try again shortly.' },
    }).as('predict');

    pickHardware();
    cy.get('#game-search-input').type('fort');
    cy.wait('@gameSearch');
    cy.contains('li', 'Fortnite').click();
    cy.get('#run-analysis-btn').click();
    cy.wait('@predict');

    cy.contains('Game FPS Prediction Unavailable').should('be.visible');
    cy.contains('Bottleneck Analysis Result').should('be.visible');
  });
});
