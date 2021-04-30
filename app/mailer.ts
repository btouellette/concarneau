var nodemailer = require('nodemailer');
var smtp = require('nodemailer-smtp-transport');
var xoauth2 = require('xoauth2');
var auth = require('../config/auth');

var smtpTransport = nodemailer.createTransport(smtp({
	service: 'gmail',
	auth: {
		xoauth2: xoauth2.createXOAuth2Generator({
			user: 'concarneau.game@gmail.com',
			clientId : '859053446273-1e5ln4ca5gco80tl88a0kefj35id3eik.apps.googleusercontent.com',
			clientSecret: auth.googleAuth.clientSecret,
			refreshToken: auth.googleAuth.refreshToken
		})
	}
}));

module.exports = smtpTransport;