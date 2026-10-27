import { readFile } from "node:fs/promises";

const host = "www.clinic-flow.co.il";
const origin = `https://${host}`;
const key = "e5a2e20bb14ca33d9c919d6428fb183b";
const keyLocation = `${origin}/${key}.txt`;

const defaultPaths = [
  "/",
  "/features",
  "/pricing",
  "/clinic-software-for-private-doctors",
  "/clinic-software-no-subscription",
  "/clinic-software-one-time-payment",
  "/offline-clinic-software",
  "/contact",
];

const requested = process.argv.slice(2);
const paths = requested.length > 0 ? requested : defaultPaths;
const urlList = [...new Set(paths.map((value) => new URL(value, origin).href))];

if (urlList.some((url) => new URL(url).host !== host)) {
  throw new Error(`IndexNow URLs must belong to ${host}`);
}

const hostedKey = (await readFile(new URL(`../public/${key}.txt`, import.meta.url), "utf8")).trim();
if (hostedKey !== key) throw new Error("IndexNow key file does not match the configured key");

const response = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow rejected the submission (${response.status}): ${await response.text()}`);
}

console.log(`IndexNow accepted ${urlList.length} updated ClinicFlow URLs (${response.status}).`);
