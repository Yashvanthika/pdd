import { BLOOD_GROUPS } from '../../src/mobile/bloodGroups.ts';
import { INDIA_LOCATIONS } from '../../src/data/indiaLocations.ts';
import { loadConfig } from '../../config/load.config.js';

function caseId(index) {
  return `LOAD-${String(index + 1).padStart(4, '0')}`;
}

function pathSegment(value) {
  return encodeURIComponent(String(value));
}

function createCase(cases, module, scenarioName, method, path, options = {}) {
  cases.push({
    body: options.body,
    expectedStatuses: options.expectedStatuses || [200],
    headers: options.headers || {},
    id: caseId(cases.length),
    method,
    module,
    path,
    requiresAuth: Boolean(options.requiresAuth),
    responseCheck: options.responseCheck || '',
    scenarioName,
    tags: options.tags || [],
  });
}

function allDistrictLocations() {
  return INDIA_LOCATIONS.flatMap((stateEntry) => stateEntry.districts.map((districtEntry) => ({
    cities: districtEntry.cities,
    district: districtEntry.district,
    sampleCity: districtEntry.cities[0],
    state: stateEntry.state,
  })));
}

function allCityLocations() {
  return allDistrictLocations().flatMap((districtEntry) => districtEntry.cities.map((city) => ({
    city,
    district: districtEntry.district,
    state: districtEntry.state,
  })));
}

