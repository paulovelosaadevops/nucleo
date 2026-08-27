import fs from "node:fs";
import path from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";

const roots = [
  path.resolve(import.meta.dirname, ".."),
  path.resolve(import.meta.dirname, "../../public"),
];

const extensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".html",
]);

const brokenPatterns = [
  "\\" + "u00",
  "\\" + "u0",
  String.fromCharCode(0x00c3),
  String.fromCharCode(0x00c2),
  String.fromCharCode(0xfffd),
];

function collectFiles(directory: string): string[] {
  return fs.readdirSync(directory, {
    withFileTypes: true,
  }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(fullPath);
    }

    return extensions.has(path.extname(entry.name))
      ? [fullPath]
      : [];
  });
}

describe("frontend text encoding", () => {
  it("does not keep visible unicode escapes or mojibake in messages", () => {
    const offenders = roots
      .flatMap(collectFiles)
      .flatMap((filePath) => {
        const content = fs.readFileSync(filePath, "utf8");

        return brokenPatterns
          .filter((pattern) => content.includes(pattern))
          .map((pattern) => ({
            filePath,
            pattern,
          }));
      });

    expect(offenders).toEqual([]);
  });
});
