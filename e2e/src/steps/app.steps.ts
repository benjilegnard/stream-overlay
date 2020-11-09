import { AppPage } from '../pages/app.po';
import { After, AfterAll, Before, Given, Then, When } from 'cucumber';
import { browser, logging } from 'protractor';
import * as expect from 'expect';

let page: AppPage;

Before(() => {
  page = new AppPage();
});

Given(/^I am on the home page$/, async () => {
  await page.navigateTo();
});

When(/^I do nothing$/, () => {});

Then(/^I should see the title$/, async () => {
  expect(await page.getTitleText()).toEqual('stream-overlay app is running!');
});
