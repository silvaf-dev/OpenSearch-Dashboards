/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  DATASOURCE_NAME,
  INDEX_PATTERN_NAME,
  INDEX_NAME,
  START_TIME,
  END_TIME,
  WORKSPACE_NAME,
  INDEX_PATTERN_LANGUAGES,
  INDEX_LANGUAGES,
} from './constants.js';
import * as dataExplorer from './helpers.js';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants';

const clickFirstToggleBtn = () =>
  cy.getElementByTestId('docTableExpandToggleColumn').eq(0).find('button').click();

const checkViewDocumentLinksByQueryLanguage = (language) => {
  cy.setQueryLanguage(language);
  clickFirstToggleBtn();
  if (language === 'DQL' || language === 'Lucene') {
    // make sure the element exists, is visible and is a link
    cy.contains('View surrounding documents').should('be.visible').and('have.prop', 'tagName', 'A');
    cy.contains('View single document').should('be.visible').and('have.prop', 'tagName', 'A');
  } else {
    cy.contains('View surrounding documents').should('not.exist');
    cy.contains('View single document').should('not.exist');
  }
  clickFirstToggleBtn();
};

const openViewDocumentLinksByQueryLanguage = (language, btnIndex) => {
  dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, language);
  cy.setTopNavDate(START_TIME, END_TIME);
  const button = ['View surrounding documents', 'View single document'];
  const checkDataPersistence = () => {
    const testData = {
      bytes_transferred: '1,222',
      event_time: 'Dec 31, 2022 @ 04:14:42.801',
      'personal.name': 'Flora Bergstrom',
      'personal.email': 'Curtis47@yahoo.com',
    };
    Object.keys(testData).forEach((key) => {
      const value = testData[key];
      cy.getElementByTestId(`tableDocViewRow-${key}-value`).should('have.text', value);
    });
  };
  cy.setQueryLanguage(language);
  clickFirstToggleBtn();
  checkDataPersistence();
  cy.contains(button[btnIndex])
    .invoke('attr', 'href')
    .then(($href) => {
      cy.visit($href);
      if (!btnIndex) clickFirstToggleBtn();
      checkDataPersistence();
    });
  // prepare next iteration
  if (!btnIndex) {
    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: WORKSPACE_NAME,
      page: 'discover',
      isEnhancement: true,
    });
  }
};

describe('discover table spec', () => {
  before(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.data.ndjson']
    );
    // Add data source
    cy.addDataSource({
      name: `${DATASOURCE_NAME}`,
      url: `${SECONDARY_ENGINE.url}`,
      authType: 'no_auth',
    });

    // Create workspace
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${WORKSPACE_NAME}`);
    cy.wait(2000);
    cy.createWorkspaceIndexPatterns({
      url: `${BASE_PATH}`,
      workspaceName: `${WORKSPACE_NAME}`,
      indexPattern: 'data_logs_small_time_1',
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
    });
    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: WORKSPACE_NAME,
      page: 'discover',
      isEnhancement: true,
    });
  });

  after(() => {
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex('data_logs_small_time_1');
  });

  describe('discover table', () => {
    describe('view surrounding and single document', () => {
      it('index pattern: check links exist', () => {
        dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        cy.setTopNavDate(START_TIME, END_TIME);
        INDEX_PATTERN_LANGUAGES.forEach((lang) => checkViewDocumentLinksByQueryLanguage(lang));
      });
      it('index: check links exist', () => {
        dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL', 'timestamp');
        INDEX_LANGUAGES.forEach((lang) => checkViewDocumentLinksByQueryLanguage(lang));
      });
      it('index pattern: click on links', () => {
        INDEX_PATTERN_LANGUAGES.slice(0, 2).forEach((lang, index) =>
          openViewDocumentLinksByQueryLanguage(lang, index)
        );
      });
    });

    describe('sort', () => {});

    describe('expand document', () => {});
  });
});
