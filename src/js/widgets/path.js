define(function (require, exports, module) {
  var $ = require('$');
  var $head = $("head");
  var $base = $head.children("base");

  var Path = {
    urlParseRE: /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/,
    isSameDomain: function (absUrl1, absUrl2) {
      return Path.parseUrl(absUrl1).domain === Path.parseUrl(absUrl2).domain;
    },
    //Returns true for any relative variant.
    isRelativeUrl: function (url) {
      // All relative Url variants have one thing in common, no protocol.
      return Path.parseUrl(url).protocol === "";
    },

    //Returns true for an absolute url.
    isAbsoluteUrl: function (url) {
      return Path.parseUrl(url).protocol !== "";
    },
    parseLocation: function () {
      return this.parseUrl(this.getLocation());
    },
    getLocation: function (url) {
      var uri = url ? this.parseUrl(url) : location,
        hash = this.parseUrl(url || location.href).hash;

      // mimic the browser with an empty string when the hash is empty
      hash = hash === "#" ? "" : hash;

      // Make sure to parse the url or the location object for the hash because using location.hash
      // is autodecoded in firefox, the rest of the url should be from the object (location unless
      // we're testing) to avoid the inclusion of the authority
      return uri.protocol + "//" + uri.host + uri.pathname + uri.search + hash;
    },
    makeUrlAbsolute: function (relUrl, absUrl) {
      if (!Path.isRelativeUrl(relUrl)) {
        return relUrl;
      }

      if (absUrl === undefined) {
        absUrl = documentBase;
      }

      var relObj = Path.parseUrl(relUrl),
        absObj = Path.parseUrl(absUrl),
        protocol = relObj.protocol || absObj.protocol,
        doubleSlash = relObj.protocol ? relObj.doubleSlash : ( relObj.doubleSlash || absObj.doubleSlash ),
        authority = relObj.authority || absObj.authority,
        hasPath = relObj.pathname !== "",
        pathname = Path.makePathAbsolute(relObj.pathname || absObj.filename, absObj.pathname),
        search = relObj.search || ( !hasPath && absObj.search ) || "",
        hash = relObj.hash;

      return protocol + doubleSlash + authority + pathname + search + hash;
    },
    parseLocation: function () {
      return this.parseUrl(this.getLocation());
    },
    parseUrl: function (url) {
      // If we're passed an object, we'll assume that it is
      // a parsed url object and just return it back to the caller.
      if (typeof(url) === "object") {
        return url;
      }

      var matches = Path.urlParseRE.exec(url || "") || [];

      // Create an object that allows the caller to access the sub-matches
      // by name. Note that IE returns an empty string instead of undefined,
      // like all other browsers do, so we normalize everything so its consistent
      // no matter what browser we're running on.
      return {
        href: matches[  0 ] || "",
        hrefNoHash: matches[  1 ] || "",
        hrefNoSearch: matches[  2 ] || "",
        domain: matches[  3 ] || "",
        protocol: matches[  4 ] || "",
        doubleSlash: matches[  5 ] || "",
        authority: matches[  6 ] || "",
        username: matches[  8 ] || "",
        password: matches[  9 ] || "",
        host: matches[ 10 ] || "",
        hostname: matches[ 11 ] || "",
        port: matches[ 12 ] || "",
        pathname: matches[ 13 ] || "",
        directory: matches[ 14 ] || "",
        filename: matches[ 15 ] || "",
        search: matches[ 16 ] || "",
        hash: matches[ 17 ] || ""
      };
    },
    isEmbeddedPage: function (url) {
      var u = Path.parseUrl(url);

      //if the path is absolute, then we need to compare the url against
      //both the documentUrl and the documentBase. The main reason for this
      //is that links embedded within external documents will refer to the
      //application document, whereas links embedded within the application
      //document will be resolved against the document base.
      if (u.protocol !== "") {
        return ( u.hash && ( u.hrefNoHash === this.documentUrl.hrefNoHash || ( this.documentBaseDiffers && u.hrefNoHash === this.documentBase.hrefNoHash ) ) );
      }
      return ( /^#/ ).test(u.href);
    },
    convertUrlToDataUrl: function (absUrl) {
      var u = this.parseUrl(absUrl);
      if (this.isEmbeddedPage(u)) {
        // For embedded pages, remove the dialog hash key as in getFilePath(),
        // otherwise the Data Url won't match the id of the embedded Page.
        return u.hash.replace(/^#/, "");
      } else if (this.isSameDomain(u, this.documentBase)) {
        return u.hrefNoHash.replace(this.documentBase.domain, "");
      }

      return window.decodeURIComponent(absUrl);
    }
  };
  Path.documentUrl = Path.parseLocation();
  Path.documentBase = $base.length ? Path.parseUrl(Path.makeUrlAbsolute($base.attr("href"), Path.documentUrl.href)) : Path.documentUrl;
  Path.documentBaseDiffers = ( Path.documentUrl.hrefNoHash !== Path.documentBase.hrefNoHash );

  return Path;
});