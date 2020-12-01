# Concarneau

Multiplayer web game using the same rules as Carcassone. Currently supports the base game and the Inns and Cathedrals expansion.

Running at https://concarneau.herokuapp.com

For a quick demo of capabilities you can start a solo game by logging in, hitting the + icon and selecting start which will start a solo game where you are laying all the tiles and pieces.

## Instructions

If you would like to download the code and try it for yourself:

1. Clone the repo: `git clone git@github.com:btouellette/concarneau`
2. Install packages: `npm install`
3. Change out the database configuration in config/database.js or set appropriate environment variables
4. If using a local MongoDB ensure the db is launched
5. Launch: `node server.js`
6. Visit in your browser at: `http://localhost:8080`

To set up authentication via OAuth:

1. Set up Facebook/Google/Twitter applications 
2. Add auth keys in config/auth.js or set appropriate environment variables
3. Facebook app settings:
 * Settings -> Basic -> Add Platform -> Website: Site Url
    * http://localhost:8080/
 * Settings -> Advanced -> Security -> Valid OAuth redirect URIs
    * http://localhost:8080/auth/facebook/callback
4. Google app settings:
 * APIs & auth -> Credentials -> Redirect URIs
    * http://localhost:8080/auth/google/callback 
 * APIs & auth -> Credentials -> Javascript Origins
    * http://localhost:8080
5. Twitter app settings
 * Settings -> Application Details -> Callback URL
    * http://127.0.0.1:8080/auth/twitter/callback
