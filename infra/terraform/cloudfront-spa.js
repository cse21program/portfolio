function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var hostHeader = request.headers.host && request.headers.host.value;
  var host = hostHeader ? hostHeader.split(":")[0] : "";

  if (
    host &&
    host.indexOf("www.") !== 0 &&
    host.indexOf(".") !== -1 &&
    host.indexOf("cloudfront.net") === -1 &&
    host.indexOf("amazonaws.com") === -1
  ) {
    var location = "https://www." + host + (uri === "/" ? "" : uri);
    if (request.querystring) {
      location += "?" + request.querystring;
    }
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: location },
      },
    };
  }

  if (uri.indexOf("/api/") === 0) {
    return request;
  }

  if (uri === "/") {
    request.uri = "/index.html";
    return request;
  }

  if (uri.charAt(uri.length - 1) === "/") {
    request.uri = uri + "index.html";
    return request;
  }

  if (uri.indexOf(".") === -1) {
    request.uri = "/index.html";
  }

  return request;
}
