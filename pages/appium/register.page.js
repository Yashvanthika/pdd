import { BasePage } from './base.page.js';

export class RegisterPage extends BasePage {
  async waitForLoaded() {
    await this.expectText('Donor Registration');
    await this.expectA11y('Full Name');
    await this.expectA11y('Mobile Number');
    await this.expectA11y('Register');
  }

  async fillRequiredProfile({
    bloodGroup = 'A+',
    city = 'Kochi',
    district = 'Ernakulam',
    email = 'mobile.qa@bloodlink.test',
    fullName = 'Mobile QA Donor',
    password = 'BloodLink#2026',
    phone = '9999999999',
    state = 'Kerala',
    yearOfBirth = '1996',
  } = {}) {
    await this.type('Full Name', fullName);
    await this.select('Blood Group', bloodGroup);
    await this.select('Year of Birth', yearOfBirth);
    await this.type('Mobile Number', phone);
    await this.type('Email', email);
    await this.type('Password', password);
    await this.type('Retype Password', password);
    await this.select('State', state);
    await this.select('District', district);
    await this.select('City', city);
  }

  async submit() {
    await this.tap('Register');
  }
}
