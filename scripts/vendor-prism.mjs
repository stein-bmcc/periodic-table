import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const packageRoot = new URL("node_modules/prismjs/", root);
const metadata = JSON.parse(
  await readFile(new URL("package.json", packageRoot), "utf8"),
);
const files = [
  "components/prism-core.min.js",
  "components/prism-markup.min.js",
  "plugins/line-numbers/prism-line-numbers.min.js",
];
const sources = await Promise.all(
  files.map((file) => readFile(new URL(file, packageRoot), "utf8")),
);
await mkdir(new URL("js/vendor/", root), { recursive: true });
await writeFile(
  new URL("js/vendor/prism.js", root),
  `/*! Prism ${metadata.version} | MIT | https://prismjs.com/ | core + markup + line numbers */\n${sources.join("\n")}\n`,
);
await writeFile(
  new URL("js/vendor/PRISM-LICENSE.txt", root),
  await readFile(new URL("LICENSE", packageRoot)),
);
