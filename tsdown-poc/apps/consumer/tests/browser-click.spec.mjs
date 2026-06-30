import { expect, test } from "playwright/test";

test("lazy counter resumes and handles clicks", async ({ page }) => {
  const consoleIssues = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.stack ?? error.message);
  });

  await page.goto("/", { waitUntil: "networkidle" });

  const count = page.getByTestId("poc-count");
  const button = page.getByTestId("poc-increment");

  await expect(count).toHaveText("Count: 2");
  await expect(button).toHaveAttribute("on:click", /#/);

  await button.click();
  await expect(count).toHaveText("Count: 5", { timeout: 10_000 });
  await page.waitForTimeout(250);

  expect(pageErrors, "uncaught page exceptions").toEqual([]);
  expect(consoleIssues, "browser console warnings/errors").toEqual([]);
});
