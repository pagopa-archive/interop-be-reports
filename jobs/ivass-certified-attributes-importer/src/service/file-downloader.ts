import * as puppeteer from "puppeteer";
import * as fs from "fs"
import * as zip from "@zip.js/zip.js"
import { SourceFileConfig } from "../config/sourcefile.config.js";
import { AwsS3BucketClient } from "@interop-be-reports/commons";

const initBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    slowMo: 50,
  });
  return browser;
};

const openPage = async (page: puppeteer.Page, sourceUrl: string): Promise<void> => {
  await page.goto(sourceUrl);
  await delay(10000);
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const findDownloadButton = async (page: puppeteer.Page) => {
  const table = await page.$("html > body > inquiry-root > #sub-navbar > inquiry-area-download > [class='card'] > inquiry-grid > ag-grid-angular > [ref='eRootWrapper'] > [ref='rootWrapperBody'] > [ref='gridPanel']");
  const row = await table?.$("[ref='eBodyViewport'] > [ref='eCenterColsClipper'] > [ref='eCenterViewport'] > [ref='eCenterContainer'] > [row-index='3']");
  const csvButton = await row?.$("[col-id='csv'] > inquiry-pdf-csv > div > img");
  return csvButton
};

const setupDownload = async (page: puppeteer.Page, outputDir: string): Promise<void> => {
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: outputDir });
};

const unzipFile = async (zipFileName: string, outputDir: string): Promise<string> => {
  const zipFile = await fs.promises.readFile(`${outputDir}/${zipFileName}`);
  const zipBlob = new Blob([zipFile], { type: 'application/zip' });

  const entries = await (new zip.ZipReader(new zip.BlobReader(zipBlob))).getEntries({ filenameEncoding: 'utf-8' });
  const csvEntries = entries.filter(entry => entry.filename.endsWith('.csv'));

  if (csvEntries.length === 0)
    throw new Error('The archive does not contain csv files');

  if (csvEntries.length > 1)
    throw new Error('The archive contains multiple csv files');

  const entry = entries[0]

  if (!entry.getData)
    throw new Error('Unexpected error: getData method is undefined');

  const entryBlob: Blob = await entry.getData(new zip.BlobWriter());
  const arrayBuffer = await entryBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const dest = `${outputDir}/${entry.filename}`;
  fs.writeFileSync(dest, buffer);

  return dest
}

const downloadFile = async <T>(csvButton: puppeteer.ElementHandle<T>, outputDir: string): Promise<string> => {
  await csvButton.click();
  await delay(5000);

  const files = await fs.promises.readdir(outputDir);
  const zipFiles = files.filter(fileName => fileName.endsWith('.zip'));
  if (zipFiles.length === 0)
    throw Error('No files found in download folder');

  return zipFiles[0]
};

export const downloadCSV = async (awsS3BucketClient: AwsS3BucketClient, config: SourceFileConfig): Promise<string> => {
  const browser = await initBrowser();
  const page = await browser.newPage();

  await openPage(page, config.sourceUrl);
  const csvButton = await findDownloadButton(page);
  await setupDownload(page, config.outputDir);

  if (!csvButton)
    throw Error('Download button not found');

  const fileName = await downloadFile(csvButton, config.outputDir);

  const zipFile = await fs.promises.readFile(`${config.outputDir}/${fileName}`)
  await awsS3BucketClient.uploadBinaryData(zipFile, `organizations/${fileName}`)

  const csvPath = await unzipFile(fileName, config.outputDir);
  const fileContent = await fs.promises.readFile(csvPath)

  await browser.close();

  return fileContent.toString();
}
