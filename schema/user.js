"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');

var activitySchema = new mongoose.Schema({
    type: String,     // The text of the comment.
    date_time: {type: Date, default: Date.now}, // The date and time when the comment was created.
    user_id: mongoose.Schema.Types.ObjectId,    // 	The ID of the user.
    thumbnail_name: String, // The file name of photo.
    from_user : String, // The user name of the action.
    to_user : String, // The author of the photo.
    visible_id : [mongoose.Schema.Types.ObjectId] // List of user ids who can view the activity.
});

// create a schema
var userSchema = new mongoose.Schema({
	login_name: String, // login name of the user.
	password_digest: String, // hashing password
	password_salt: String, // adding salt.
    first_name: String, // First name of the user.
    last_name: String,  // Last name of the user.
    location: String,    // Location  of the user.
    description: String,  // A brief user description
    occupation: String,    // Occupation of the user.
    activity: activitySchema, // The most recent activity of the user.
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
