import { browser, by, element, ElementFinder, WebElement } from 'protractor';

export class AppPage {
  public titleElement: ElementFinder;
  public appElement: ElementFinder;
  constructor() {
    this.appElement = element(by.css('app-root'));
    this.titleElement = element(by.tagName('h1'));
  }
  async navigateTo(): Promise<unknown> {
    return await browser.get(browser.baseUrl);
  }

  async getAppRoot(): Promise<WebElement> {
    return await this.titleElement.getWebElement();
  }
  async getTitleText(): Promise<string> {
    return await this.titleElement.getText();
  }
}
