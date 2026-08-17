import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, apiUpload } from "@/lib/api";

describe("apiUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("explains an HTML 200 from the website", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<!doctype html><title>site</title>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      ),
    );

    await expect(
      apiUpload("/media?kind=image", new File(["x"], "a.png", { type: "image/png" })),
    ).rejects.toMatchObject({
      name: "ApiRequestError",
      message: "The server sent a web page instead of an upload result",
      status: 200,
      code: "INVALID_RESPONSE",
    } satisfies Partial<ApiRequestError>);
  });

  it("does not follow a redirect to the SPA", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 308,
          headers: { location: "https://rezaulkarim.dev/" },
        }),
      ),
    );

    await expect(
      apiUpload("/media?kind=image", new File(["x"], "a.png", { type: "image/png" })),
    ).rejects.toMatchObject({
      message: "Upload was redirected away from the API",
      status: 308,
    });
  });
});
