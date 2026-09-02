/**
 * Source Licensing & Policy Enforcement for Benchmark Ingestion.
 *
 * Prevents external payloads from self-approving their licensing status.
 */

const SOURCE_POLICY_REGISTRY = {
  project_aura_test: {
    defaultLicenseStatus: 'approved',
    allowedForTraining: true,
    allowedForDisplay: true,
    description: 'First-party Project Aura Lab empirical measurements.',
  },
  licensed_dataset: {
    defaultLicenseStatus: 'approved_with_conditions',
    allowedForTraining: true,
    allowedForDisplay: true,
    description: 'Commercially licensed structured benchmark datasets with signed agreements.',
  },
  official_benchmark_api: {
    defaultLicenseStatus: 'internal_only',
    allowedForTraining: false, // Third-party estimates cannot train Model V2
    allowedForDisplay: true,
    description: 'Official vendor APIs (e.g. UL estimate endpoint) for display/fallback reference.',
  },
  publisher_data: {
    defaultLicenseStatus: 'approved_with_conditions',
    allowedForTraining: true,
    allowedForDisplay: true,
    description: 'Direct game developer / publisher authorized benchmark telemetry.',
  },
  trusted_review: {
    defaultLicenseStatus: 'permission_required',
    allowedForTraining: false, // Automated scraping prohibited; requires Creator Contribution Agreement
    allowedForDisplay: false,
    description: 'Reviewer / benchmark lab publications without formal contribution agreement.',
  },
  community_submission: {
    defaultLicenseStatus: 'internal_only',
    allowedForTraining: false, // Requires future telemetry validation and consent terms
    allowedForDisplay: false,
    description: 'Unverified opt-in community submissions.',
  },
  legacy_dataset: {
    defaultLicenseStatus: 'internal_only',
    allowedForTraining: false, // V1 legacy dataset is restricted from Dataset V2
    allowedForDisplay: false,
    description: 'Legacy V1 unverified benchmarks.',
  },
};

/**
 * Determine the authoritative license status based on Project Aura policy.
 * Incoming payloads cannot bypass licensing restrictions.
 *
 * @param {string} sourceType
 * @param {Object} options Additional policy metadata (e.g. registered partner ID)
 * @returns {string} Authoritative licenseStatus enum value
 */
function resolveLicenseStatus(sourceType, options = {}) {
  const policy = SOURCE_POLICY_REGISTRY[sourceType];
  if (!policy) {
    return 'unknown';
  }

  // If source is a verified partner with an active contribution contract
  if (options.hasSignedContributionAgreement === true && sourceType === 'trusted_review') {
    return 'approved_with_conditions';
  }

  // If source has an enterprise data agreement
  if (options.hasEnterpriseLicense === true && sourceType === 'licensed_dataset') {
    return 'approved';
  }

  return policy.defaultLicenseStatus;
}

module.exports = {
  SOURCE_POLICY_REGISTRY,
  resolveLicenseStatus,
};
