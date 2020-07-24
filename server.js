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
      ######################
      # Become a Certificate Authority
      ######################

      # Generate private key
      openssl genrsa -des3 -out myCA.key 2048
      # Generate root certificate
      openssl req -x509 -new -nodes -key myCA.key -sha256 -days 9999 -out myCA.pem

      ######################
      # Create CA-signed certs
      ######################

      NAME=localhost # Use your own domain Name
      # Generate a private key
      openssl genrsa -out $NAME.key 2048
      # Create a certificate-signing request
      openssl req -new -key $NAME.key -out $NAME.csr
      # Create a config file for the extensions
      >$NAME.ext:
        authorityKeyIdentifier=keyid,issuer
        basicConstraints=CA:FALSE
        keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
        subjectAltName = @alt_names
        [alt_names]
        DNS.1 = $NAME # Be sure to include the domain name here because Common Name is not so commonly honoured by itself
        DNS.2 = bar.$NAME # Optionally, add additional domains (I've added a subdomain here)
        IP.1 = 192.168.0.13 # Optionally, add an IP address (if the connection which you have planned requires it)
      # Create the signed certificate
      openssl x509 -req -in $NAME.csr -CA myCA.pem -CAkey myCA.key -CAcreateserial -out $NAME.crt -days 825 -sha256 -extfile $NAME.ext

      ######################
      # Import myCA.pem as an Authority in your Chrome settings (Settings > Manage certificates > Authorities > Import)
      ######################

      ######################
      # Use the $NAME.key file in your server as the private key
      # Use the $NAME.crt file in your server as the certificate
      ######################
    */

    createOptions: {
      // key: nodeModule.fs.readFileSync(fixedPath.httpsAuthDir + "/localhost.key"),
      // cert: nodeModule.fs.readFileSync(fixedPath.httpsAuthDir + "/localhost.crt"),
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
  // nodeModule.bodyParser.text(),
  // nodeModule.bodyParser.json(),
  nodeModule.bodyParser.urlencoded({extended: true}),
  function(req, res, next) { 
    logger.logRequest(req);
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