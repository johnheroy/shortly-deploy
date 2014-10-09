var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config').connection;
var User = require('../app/models/user');
var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  })
};


exports.navToLink = function(req, res) {
  var linkQuery = Link.where({code: req.params[0]});
  linkQuery.findOne(function(err, link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.visits += 1;
      link.save();
      res.redirect(link.url);
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var userQuery = User.where({username: username});

  userQuery.findOne(function(err, user){
    if (err) throw err;
    if (!user){
      res.redirect('/login');
    } else {
      user.comparePassword(password, function(err, match) {
        console.log(match, 'MATCHHHHHH')
        if (match) {
          util.createSession(req, res, user);
          res.redirect('/');
        } else {
          res.redirect('/login');
        }
      })
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password

  var userQuery = User.where({username:username});

  userQuery.findOne(function(err, user){
    if (err) throw err;
    if (!user) {
      var newUser = new User({
        username: username,
        password: password
      });
      newUser.save( function(err, newUser){
        util.createSession(req,res,newUser);
      })
    }else{
      console.log('Account already exists');
      res.redirect('/signup');
    }
  })
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  var linkQuery = Link.where({url:uri});

  linkQuery.findOne(function(err, link) {
    if (err) throw err;
    if (link) {
      res.send(200, link);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save(function(err, newLink) {
          if (err) return console.log(err);
          console.log(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
};
