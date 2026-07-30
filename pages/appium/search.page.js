import { BasePage } from './base.page.js';

export class SearchPage extends BasePage {
  async waitForLoaded() {
    await this.expectText('Search Donors');
    await this.expectA11y('Blood Group');
    await this.expectA11y('Search');
  }

  async search({ bloodGroup = 'A+', city = 'Kochi', district = 'Ernakulam', state = 'Kerala' } = {}) {
    await this.select('Blood Group', bloodGroup);
    await this.select('State', state);
    await this.select('District', district);
    await this.select('City', city);
    await this.tap('Search');
  }
}
