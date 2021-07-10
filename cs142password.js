"use strict";
const crypto = require('crypto');

/*
 * Return a salted and hashed password entry from a
 * clear text password.
 * @param {string} clearTextPassword
 * @return {object} passwordEntry
 * where passwordEntry is an object with two string
 * properties:
 *      salt - The salt used for the password.
 *      hash - The sha1 hash of the password and salt
 */
function makePasswordEntry(clearTextPassword) {
	let salt = crypto.randomBytes(8).toString('hex');
	let hash = crypto.createHmac('sha1', clearTextPassword).update(salt).digest('hex');
	return {salt:salt, hash:hash};
}

/*
 * Return true if the specified clear text password
 * and salt generates the specified hash.
 * @param {string} hash
 * @param {string} salt
 * @param {string} clearTextPassword
 * @return {boolean}
 */
function doesPasswordMatch(hash, salt, clearTextPassword) {
	return hash === crypto.createHmac('sha1', clearTextPassword).update(salt).digest('hex');
}

module.exports = {
	makePasswordEntry : makePasswordEntry,
	doesPasswordMatch : doesPasswordMatch
};
