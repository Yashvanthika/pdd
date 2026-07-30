import { BasePage } from './base.page.js';

export class ProfilePage extends BasePage {
  async waitForLoaded() {
    await this.expectText('My Profile');
  }

  async openFromSearch() {
    await this.tap('Open my page');
    await this.waitForLoaded();
  }

  async openOption(label) {
    await this.tap(label);
  }

  async logout() {
    await this.tap('Log out');
  }
}
