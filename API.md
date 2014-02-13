# Information publishing system (IPS)

This document describe the different technologies used to build the information publishing system and defines the different API's between the systems components. The system normally consists of three parts.

* Backend - Handle screen administration and content management system (CMS).

* Frontend - Proxy that keeps track of screen status and communicates with the screens. This part of the system is a node.js proxy that communicated with clients through web-sockets.

* Client - Software executing on the screen. This could be javascript running in a browser or a native application.



========================================================================================



### API (CMS)

This is the backend API, which mainly is used by the frontend (proxy) to pull configuration about screens during startup.

#### /api/screen/activate

 * Parameters: { activationCode: '', token: '' }
 * Method: POST
 * Return: HTTP status code
 * Status: __Implemented__

Activate a screen in the backend with the provided on-time activation code and a security token (SHA256) that identifies the screen. If the code is accepted a "200" Success status code and the backend ID for the screen is returned. If not accepted a "403" Forbidden code is returned.

#### /api/screen/get

 * Parameters: { token: '' }
 * Method: POST
 * Return: JSON { statusCode: '', id: '', name: '', groups: [] }
 * Status: __Implemented__

Get information about a given screen based on its secure token. This would be used when a screen re-connects to the system and the frontend does not have information about the screen. If no screen was found "404" Not Found is returned.



========================================================================================



## Node.js (proxy)

Build around a socket.io web-socket communication wrapped in an express 3.x node.js application.

 * Express 3.x
 * Socket.io 0.9.x
 * Redis 0.10.x
 * JSON Web Token (with socket.io extension)
 * Hogan.js

Redis is used as token storages and as cache for content already pushed to the proxy to speed-up content propagation to the screens.

### Node.js (callbacks)

The methods described in this section is used by the proxy self to get basic information about the operational status of the proxy. In other words it's used to create a page that displays if the proxy is running as expected.

#### /

 * Parameters: none
 * Method: GET
 * Return: HTML page(s)
 * Status: __Implemented__

Default page that can be used debug communication problems with the front-end and see status information about proxy.

#### /login

 * Parameters: { username: '', password: '' }
 * Method: POST
 * Return: JSON { statusCode: '', token : '' }
 * Status: __Implemented__

This is the maintenance access to the proxy, which allows the administrator to get information about the proxy and if it's behaving correctly. It holds information about the screens currently connected.

The token given is used to test that the web-socket (socket.io) connection is working on the server.



========================================================================================



### API (used by backend)

This part of the API defines the methods

#### /screen/update

 * Parameters: { token: '', name: '', groups: [ groupID, ..... ] }
 * Type: POST
 * Return: HTTP Status code
 * Status: __Implemented__

Updated screen with new configuration information. This can only be used after a given screen have been activated.

#### /screen/reload

 * Parameters: { screens: [ screenID, ..... ], groups: [ groupID, ..... ] }
 * Method: POST
 * Return: HTTP Status code
 * Status: __Implemented__

Sends signale to the screen to reload the front-end application. Can be used to force reload the application's content and thereby reset connections with the server. The parameters is optional, meaning that either arrays or one of the arrays can be given.

#### /screen/delete

 * Parameters: { token: "" }
 * Method: POST
 * Return: HTTP Status code
 * Status: __Implemented__

Removes a screen form the local redis server. Thereby forcing the backend to be asked about the screens existens on web-socket connection.

#### /push/channel

 * Parameters: { channelID : '', content: {}, groups: [ groupID, ..... ] }
 * Method: POST
 * Return: HTTP Status code
 * Status: __interface ready__

Content JSON:
<pre>
{
  logo: '',
  slides: [
  	{
  	  slideID: '',
  	  title: '',
  	  color: '',
  	  logo: '',
  	  media: {
  	  	image: ['', ..... ],
  	  	video: ['', ..... ]
  	  },
  	  subheadline: '',
  	  text: '',
  	  exposure: '',
  	  layout: '',
  	}, ....
  ]
}
</pre>

#### /push/emergency

 * Parameters: { screens: [], groups: [] }
 * Method: POST
 * Return: HTTP Status code
 * Status: __interface ready__

#### /status

 * Parameters: { screens: [] }
 * Method: POST
 * Return: HTTP Status code
 * Status: __interface ready__



========================================================================================



### API (user by clients)

#### /activate

 * Parameters: { activationCode: '' }
 * Method: POST
 * Return: JSON { statusCode: '', token: '' }
 * Status: __Implemented__

Used to activate a screen in the system, which requires an activation code obtained from the backend system. If the backend system can verify the code, it will return the screen information to the proxy.

If the activation code is valid a encrypted token is returned, which have to be used to connect the screen to the web-socket (socket.io) to authenticate the screen. This token should be reused on re-connecting to the server until an new activation code have been generated in the backend.

#### ready

 * Parameters: { token: '' }
 * Method: event
 * Return: JSON { statusCode: '' }
 * Status: __Implemented__

When the screen have been activated and the socket connection established with the token. This will load screen configuration and start pushing content.

#### pause

 * Parameters: { emergencyAllowed : false }
 * Method: event
 * Return: JSON { statusCode: '' }
 * Status: __Implemented__

Informs that system that the screen dose currently not want to receive content, with the exception of emergency pushed content (can be disable by setting the parameter to false).

Should mostly be used when the screen is being utilised for other purposes or is being debugged.



========================================================================================



## Client



### API



#### ready

 * Parameters: { statusCode: '' }
 * Type: socket.io event
 * Return: None
 * Status: __Implemented__

_Optional_: Used to acknowledge that the command have been received by the server.

#### pause

 * Parameters: { statusCode: '' }
 * Type: socket.io event
 * Return: None
 * Status: __Implemented__

_Optional_: Used to acknowledge that the command have been received by the server.

#### reload

 * Parameters: {}
 * Type: socket.io event
 * Return: None
 * Status: __Implemented__

Reload the application there by re-downloading resources and restarting the connections to the server. Mainly used when it has been detected that the browser has stopped display content.

@see status event.

#### channelPush

 * Parameters: @see /pushChannel
 * Type: socket.io event
 * Return: { statusCode: '' }
 * Status: __interface ready__

#### emergencyPush

 * Parameters:
 * Type: socket.io event
 * Return: { statusCode: '' }
 * Status: __interface ready__

#### status

 * Parameters:
 * Type: socket.io event
 * Return: { uptime: '', channelID: '', slideID: '', lastEvent: '' }
 * Status: __interface ready__

Used to send feedback to the proxy and backend to help detect if the screen is working and is showing the expected content. This will help debug the system and make it possible to automatically notify support about potential issues.
