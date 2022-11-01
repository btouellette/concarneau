# Concarneau

Multiplayer web game using the same rules as Carcassone. Currently supports the base game along with the Inns and Cathedrals and the Traders and Builders expansion packs.

Running at https://www.concarneau.net

For a quick demo of capabilities you can start a solo game by logging in, hitting the + icon and selecting start which will start a solo game where you are laying all the tiles and pieces.

## Instructions

If you would like to download the code and try it for yourself:

1. Clone the repo: `git clone git@github.com:btouellette/concarneau`
2. Install packages: `npm install`
3. Change out the database configuration in config/database.js or set appropriate environment variables
4. If using a local MongoDB ensure the db is launched
5. Launch: `node server.js`
6. Visit in your browser at: `http://localhost:8080`

The actual server is Dockerized and sits behind an nginx reverse proxy which handles Let's Encrypt cert issuance and routing traffic to a staging server for testing

```
# DNSMasq (or your personal preference of resolver) needs to be set up and running on :53
# ~/src/concarneau should be updated to the absolute path of where you have the repo checked out

docker run -d --name nginx-proxy \
    -p 80:80 -p 443:443 --network nginx-proxy \
    --volume vhost:/etc/nginx/vhost.d \
    --volume html:/usr/share/nginx/html \
    --volume /etc/lets-encrypt:/etc/nginx/certs \
    --volume ~/src/concarneau/proxy.conf:/etc/nginx/proxy.conf \
    --volume /var/run/docker.sock:/tmp/docker.sock:ro \
    --env "RESOLVERS=127.0.0.1" \
    --restart always \
    nginxproxy/nginx-proxy

docker run --detach \
    --name nginx-proxy-acme \
    --volumes-from nginx-proxy \
    --volume /var/run/docker.sock:/var/run/docker.sock:ro \
    --volume acme:/etc/acme.sh \
    --env "DEFAULT_EMAIL=btouellette@gmail.com" \
    --restart always \
    nginxproxy/acme-companion

docker build -f Dockerfile-staging -t concarneau-staging .
docker run -d --restart always --env-file ./env.staging.list \
    --name concarneau-staging -h staging.concarneau.net \
    --net nginx-proxy -p 8081:8081 \
    concarneau-staging
docker build -t concarneau .
docker run -d --restart always --env-file ./env.production.list \
    --name concarneau -h concarneau.net \
    --net nginx-proxy -p 8082:8082 \
    concarneau
```

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

## Data Retention & Deletion

Game data is saved until any player in the game removes the game from the UI via the trash can icon at which point all game data and messages are deleted permanently

The only user data retained is what is necessary for the functioning of the app, see: https://github.com/btouellette/concarneau/blob/main/app/models/user.js

Games and messages may be manually removed yourself as above and if user account deletion is desired you may email btouellette@gmail.com to have your user account removed
