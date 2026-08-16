function handler(event) {
  var request = event.request;
  var uri = request.uri;

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
