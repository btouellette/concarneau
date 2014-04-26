# Concarneau

Multiplayer web game using the same rules as Carcassone

## Instructions

If you would like to download the code and try it for yourself:

1. Clone the repo: `git clone git@github.com:btouellette/concarneau`
2. Install packages: `npm install`
3. Change out the database configuration in config/database.js or set appropriate environment variables
4. If using a local MongoDB ensure the db is launched
4. Change out auth keys in config/auth.js or set appropriate environment variables
5. Launch: `node server.js`
6. Visit in your browser at: `http://localhost:8080`

To authenticate via OAuth:

1. Set up Facebook/Google/Twitter applications
2. Facebook app settings:
 * Settings -> Basic -> Add Platform -> Website: Site Url
    * http://localhost:8080/
 * Settings -> Advanced -> Security -> Valid OAuth redirect URIs
    * http://localhost:8080/auth/facebook/callback
3. Google app settings:
 * APIs & auth -> Credentials -> Redirect URIs
    * http://localhost:8080/auth/google/callback 
 * APIs & auth -> Credentials -> Javascript Origins
    * http://localhost:8080
4. Twitter app settings
 * Settings -> Application Details -> Callback URL
    * http://127.0.0.1:8080/auth/twitter/callback