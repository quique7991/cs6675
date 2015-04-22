# cs6675
## Advanced Internet Computing Systems and Applications

### How to deploy

1. You need the program turnserver. This program is available as a binary via apt-get, or source via http://turnserver.sourceforge.net/. You should then add a user and password to /usr/local/etc/turnserverdb.conf.

	turnserverdb.conf:

		abc:123

2. Generate keys in the directory in which you will run turnserver.

	openssl req -newkey rsa:2048 -new -nodes -x509 -keyout turn_server_key.pem -out turn_server_cert.pem

3. Run turnserver in the directory with your keys. (replace [URL] with the URL or IP of the machine)

	sudo turnserver -v -a -b turnserverdb.conf -r [URL]

4. Create folder for the mongo metadata.

	mkdir mongodata

5. Run mongodb.

	mongod -dbpath mongodata

6. Locate and run the signaler which is part of the project. For this, you will need to install nodejs. If there are any errors running the signaler pertaining to missing packages installable via npm, install them as well.

	node signaler.js

7. If necessary, open ports 12034, 12035, and 3000 to your machine, and visit [URL]:3000 in a browser to access the application. (replace [URL] with the URL or IP of your machine)

-----

### Useful notes

To limit the maximum number of connections we can use:

rtcMultiConnection.maxParticipantsAllowed = <Desired Value>

### Best step by step simple example

https://bitbucket.org/webrtc/codelab/src/c75c8e837a125441d2ee008c55348ac5a24a85d4/README.md?at=master

Other references

https://github.com/webrtc/samples

http://www.webrtc.org/

http://www.kurento.org/docs/current/index.html

http://bem.tv/files/Towards_the_Application_of_WebRTC_Peer-to-Peer_to_Scale_Live_Video_Streaming_over_the_Internet.pdf

https://www.npmjs.com/package/webrtc-scalable-broadcast

https://jitsi.org/

https://jitsi.org/Projects/JitsiVideobridge

https://www.webrtc-experiment.com/RTCMultiConnection/

http://www.peer-server.com/

http://www.tokbox.com/blog/mantis-next-generation-cloud-technology-for-webrtc/

http://www.html5rocks.com/en/tutorials/webrtc/basics/

https://www.webrtc-experiment.com/docs/TURN-server-installation-guide.html

###To generate key pairs with openssl:

openssl req -newkey rsa:2048 -new -nodes -x509 -keyout key.pem -out cert.pem

###TURN:

trixie.no-ip.info:12035

###Running the TURN server:

sudo turnserver -v -a -b turnserverdb.conf -r trixie.no-ip.info

###Running the mongodb:

mongod --dbpath mongodata

https://plugin.temasys.com.sg/demo/samples/web/content/peerconnection/trickle-ice/index.html

https://webrtchacks.com/rfc5766-turn-server/