function query(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

function liveAndHealthChecks(cases) {
  const clientProfiles = [
    ['mobile-app', { 'x-load-client': 'expo-mobile' }],
    ['web-app', { 'x-load-client': 'next-web' }],
    ['ci-probe', { 'x-load-client': 'github-actions' }],
    ['json-accept', { accept: 'application/json' }],
    ['no-cache', { 'cache-control': 'no-cache' }],
    ['trace-header', { 'x-request-trace': 'load-catalog' }],
  ];

  clientProfiles.forEach(([profile, headers], index) => {
    createCase(
      cases,
      'Liveness Load',
      `/api/live responds for ${profile} probe ${index + 1}`,
      'GET',
      `/api/live${query({ probe: profile, sequence: index + 1 })}`,
      { headers, responseCheck: 'live', tags: ['public', 'read'] },
    );
  });

  for (let index = 0; index < 18; index += 1) {
    createCase(
      cases,
      'Liveness Load',
      `/api/live handles repeated readiness sample ${index + 1}`,
      'GET',
      `/api/live${query({ sample: index + 1 })}`,
      { responseCheck: 'live', tags: ['public', 'read', 'repeatable'] },
    );
  }

  for (let index = 0; index < 16; index += 1) {
    createCase(
      cases,
      'Health Load',
      `/api/health reports backend readiness sample ${index + 1}`,
      'GET',
      `/api/health${query({ sample: index + 1 })}`,
      {
        expectedStatuses: [200, 503],
        responseCheck: 'health',
        tags: ['public', 'read', 'supabase-aware'],
      },
    );
  }
}

function locationIndexChecks(cases) {
  for (let index = 0; index < 20; index += 1) {
    createCase(
      cases,
      'Location Directory Load',
      `/api/locations returns India directory snapshot ${index + 1}`,
      'GET',
      `/api/locations${query({ page: index + 1, loadCase: `locations-${index + 1}` })}`,
      { responseCheck: 'locations', tags: ['public', 'read', 'large-payload'] },
    );
  }

  INDIA_LOCATIONS.forEach((stateEntry, index) => {
    createCase(
      cases,
      'Location Directory Load',
      `${stateEntry.state} district list is returned under load`,
      'GET',
      `/api/locations/${pathSegment(stateEntry.state)}/districts${query({ loadCase: `state-${index + 1}` })}`,
      { responseCheck: 'districts', tags: ['public', 'read', 'state-directory'] },
    );
  });

  allDistrictLocations().forEach((entry, index) => {
    createCase(
      cases,
      'Location Directory Load',
      `${entry.state} / ${entry.district} city list is returned under load`,
      'GET',
      `/api/locations/${pathSegment(entry.state)}/${pathSegment(entry.district)}/cities${query({ loadCase: `district-${index + 1}` })}`,
      { responseCheck: 'cities', tags: ['public', 'read', 'district-directory'] },
    );
  });
}

function protectedEndpointChecks(cases) {
  const sampleLocations = allCityLocations().slice(0, 18);

  sampleLocations.forEach((location, locationIndex) => {
    BLOOD_GROUPS.forEach((bloodGroup) => {
      createCase(
        cases,
        'Protected Search Load',
        `anonymous donor search is rejected for ${bloodGroup} in ${location.city}`,
        'GET',
        `/api/donors/search${query({
          bloodGroup,
          city: location.city,
          district: location.district,
          state: location.state,
        })}`,
        {
          expectedStatuses: [401, 503],
          responseCheck: 'error',
          tags: ['protected', 'anonymous', 'search'],
        },
      );
    });

    if (locationIndex < 10) {
      createCase(
        cases,
        'Protected Search Load',
        `authenticated donor search succeeds for ${location.city} when token is supplied`,
        'GET',
        `/api/donors/search${query({
          bloodGroup: BLOOD_GROUPS[locationIndex % BLOOD_GROUPS.length],
          city: location.city,
          district: location.district,
          state: location.state,
        })}`,
        {
          expectedStatuses: [200],
          requiresAuth: true,
          responseCheck: 'donors',
          tags: ['protected', 'authenticated', 'search'],
        },
      );
    }
  });

  [
    ['GET', '/api/me', undefined],
    ['PUT', '/api/me', { email: '', phone: '', fullName: '' }],
    ['POST', '/api/me/change-password', { password: 'short' }],
    ['PUT', '/api/me/last-donation', { bloodGroup: 'A+', state: 'Delhi', district: 'New Delhi', city: 'New Delhi' }],
    ['DELETE', '/api/me', undefined],
  ].forEach(([method, path, body]) => {
    for (let index = 0; index < 8; index += 1) {
      createCase(
        cases,
        'Protected Profile Load',
        `${method} ${path} rejects anonymous request sample ${index + 1}`,
        method,
        `${path}${query({ loadCase: index + 1 })}`,
        {
          body,
          expectedStatuses: [401, 503],
          responseCheck: 'error',
          tags: ['protected', 'anonymous', 'profile'],
        },
      );
    }
  });
}

function validationAndEdgeChecks(cases) {
  const invalidLocations = [
    ['Invalid State', 'Invalid District'],
    ['Delhi', 'Invalid District'],
    ['Andhra Pradesh', 'Invalid District'],
    ['Maharashtra', 'Invalid District'],
    ['Tamil Nadu', 'Invalid District'],
    ['Kerala', 'Invalid District'],
  ];

  invalidLocations.forEach(([state, district], index) => {
    createCase(
      cases,
      'Location Edge Load',
      `invalid district lookup returns an empty list sample ${index + 1}`,
      'GET',
      `/api/locations/${pathSegment(state)}/${pathSegment(district)}/cities${query({ loadCase: `invalid-${index + 1}` })}`,
      { responseCheck: 'cities', tags: ['public', 'read', 'edge'] },
    );
  });

  for (let index = 0; index < 12; index += 1) {
    createCase(
      cases,
      'Registration Validation Load',
      `invalid donor registration body is rejected sample ${index + 1}`,
      'POST',
      `/api/auth/register-donor${query({ loadCase: index + 1 })}`,
      {
        body: {
          availableInEmergency: index % 2 === 0,
          bloodGroup: index % 3 === 0 ? 'Invalid' : 'A+',
          city: 'Invalid City',
          displayConsent: index % 2 === 1,
          district: 'Invalid District',
          email: `invalid-${index}@bloodlink.test`,
          fullName: '',
          password: 'short',
          phone: '12345',
          state: 'Invalid State',
          yearOfBirth: 0,
        },
        expectedStatuses: [400, 503],
        responseCheck: 'error',
        tags: ['public', 'validation', 'mutation-safe'],
      },
    );
  }

  [
    '/api/unknown',
    '/api/donor/search',
    '/api/location',
    '/api/auth',
    '/not-an-api-route',
  ].forEach((path, index) => {
    createCase(
      cases,
      'Routing Edge Load',
      `${path} returns not found sample ${index + 1}`,
      'GET',
      `${path}${query({ loadCase: index + 1 })}`,
      { expectedStatuses: [404], responseCheck: 'error', tags: ['public', 'edge', 'not-found'] },
    );
  });

  ['/api/live', '/api/health', '/api/locations', '/api/me', '/api/donors/search'].forEach((path, index) => {
    createCase(
      cases,
      'CORS Preflight Load',
      `${path} handles OPTIONS preflight sample ${index + 1}`,
      'OPTIONS',
      path,
      {
        expectedStatuses: [204, 403],
        headers: {
          'access-control-request-method': 'GET',
          origin: 'https://load-test.invalid',
        },
        tags: ['cors', 'preflight'],
      },
    );
  });
}

export function buildLoadTestCatalog() {
  const cases = [];
  liveAndHealthChecks(cases);
  locationIndexChecks(cases);
  protectedEndpointChecks(cases);
  validationAndEdgeChecks(cases);

  return {
    cases,
    stats: {
      authenticatedCases: cases.filter((testCase) => testCase.requiresAuth).length,
      minRequiredCases: loadConfig.minTestCases,
      totalCases: cases.length,
    },
  };
}
