import { describe, expect, it } from "vitest";
import { matchPlatform, toHref, toInputValue } from "@/features/about/linkPlatforms";

describe("linkPlatforms", () => {
  it("turns a GitHub username into a profile URL", () => {
    const github = matchPlatform({ label: "GitHub", href: "https://github.com/swe-rezaul-karim" });
    expect(github.id).toBe("github");
    expect(toHref("swe-rezaul-karim", github)).toBe("https://github.com/swe-rezaul-karim");
    expect(toInputValue("https://github.com/swe-rezaul-karim", github)).toBe("swe-rezaul-karim");
  });

  it("keeps a pasted full URL", () => {
    const github = matchPlatform({ label: "GitHub", href: "" });
    expect(toHref("https://github.com/swe-rezaul-karim", github)).toBe(
      "https://github.com/swe-rezaul-karim",
    );
  });

  it("turns a website domain into an https URL", () => {
    const website = matchPlatform({ label: "Website", href: "https://rezaul.dev" });
    expect(website.id).toBe("website");
    expect(toHref("rezaul.dev", website)).toBe("https://rezaul.dev");
    expect(toHref("https://rezaul.dev/about", website)).toBe("https://rezaul.dev/about");
    expect(toHref("http://rezaul.dev", website)).toBe("https://rezaul.dev");
    expect(toInputValue("https://rezaul.dev", website)).toBe("rezaul.dev");
  });

  it("normalizes email addresses", () => {
    const email = matchPlatform({ label: "Email", href: "mailto:hello@rezaul.dev" });
    expect(toHref("hello@rezaul.dev", email)).toBe("mailto:hello@rezaul.dev");
    expect(toInputValue("mailto:hello@rezaul.dev", email)).toBe("hello@rezaul.dev");
  });
});
