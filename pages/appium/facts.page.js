import { BasePage } from './base.page.js';

export class FactsPage extends BasePage {
  async waitForLoaded() {
    await this.expectText('Blood Donation Facts');
  }
}
