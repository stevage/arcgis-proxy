const axios = require('axios');
const app = require('express')();
require('dotenv').config();
let token, tokenExpiry;

async function updateApplicationToken() {
  console.log('Updating application token.')
  const tokenInfo = await axios.post('https://www.arcgis.com/sharing/rest/oauth2/token/', null, {
    params: {
      client_id: process.env.ARCGIS_CLIENT_ID,
      client_secret: process.env.ARCGIS_CLIENT_SECRET,
      grant_type: 'client_credentials',
      expiration: 1 * 60, // how long token should be valid, up to 20160 minutes.
      f: 'json',
    }
  });
  token = tokenInfo.data.access_token
  if (!token) {
    console.error(tokenInfo.data.error)
    return tokenInfo.data.error
  }
  tokenExpiry = tokenInfo.data.expires_in * 1000 + Date.now();
  console.log(`New application token aquired, expires in ${Math.round((tokenExpiry - Date.now())/60000)} minutes.`);   
}

async function updateUserToken() {
  console.log('Updating user token.')
  const tokenInfo = await axios.post('https://www.arcgis.com/sharing/generateToken', null, {
    params: {
      username: process.env.ARCGIS_USER,
      password: process.env.ARCGIS_PASSWORD,
      referer: 'https://geoenricher.glitch.com/',
      expiration: 1 * 5, // how long token should be valid, in minutes
      f: 'json',
    }
  });
  token = tokenInfo.data.token
  if (!token) {
    console.error(tokenInfo.data.error)
    return tokenInfo.data.error
  }
  tokenExpiry = tokenInfo.data.expires;
  console.log(`New application token aquired, expires in ${Math.round((tokenExpiry - Date.now())/60000)} minutes.`);
    
}

// https://developers.arcgis.com/rest/geoenrichment/api-reference/accessing-the-service.htm
async function refreshToken() {
  if (token && tokenExpiry && Date.now() < tokenExpiry - 60) {
    return;
  }
  return process.env.ARCGIS_CLIENT_ID ? updateApplicationToken() : updateUserToken();  
}
// Test URL: /?f=json&studyAreas=[{"geometry":{"x":147.172,"y":-36.739}}]&studyAreasOptions={"areaType":"RingBuffer","bufferUnits":"EsriKilometers","bufferRadii":[10]}&returnGeometry=true&analysisVariables=["KeyGlobalFacts.TOTPOP"]
app.get('*', async function(req, response) {  
  console.log(`In: ${req.path} (from ${req.header('Referer')})`)
  if (!req.query.studyAreas) {
    response.status(400).send({ error: 'See https://developers.arcgis.com/rest/geoenrichment/api-reference/enrich.htm for required parameters.'});
    return;
  }
  const error = await refreshToken();
  if (!token) {
    response.status(500).send(error)
    return;
  }
  const geoenrich = await axios.get('https://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/enrich' + req.path,
    {
      params: {
        ...req.query,
        token
      },
    });
  console.log(`Out: ${geoenrich.request.path}`)
  
  response.setHeader('content-type', 'application/json');
  response.set('Access-Control-Allow-Origin', '*');
  if (geoenrich.data.error) {
    console.error(geoenrich.data.error)
    response.status(geoenrich.data.error.code).send(geoenrich.data);
  } else {
    console.log(`=> ${geoenrich.status} (${JSON.stringify(geoenrich.data).slice(0,100)}...`);
    response.send(geoenrich.data);
  }
})
.listen(process.env.PORT);
