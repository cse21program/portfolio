import { describe, expect, it } from "vitest";
import { parseTopicLinks, parseTopicSnippets } from "../../src/modules/topics/topics.types";

describe("topic helpers", () => {
  it("keeps labeled links and drops empty rows", () => {
    expect(
      parseTopicLinks([
        { label: "Docs", url: "https://docs.example.com" },
        { label: " ", url: "https://skip.example.com" },
      ]),
    ).toEqual([{ label: "Docs", url: "https://docs.example.com" }]);
  });

  it("keeps code snippets with a language fallback", () => {
    expect(
      parseTopicSnippets([
        { label: "DTO", language: "java", code: "record User(String id) {}" },
        { code: "" },
      ]),
    ).toEqual([{ label: "DTO", language: "java", code: "record User(String id) {}" }]);
  });
});
