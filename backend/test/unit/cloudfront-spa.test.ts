import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const spaPath = path.resolve(process.cwd(), "../infra/terraform/cloudfront-spa.js");

function handler() {
  return vm.runInNewContext(`${fs.readFileSync(spaPath, "utf8")}\nhandler`);
}

function event(uri: string, host: string, querystring = "") {
  return {
    request: {
      uri,
      querystring,
      headers: { host: { value: host } },
    },
  };
}

describe("cloudfront SPA function", () => {
  it("leaves API uploads on the same host so they reach EC2, not S3", () => {
    const run = handler();
    const apex = run(event("/api/v1/media", "rezaulkarim.dev"));
    const www = run(event("/api/v1/media", "www.rezaulkarim.dev"));
    expect(apex.uri).toBe("/api/v1/media");
    expect(www.uri).toBe("/api/v1/media");
    expect(apex.statusCode).toBeUndefined();
    expect(www.statusCode).toBeUndefined();
  });

  it("sends www website routes to the apex host", () => {
    const run = handler();
    const redirected = run(event("/admin/portfolio", "www.rezaulkarim.dev"));
    expect(redirected.statusCode).toBe(308);
    expect(redirected.headers.location.value).toBe("https://rezaulkarim.dev/admin/portfolio");
  });

  it("rewrites public SPA paths on the apex host", () => {
    const run = handler();
    const home = run(event("/experience", "rezaulkarim.dev"));
    expect(home.uri).toBe("/index.html");
  });
});
