var init = {
  httpPort: 80,
  httpsPort: 443,
  forcedHttps: true,
  version: "0.1",
};


var nodeModule = {
  express: require("express"),
  fs: require("fs"),
  http: require("http"),
  https: require("https"),
  cors: require("cors"),
  bodyParser: require("body-parser"),
};

var fixedPath = {
  httpsAuthDir: "/projects/ahk_node",
};

var server = {
  app: nodeModule.express(),
  http: {
    port: init.httpPort,
  },
  https: {
    port: init.httpsPort,
    /*
      openssl genrsa -out key.pem
      openssl req -new -key key.pem -out csr.pem
      openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
      rm csr.pem
    */
    createOptions: {
      key: nodeModule.fs.readFileSync(fixedPath.httpsAuthDir + "/key.pem"),
      cert: nodeModule.fs.readFileSync(fixedPath.httpsAuthDir + "/cert.pem"),
    },
    forced: init.forcedHttps,
  },
  version: init.version,
};

var ahk = {};

function Logger() {

  this.logRequest = function(req) {
    if (!/\/favicon\.ico/.test(req.originalUrl)) {
      var date = new Date();
      this.log(
        date.toLocaleString() +
        " - " + req.method + " '" + req.originalUrl + "'" +
        " - Protocol: " + req.protocol + 
        " - Origin: " + req.get("Origin"));
    }
  };

  this.log = function(msg) {
    console.log("Log:", msg);
  };

  this.error = function(msg) {
    console.error("Error:", msg);
  };
}

var logger = new Logger();

// Middleware
server.app.use([
  nodeModule.cors(),
  nodeModule.bodyParser.text(),
  // nodeModule.bodyParser.json(),
  function(req, res, next) { 
    logger.logRequest(req);
    res.type("txt");
    next(); 
  },
]);

server.app.use(/^\/.+/, 

  function(req, res, next) {
    if (server.https.forced && req.protocol != "https") {
      next("Only HTTPS communication permitted.");
    } else {
      next();
    }
  }, 

  function(err, req, res, next) {
    logger.error(err, "\n");
    res.status(401);
    res.end(err);
  });

/*
  $.ajax('https://localhost/?data=message', {
    type: 'get',
    contentType: 'text/plain'
  });
*/
// console.log(req.query.data); // "message"
/*
  $.ajax('https://localhost', {
    type: 'post',
    data: 'message',
    contentType: 'text/plain'
  });
*/
// server.app.use(require("body-parser").text());
// console.log(req.body); // "message"

/*
  $.ajax('https://localhost', {
    type: 'post',
    data: JSON.stringify({
      a: 1,
      b: 2
    }),
    contentType: 'application/json'
  });
*/
// );
// console.log(JSON.parse(req.body)); // { a: 1, b: 2}

server.app.use(require("body-parser").urlencoded());

server.app.post("/", function(req, res) {
  console.log("Protocol:", req.protocol)
  console.log(req.headers);
  console.log(req.body);
  res.end("");

});
server.app.get("/", function(req, res) {
  console.log("Protocol:", req.protocol)
  console.log(req.headers);
  console.log(req.body);

  res.end("");

});

nodeModule.http.createServer(server.app).listen(server.http.port);
nodeModule.https.createServer(server.https.createOptions, server.app).listen(server.https.port);