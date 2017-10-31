const uuidv4 = require("uuid/v4");
const fs = require('fs')
const request = require('request')
const querystring = require('querystring')

const client_id = 'eca64d2d78294597b599f2dff2cf9588'; // Your client id
const client_secret = '5637221e21e0453d895fef37f09cc18d'; // Your secret
const redirect_uri = 'http://localhost:3000/return'; // Your redirect uri

const readTokens = () => {
  // Check if we have an access token
  let tokens = null;
  try {
    tokens = fs.readFileSync("access.json").toString();
    tokens = JSON.parse(tokens)
  } catch (e) {
    console.log("Can't load tokens", e.message)
  }
  return tokens;
}

const hasToken = (req, res) => {
  // Check if we have an access token
  let tokens = readTokens();

  if (tokens) {
    return res.json({
      success: true,
      accessToken: tokens.access_token
    });
  }
  return res.json({
    success: false,
    error: "No tokens"
  })
}

const redirector = (req, res) => {
  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  var state = uuidv4();
  // Save state
  fs.writeFileSync("state.txt", state)

  let url = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state
    });

    res.redirect(url)
}

const returny = (req, res) => {
  // Handle end results
  if (req.query.error) {
    return res.json({ error: req.query.error, success: false })
  }

  // your application requests refresh and access tokens
  // after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = fs.readFileSync("state.txt").toString() || null;

  if (state === null || state !== storedState) {
    return res.json({
      success: false,
      error: `state_mismatch ${state} vs ${storedState}`
    })
  }

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {

      var access_token = body.access_token,
        refresh_token = body.refresh_token;

      fs.writeFileSync("access.json", JSON.stringify({ access_token, refresh_token }))
      res.redirect("/")
    }
  });
}

const useRefreshToken = (req, res) => {
    // requesting access token from refresh token
    let tokens = readTokens();
    if (!tokens) {
      return res.send({success: false, error: "No tokens file found!"})
    }

    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        // Write new values
        fs.writeFileSync("access.json", JSON.stringify( { access_token, refresh_token: tokens.refresh_token } ))

        res.send({
          'success': true,
          'accessToken': access_token
        });
      } else {
        res.send({
          success: false
        })
      }
    });
}

module.exports = { redirector, returny, hasToken, useRefreshToken };