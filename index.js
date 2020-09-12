require('dotenv').config()
let express = require('express')
let request = require('request')
let querystring = require('querystring')
// let fs = require('fs')

//console.log(process.env.SPOTIFY_CLIENT_ID,process.env.SPOTIFY_CLIENT_SECRET)
let app = express()

let redirect_uri = 
  process.env.REDIRECT_URI || 
  'http://localhost:8888/callback'

app.get('/login', function(req, res) {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-read-private user-read-email user-library-read user-top-read user-follow-read',
      redirect_uri
    }))
})



app.get('/callback', function(req, res) {

  let code = req.query.code || null
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      //proxy:'https://172.16.2.30:8080',
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }
  //console.log(authOptions)
  request.post(authOptions, function(error, response, body) {
    if (!error){
      var access_token = body.access_token
      var refresh_token = body.refresh_token

      let uri = process.env.FRONTEND_URI || 'http://localhost:3000/main'
      //res.redirect(uri + '?access_token=' + access_token)
      res.redirect(uri + '/?' + querystring.stringify({
        access_token: access_token,
        refresh_token: refresh_token
      }))
    }
    else
      throw error;
    
  })
})

app.get('/refresh_token', function(req, res) {
  let refresh_token = req.query.refresh_token
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      refresh_token,
      grant_type: 'refresh_token'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }

  request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({ access_token });
      }
      else{
        throw error
      }
    });

})



let port = process.env.PORT || 8888
console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`)
app.listen(port)