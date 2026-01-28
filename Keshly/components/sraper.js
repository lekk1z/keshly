import { parse } from "fast-html-parser";

export async function scrape(url) {
  const response = await fetch(url);
  const html = await response.text();
  const root = parse(html);
  // Example: get text inside first <pre> tag
  const pre = root.querySelector("pre");
  const table = pre ? pre.text : "";
  console.log(table);
  return table;
}
