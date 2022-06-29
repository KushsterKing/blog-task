const expressJwt = require('express-jwt');
const configuration = require('./../../configuration');

module.exports = jwt;

function jwt() {
    const secret = configuration.secret;

    return expressJwt({ secret }).unless({
        path: [
            // public routes that don't require authentication

            /^\/users\/login\/*/,
            /^\/users\/register\/*/,
            /^\/users\/forgot-password\/*/,
            /^\/users\/reset-password\/*/,
            /^\/users-two\/*/


            // /^\/v1\/admin\/auth\/reset-password\/*/,
            // /^\/v1\/admin\/auth\/tfa\/*/,
            // /^\/v1\/admin\/brands\/language\/*/,
            // /^\/payment-status\/*/,
            //
            // /^\/payment-bridger\/*/,
            // /^\/v1\/admin\/brands\/querytype\/*/
        ]
    });
}
