import { BasePage } from './base.page.js';

export class LoginPage extends BasePage {
  async open() {
    await this.resetToLogin();
    await this.waitForLoaded();
  }

  async waitForLoaded() {
    await this.expectText('BloodLink');
    await this.expectA11y('Email');
    await this.expectA11y('Password');
    await this.expectA11y('Sign In');
  }

  async login(email, password) {
    await this.type('Email', email);
    await this.type('Password', password);
    await this.tap('Sign In');
  }

  async submitEmpty() {
    await this.tap('Sign In');
  }

  async openRegistration() {
    await this.open();
    await this.tap('Create donor account');
  }

  async openForgotPassword() {
    await this.open();
    await this.tap('Forgot password');
  }
}
