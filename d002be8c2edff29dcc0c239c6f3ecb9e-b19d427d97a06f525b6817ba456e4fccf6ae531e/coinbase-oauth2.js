const express = require("express");
const axios = require('axios');
const qs = require('qs');

const app = express();

const CLIENT_ID = "";
const CLIENT_SECRET = "";

// should match the value in the button URL
const SECRET = "SECURE_KEY" // to make sure the callback response is coming from a legitimate source i.e. coinbase
const REDIRECT_URI = "http://localhost:3006/callback"

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

let accessToken = ""
let refreshToken = ""

app.set('view engine', 'ejs');

app.get("/", async (req, res) => {
  res.render("index.ejs")
});

// User gets redirected to this endpoint on successful login
app.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (state === SECRET) {
    const data = qs.stringify({
      'grant_type': 'authorization_code',
      'code': code,
      'client_id': CLIENT_ID,
      'client_secret': CLIENT_SECRET,
      'redirect_uri': REDIRECT_URI
    });
    const config = {
      method: 'post',
      url: 'https://api.coinbase.com/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data
    };

    try {
      const response = await axios(config);

      // saving tokens for other requests
      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token;

      res.send({ response: response?.data });
    } catch (e) {
      console.log("Could not trade code for tokens", e.response.data)
    }
  }
});

// Gets the user details
app.get("/user", async (req, res) => {
  const config = {
    method: 'get',
    url: 'https://api.coinbase.com/v2/user',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };

  try {
    const response = await axios(config);
    res.send({ response: response?.data })
  } catch (e) {
    console.log("Could not get user", e.response.data)
  }
});

// Gets the primary account for BTC
app.get("/account", async (req, res) => {
  const config = {
    method: 'get',
    url: 'https://api.coinbase.com/v2/accounts/BTC',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };

  try {
    const response = await axios(config);
    res.send({ response: response?.data })
  } catch (e) {
    console.log("Could not get accounts", e.response.data)
  }
});

// Sends money from Coinbase account to any address
app.get("/sendMoney", async (req, res) => {
  const CB_ACCT_TO_SEND_FROM = "" // get this by querying the /account endpoint
  const ADDRESS_TO_SEND_TO = ""

  const data = JSON.stringify({
    "type": "send",
    "to": ADDRESS_TO_SEND_TO,
    "amount": "0.1",
    "currency": "BTC"
  });

  const config = {
    method: 'post',
    url: `https://api.coinbase.com/v2/accounts/${CB_ACCT_TO_SEND_FROM}/transactions`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    data
  };

  try {
    const response = await axios(config);
    res.send({ response: response?.data })
  } catch (e) {
    console.log("Could not send money", e.response.data)
  }
});

app.get('/refreshToken', async (req, res) => {
  const data = qs.stringify({
    'grant_type': 'refresh_token',
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'refresh_token': refreshToken
  });
  const config = {
    method: 'post',
    url: 'https://api.coinbase.com/oauth/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data
  };

  try {
    const response = await axios(config);
    res.send({ response: response?.data })
  } catch (e) {
    console.log("Could not refresh token", e.response.data)
  }
})

var port = process.env.PORT || 3006;

app.listen(port, '0.0.0.0', function () {
  console.log("Server starting on localhost:" + port);
});