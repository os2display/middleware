This is middleware for the information publishing system and is a node.js application with API's to frontend and backend applications.

For information about the API, please the see API.md file.

Its build around socket.io and express 3.x framework utilising Redis to store cache and system configuration information from the backend.

 * Express 3.x
 * Socket.io 0.9.x
 * Redis 0.10.x
 * JSON Web Token (with socket.io extension)
 * Hogan.js

# Installation
The middleware will run on a no standard port (default 3000), so the application will need to be proxied through nginx so it can be access via port 80. We use nginx as it's the only one currently able to proxy web-socket connections. For more information about configuring proxy se the frontend README file.

First install Redis and node (version 0.10.25 as of this writing) then clone the application and run the command below to install the node modules required:
<pre>
  ~$ npm install
</pre>

# Configuration
Next configured the application by copying the exsample.config.json to config.json.
<pre>
 ~$ cp exsample.config.json config.json
</pre>

Edit the config.json file to match your setup.

# Run
To run the application you simply execute it.
<pre>
 ~$ ./app.js
</pre>

In a server environment you can used the _forever_ node.js application to run the process in the background and ensure it's restarted on errors. See http://blog.nodejitsu.com/keep-a-nodejs-server-up-with-forever/ for more information about forever.