var path = require('path');
var qs = require('querystring');

//var async = require('async');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var express = require('express');
var logger = require('morgan');
var jwt = require('jwt-simple');
var moment = require('moment');
var mongoose = require('mongoose');
var request = require('request');
var http = require('http');

var config = require('./config');

var roomSchema = new mongoose.Schema({
  room_id: String,
  room_displayName: String,
  room_type: String,
  creater: String,
  room_location: [Number]
});

var friendSchema = new mongoose.Schema({
  friend_email: String,
  name: String
});

var userStatusSchema = new mongoose.Schema({
  stat: String,
  currlocation: [Number]
});

var userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false },
  displayName: String,
  friends: [friendSchema],
  infos:[userStatusSchema]
});

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(user.password, salt, function(err, hash) {
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(password, done) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    done(err, isMatch);
  });
};

var User = mongoose.model('User', userSchema);
var Status = mongoose.model('Status', userStatusSchema);
var Friends = mongoose.model('Friends', friendSchema);
var Room = mongoose.model('Room', roomSchema);

mongoose.connect(config.MONGO_URI);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

var app = express();

//var server = require('http').createServer(app);

//app.set('port', process.env.PORT || 3000);
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));

var port = 12034; // change it to 443

var fs = require('fs');

var _static = require('node-static');
var file = new _static.Server('./public');

// for HTTP-only

var http = require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        if (request.url.search(/.png|.gif|.js|.css/g) == -1) {
            file.serveFile('/index.html', 402, {}, request, response);
        } else file.serve(request, response);
    }).resume();
}).listen(port);
//

//
/*
var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};
*/
//


var options = {
    key: fs.readFileSync('privatekey.pem'),
    cert: fs.readFileSync('certificate.pem')
};


/*
var https = require('https').createServer(options, function (request, response) {
    request.addListener('end', function () {
        if (request.url.search(/.png|.gif|.js|.css/g) == -1) {
            file.serveFile('/index.html', 402, {}, request, response);
        } else file.serve(request, response);
    }).resume();
}).listen(port);
*/

var CHANNELS = {};

var WebSocketServer = require('websocket').server;

/*
new WebSocketServer({
    httpServer: http,
    autoAcceptConnections: false
}).on('request', onRequest);
*/

new WebSocketServer({
    httpServer: http,
    autoAcceptConnections: false
}).on('request', onRequest);

function onRequest(socket) {
    var origin = socket.origin + socket.resource;

    var websocket = socket.accept(null, origin);

    websocket.on('message', function (message) {
        if (message.type === 'utf8') {
            onMessage(JSON.parse(message.utf8Data), websocket);
        }
    });

    websocket.on('close', function () {
        truncateChannels(websocket);
    });
}

function onMessage(message, websocket) {
    if (message.checkPresence)
        checkPresence(message, websocket);
    else if (message.open)
        onOpen(message, websocket);
    else
        sendMessage(message, websocket);
}

function onOpen(message, websocket) {
    var channel = CHANNELS[message.channel];

    if (channel)
        CHANNELS[message.channel][channel.length] = websocket;
    else
        CHANNELS[message.channel] = [websocket];
}

function sendMessage(message, websocket) {
    message.data = JSON.stringify(message.data);
    var channel = CHANNELS[message.channel];
    if (!channel) {
        console.error('no such channel exists');
        return;
    }

    for (var i = 0; i < channel.length; i++) {
        if (channel[i] && channel[i] != websocket) {
            try {
                channel[i].sendUTF(message.data);
            } catch (e) {}
        }
    }
}

function checkPresence(message, websocket) {
    websocket.sendUTF(JSON.stringify({
        isChannelPresent: !! CHANNELS[message.channel]
    }));
}

function swapArray(arr) {
    var swapped = [],
        length = arr.length;
    for (var i = 0; i < length; i++) {
        if (arr[i])
            swapped[swapped.length] = arr[i];
    }
    return swapped;
}

