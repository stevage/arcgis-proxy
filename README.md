## ArcGIS-proxy

Provides a proxy service to the ArcGIS Geoenrichment service, to avoid credentials being exposed
in the front end. Automatically updates temporary token on demand, every hour or so.

### Configuring

One of these two sets of environment variables is required:

ARCGIS_CLIENT_ID: client ID for an application registered in ArcGIS developer portal
ARCGIS_CLIENT_SECRET: associated client secret

or:

ARCGIS_USER: username for an ArcGIS Developer account
ARCGIS_PASSWORD: password for that user

### Using the service

GET with the parameters that you would pass after https://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/enrich/
but without the `token` parameter.

### Credits

Written by Steve Bennett.
