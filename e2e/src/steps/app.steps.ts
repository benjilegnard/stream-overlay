import { AppPage } from '../pages/app.po';
import { After, AfterAll, Before, Given, Then, When } from 'cucumber';
import { browser, logging } from 'protractor';
import * as expect from 'expect';

let page: AppPage;

Before(() => {
  page = new AppPage();
});

Given(/^I am on the home page$/, async () => {
  return await page.navigateTo();
});

When(/^I do nothing$/, () => {
  return 'success';
});

Then(/^I should see the title$/, async () => {
  const title = await page.getTitleText();
  expect(title).toEqual('stream-overlay app is running!');
});