function truncateChannels(websocket) {
    for (var channel in CHANNELS) {
        var _channel = CHANNELS[channel];
        for (var i = 0; i < _channel.length; i++) {
            if (_channel[i] == websocket)
                delete _channel[i];
        }
        CHANNELS[channel] = swapArray(_channel);
        if (CHANNELS && CHANNELS[channel] && !CHANNELS[channel].length)
            delete CHANNELS[channel];
    }
}

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function ensureAuthenticated(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }
  var token = req.headers.authorization.split(' ')[1];
  var payload = jwt.decode(token, config.TOKEN_SECRET);
  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: 'Token has expired' });
  }
  req.user = payload.sub;
  next();
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createToken(user) {
  var payload = {
    sub: user._id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}

/*
 |--------------------------------------------------------------------------
 | GET /api/me
 |--------------------------------------------------------------------------
 */
app.get('/api/me', ensureAuthenticated, function(req, res) {
  User.findById(req.user, function(err, user) {
    res.send(user);
  });
});

/*
 |--------------------------------------------------------------------------
 | GET /api/users
 |--------------------------------------------------------------------------
 */
 app.get('/api/users/:email', function(req, res) {
  User.findOne({email: req.params.email },function(err,users){
    if (err)
      res.send(err)
    console.log(users);
    res.send(users); 
  });

 });
/*
 |--------------------------------------------------------------------------
 | GET /api/friends
 |--------------------------------------------------------------------------
 */
 app.get('/api/friends/:email', function(req, res) {
  User.find({email: req.params.email },function(err,friends){
    if (err)
      res.send(err)
    console.log(friends);
    res.send(friends); 
  });

 });

 /*
 |--------------------------------------------------------------------------
 | POST  /api/friends
 |--------------------------------------------------------------------------
 */
 app.post('/api/friends', function(req, res) {
  console.log("here");
  console.log(req.body.email)
    User.findOne({ email: req.body.curremail }, function(err, user) {
      user.friends.push({friend_email: req.body.email,name: req.body.fname})
      user.save(function(err) {
      res.status(200).end();
    });
  });
});

  /*
 |--------------------------------------------------------------------------
 | POST  /api/room
 |--------------------------------------------------------------------------
 */
 app.post('/api/room', function(req, res) {
  console.log(req.body.roomName)
    var room = new Room({
      room_id: req.body.roomId,
      room_displayName: req.body.roomName,
      room_type: req.body.roomType,
      creater: req.body.creater,
      room_location: req.body.roomLocation
    });
    room.save(function(err) {
      res.status(200).end();
    });
});

   /*
 |--------------------------------------------------------------------------
 | POST  /api/roomremove
 |--------------------------------------------------------------------------
 */
 app.post('/api/roomremove', function(req, res) {
    Room.findOne({ room_id: req.body.uuid }, function(err, room) {
      if (room === null) {
		  console.log('removing non-existant room');
		  res.status(200).end();
	  }
      room.remove()
      room.save(function(err) {
      res.status(200).end();
    });
  });
});

    /*
 |--------------------------------------------------------------------------
 | GET  /api/room
 |--------------------------------------------------------------------------
 */
 app.get('/api/room/:email', function(req, res) {
    Room.find(function(err, room) {

      console.log(room)
      res.send(room); 
  });
  /*var query = Room.find();
    query.where({room_type: 'public'})
    query.exec(function(err, rooms) {
      if (err) return next(err);
      res.send(rooms);
    });*/

});


/*
 |--------------------------------------------------------------------------
 | PUT /api/me
 |--------------------------------------------------------------------------
 */
app.put('/api/me', ensureAuthenticated, function(req, res) {
  User.findById(req.user, function(err, user) {
    if (!user) {
      return res.status(400).send({ message: 'User not found' });
    }
    user.displayName = req.body.displayName || user.displayName;
    user.email = req.body.email || user.email;
    user.save(function(err) {
      res.status(200).end();
      console.log(err)
    });
  });
});

/*
 |--------------------------------------------------------------------------
 | Put /api/location
 |--------------------------------------------------------------------------
 */
app.put('/api/location', function(req, res) {
  User.findOne({ email: req.body.email }, function(err, user) {
      console.log(req.body.lon)
      console.log(user._id)
      user.infos.set(0, {currlocation: [req.body.lon, req.body.lat]});
      //user.infos.remove({currlocation})
      //user.infos.push({currlocation: [req.body.lon, req.body.lat]})
      //user.infos.set({currlocation: [req.body.lon, req.body.lat]})
      user.save(function(err) {
      res.status(200).end();
    });
  });
});




/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */
app.post('/auth/login', function(req, res) {
  User.findOne({ email: req.body.email }, '+password', function(err, user) {
    if (!user) {
      return res.status(401).send({ message: 'Wrong email and/or password' });
    }
    user.comparePassword(req.body.password, function(err, isMatch) {
      if (!isMatch) {
        return res.status(401).send({ message: 'Wrong email and/or password' });
      }
    
      res.send({ token: createToken(user) });
    });
  });
});

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
app.post('/auth/signup', function(req, res) {
  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      return res.status(409).send({ message: 'Email is already taken' });
    }

    var ustatus = new Status({
      currlocation: [0.0,0.0]
    });
    var user = new User({
      displayName: req.body.displayName,
      email: req.body.email,
      password: req.body.password,
      infos: [ustatus]

    });
    console.log(user)
    user.save(function() {
      res.send({ token: createToken(user) });
    });
  });
});


/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */
app.get('/auth/unlink/:provider', ensureAuthenticated, function(req, res) {
  var provider = req.params.provider;
  User.findById(req.user, function(err, user) {
    if (!user) {
      return res.status(400).send({ message: 'User not found' });
    }
    user[provider] = undefined;
    user.save(function() {
      res.status(200).end();
    });
  });
});

app.get('*', function(req, res) {
  res.redirect('/#' + req.originalUrl);
});

/*
 |--------------------------------------------------------------------------
 | Start the Server
 |--------------------------------------------------------------------------
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

console.log('listening both websocket and HTTPs at port 12034');
