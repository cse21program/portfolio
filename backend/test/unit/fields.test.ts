import { describe, expect, it } from "vitest";
import { slugFromName } from "../../src/modules/fields/fields.types";

describe("field helpers", () => {
  it("builds a kebab-case slug from a name", () => {
    expect(slugFromName("Backend Development")).toBe("backend-development");
    expect(slugFromName("  Cloud Engineering  ")).toBe("cloud-engineering");
  });
});
