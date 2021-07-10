"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */
const redis = require('redis');
const connectRedis = require('connect-redis');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
const fs = require("fs");

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

// Hash Gen
var cs142password = require('./cs142password');
var express = require('express');
var app = express();

// Redis
const RedisStore = connectRedis(session);
const redisClient = redis.createClient({
    host: 'localhost', 
    port: 6379
});

mongoose.connect('mongodb://localhost/cs142project7', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({
    store: new RedisStore({client: redisClient}),
    secret: 'secretKey', 
    resave: false, 
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 30 // 30 min session
    }
}));

app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
     console.log(request.sessionID);
    console.log(request.session.cookie);
    
    // Express parses the ":p1" from the URL and returns it in the request.params objects.    
    console.log('/test called with param1 = ', request.params.p1);
    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    User.find({}, '_id first_name last_name', function (err, apiUL) {
        if (err) {
            response.status(400).send('Failed to find user !!!');
            return;
        }

        if (apiUL.length === 0 || !apiUL) {
            response.status(400).send('Missing UserSchema !!!');
            return;
        }

        // We got user list - return it in JSON format.
        response.status(200).send(JSON.stringify(apiUL));
    });

});

// User activity
app.get('/user/activities', function (request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let ans = [];
    User.find({activity : {$ne : undefined}}, 'activity', function(err, users) {
            if (err) {
                response.status(400).send('Failed to find user !!!');
                return;
            }

            // Filter activities based on visible ids list
            users.forEach((user) => {
                if (user.activity.visible_id.length === 0 || user.activity.visible_id.indexOf(request.session.uid) !== -1) {
                    ans.push(user);
                }
            })

            ans.sort((a,b)=>b.activity.date_time - a.activity.date_time);
            response.status(200).send(JSON.stringify(ans));
        });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let uid = request.params.id;
    User.findOne({_id:uid}, '_id first_name last_name location description occupation', function (err, apiU) {
        if (err) {
            response.status(400).send('Failed to find user !!!');
            return;
        }
    
        // Found user - return it in JSON format.
        response.status(200).send(apiU);
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id/:sortKey', function (request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }
    
    let uid = request.params.id;
    let sortKey = request.params.sortKey;
    let ans = [];

    Photo.find({user_id:uid}, '_id user_id comments file_name date_time likes_uid allowed_uid favorite_uid tagInfo' , async function (err, photos) {
        if (err) {
            response.status(400).send('Failed to find user');
            return;
        }

        await Promise.all(photos.map(async (photo, indexP) => {
            // Check if current user in the share list
            if (photo.allowed_uid.length === 0 || photo.allowed_uid.indexOf(request.session.uid) !== -1) {
                await Promise.all(photo.comments.map(async (comment, indexC) => {
                    let user = await User.findById(comment.user_id, '_id first_name last_name')
                                            .catch (() => {
                                                response.status(400).send('Failed to find comments of user !!!');
                                            });

                    let data =  {   comment : comment.comment,
                                    date_time : comment.date_time,
                                    _id : comment._id,
                                    user : user
                                };
                    (photos[indexP].comments)[indexC] = data;
                }))  
                ans.push(photos[indexP]);
            }
        }))

        // Sort photos 
        if (sortKey === "time") {
            ans.sort((a,b) => b.date_time !== a.date_time 
                                    ? b.date_time - a.date_time 
                                    : b.likes_uid.length - a.likes_uid.length);
        } else if (sortKey === "like") {
            ans.sort((a,b) => b.likes_uid.length !== a.likes_uid.length 
                                    ? b.likes_uid.length - a.likes_uid.length 
                                    : b.date_time - a.date_time);
        }

        response.status(200).send(JSON.stringify(ans));    
    });
});

// User login
app.post('/admin/login', function(request, response) { 
    let login = request.body.login_name;  
    let pass = request.body.password;

    User.findOne({login_name : login}, function(err, user) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
            return;
        }

        if (!user || !cs142password.doesPasswordMatch(user.password_digest, user.password_salt, pass)) {
            response.status(400).send('The user name or password is incorrect');
            return;
        }

        // Add activity
        request.session.uid = user._id;
        request.session.uname = `${user.first_name} ${user.last_name}`;
        user.activity = {
                            type:"Logged In", 
                            date_time:Date.now(), 
                            user_id:request.session.uid,
                            from_user: request.session.uname
                        }
        user.save();
        response.status(200).send(request.session.uid);
    });
});

// User logout
app.post('/admin/logout', function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    User.findOne({_id : request.session.uid}, function(err, user) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
            return;
        }

        // Add activity
        user.activity = {   type:"Logged Out", 
                            date_time:Date.now(), 
                            user_id:user.uid,
                            from_user:`${user.first_name} ${user.last_name}`
                        }; 
        user.save();

        // Clear session
        request.session.destroy(function(err) {
            if (err) {
                response.status(400).send('Error removing session !!!');
                return;
            }
            response.status(200).send('Logout successful !!!');
        });
    });
});

// Del User
app.post('/delUser', async function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let uid = request.session.uid;

    let delShareList = Photo.updateMany({}, { $pull: {allowed_uid : uid } })
                                .catch(()=>{response.status(400).send('Error deleting share list !!!');});

    let delLikesPromise = Photo.updateMany({}, { $pull: {likes_uid : uid} })
                                .catch(()=>{response.status(400).send('Error deleting users likes !!!');});

    let delCommentsPromise = Photo.updateMany({}, { $pull: {comments: {user_id : uid}} })
                                    .catch(()=>{response.status(400).send('Error deleting users comments !!!');});

    let delTags = Photo.updateMany({}, { $pull: {tagInfo: {uid : uid}} })
                                    .catch(()=>{response.status(400).send('Error deleting users tags !!!');});

    let delPhotosPromise = Photo.deleteMany({user_id:uid})
                                .catch(()=>{response.status(400).send('Error deleting users photos !!!');});

    let delUserPromise = User.deleteOne({_id:uid})
                                .catch(()=>{response.status(400).send('Error deleting users profile !!!');});

    await Promise.all([delLikesPromise, delCommentsPromise, delPhotosPromise, delUserPromise, delShareList, delTags]);

    // Clear session
    request.session.destroy(function(err) {
        if (err) {
            response.status(400).send('Error removing session !!!');
            return;
        }
        response.status(200).send('Account is deleted !!!');
    });    
});

// Add comment on a given photo
app.post('/commentsOfPhoto/:photo_id', async function(request, response) {
   if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    if (!request.body.comment) {
        response.status(400).send('Bad Request !!! Empty Text !!!');
        return;
    }

    let photo_author_name = request.body.photo_author_name;
    let id = request.params.photo_id;
    let newComment = {  comment:request.body.comment,
                        date_time:Date.now(), 
                        user_id:request.session.uid,
                        mentioned_uid:request.body.mentioned_uid_list
                    }; 

    Photo.findByIdAndUpdate({_id:id}, 
                            {$push: {comments:newComment}},
                            {useFindAndModify: false}, function(err, photo) {
        if (err) {
            response.status(400).send(`Photo Id "${id}" is invalid !!!`);
            return;
        }

        User.findOne({_id : request.session.uid}, function(err, user) {
            if (err) {
                response.status(400).send('Db failed!!!');
                return;
            }
    
            user.activity = {   type:"Added Comment", 
                                date_time:Date.now(), 
                                user_id:request.session.uid,
                                from_user:request.session.uname,
                                to_user:photo_author_name,
                                thumbnail_name:photo.file_name
                            }; 
            user.save();
            response.status(200).send('New Comment Added !!!');
        });
    });
});

// Delete photo
app.post('/delPhoto/:photo_id', function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    Photo.deleteOne({_id:request.params.photo_id}, function(err) {
        if (err) {
            response.status(400).send('Deleting photo error');
            return;
        }

        response.status(200).send('Photo is deleted');
    });
});

// Delete comment on a given photo
app.post('/delComment/:comment_id/', async function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let photo_id = request.body.photo_id;
    let comment_id = request.params.comment_id;

    Photo.findByIdAndUpdate({_id:photo_id}, 
                            { $pull: {comments : {_id : comment_id}} },
                            {useFindAndModify: false}, function(err, photo) {
        if (err) {
            response.status(400).send(`Failed to find photo !!!`);
            return;
        }

        response.status(200).send(photo);
    });
});



/* Upload Photo Request */
app.post('/photos/new', function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send('Missing File Error!!!');
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        const timestamp = new Date().valueOf();
        const filename = 'U' +  String(timestamp) + request.file.originalname;
        const list = !request.body.list ? [] : request.body.list.split(',');

        fs.writeFile("./images/" + filename, request.file.buffer, async function (err) {
            // XXX - Once you have the file written into your images directory under the name
            // filename you can create the Photo object in the database
            if (err) {
                response.status(400).send('Writing File Error !!!');
                return;
            }

            let photoCreatePromise = Photo.create({ file_name: filename,
                                                    date_time: timestamp,
                                                    user_id: request.session.uid,
                                                    comments: [],
                                                    allowed_uid: list
                                                }).catch(()=>{response.status(400).send('Error creating photo !!!');});

            let findUserPromise = User.findOne({_id : request.session.uid})
                                        .catch(()=>{response.status(400).send('Error finding user !!!');});

            let ans = await Promise.all([photoCreatePromise, findUserPromise]);

            // Add activity
            ans[1].activity = { type:"Uploaded Photo", 
                                date_time:Date.now(), 
                                user_id:request.session.uid,
                                from_user:request.session.uname,
                                thumbnail_name: ans[0].file_name,
                                visible_id : list
                            }; 
            ans[1].save();    

            response.status(200).send('Successfully Upload Photo !!!');
        });
    });
});

// Return user objects {id:_id, display:first_name & last_name}
app.get('/usersMentionedFormat', function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    User.find({}, '_id first_name last_name', function(err, users) {
        if (err) {
            response.status(400).send('Find user error !!!');
            return;
        }

        let mentionFormat = []
        users.forEach((user)=> {
            let cur = {id : user._id, display : `${user.first_name} ${user.last_name}`};
            mentionFormat.push(cur);
        })
        response.status(200).send(mentionFormat);
    });
    
});

// Return list of photos that have comments that mentioned user
app.get('/usersMentioned/:uid', function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let uid = request.params.uid;
    let ans = [];

    Photo.find({$or :  [
                            {allowed_uid: uid},
                            {allowed_uid: []}
                        ]}, async function(err, photos) {
        if (err) {
            response.status(400).send(err);
            return;
        }

        await Promise.all(photos.map(async (photo) => {
            await Promise.all(photo.comments.map(async (comment) => {
                if (comment.mentioned_uid.indexOf(uid) !== -1) {
                    let user = await User.findOne({_id : photo.user_id})
                                            .catch(() => {response.status(400).send('Failed to find user');});    

                    let data =  {   
                                    photo_id : photo._id,
                                    photo_name : photo.file_name,
                                    author_name : `${user.first_name} ${user.last_name}`,
                                    author_id : photo.user_id,
                                    date_time : comment.date_time
                                };
                    ans.push(data);   
                }
            }))
        }))

        ans.sort((a,b) => b.date_time - a.date_time);
        response.status(200).send(JSON.stringify(ans));
    });
});

// Create new user
app.post('/user', function(request, response) {
    User.findOne({login_name:request.body.login_name}, function(err, user) {
        if (err) {
            response.status(400).send('Find user error !!!');
            return;
        }

        if (!request.body.login_name || !request.body.first_name || !request.body.last_name || !request.body.password) {
            response.status(400).send('One of required fields is empty');
        }

        if (user) {
            response.status(400).send('Please choose a different login name');
            return;
        }

        let pwd = cs142password.makePasswordEntry(request.body.password);
        User.create({
            login_name : request.body.login_name,
            first_name : request.body.first_name,
            last_name : request.body.last_name,
            password_digest : pwd.hash,
            password_salt: pwd.salt,
            location : request.body.location,
            description : request.body.description,
            occupation : request.body.occupation,
            activity: {}
            }, function(err, newUser) {
                if (err) {
                    response.status(400).send('Error Creating User Object In DB!!!');
                    return;
                }

                //Add activity
                newUser.activity =  {
                                        type : "registering",
                                        time_activities : Date.now(),
                                        from_user : `${newUser.first_name} ${newUser.last_name}`
                                    };
                newUser.save();
                request.session.uid = newUser._id;
                request.session.uname = `${newUser.first_name} ${newUser.last_name}`;

                response.status(200).send('Account is created. Please login.');
        }); 
    })  
});

// Photo likes update
app.post('/likeUpdate/:photo_id', function(request,response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let pid = request.params.photo_id;
    let curState = request.body.curState;
    let uid = request.session.uid;

    Photo.findOne({_id:pid}, function(err, photo) {
        if (err) {
            response.status(400).send('Find photo error !!!');
            return;
        }

        if (curState) {
            let index = photo.likes_uid.indexOf(uid);
            photo.likes_uid.splice(index, 1);
        } else {
            photo.likes_uid.push(uid);
        }

        photo.save();
        response.status(200).send("Like list is updated !!!");
    });
});

// Retrieve favorite photos from current user
app.get('/favoritePhotos/', function(request,response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    Photo.find({favorite_uid: {$elemMatch: {$eq: request.session.uid}}}, function(err, photo) {
        if (err) {
            response.status(400).send('Failed to find photo !!!');
            return;
        }

        response.status(200).send(photo);
    });
});

// Update favorite status of current user
app.post('/favoriteUpdate/:photo_id', function(request,response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let pid = request.params.photo_id;
    let curState = request.body.curState;
    let uid = request.session.uid;

    Photo.findOne({_id:pid}, function(err, photo) {
        if (err) {
            response.status(400).send('Find photo error !!!');
            return;
        }

        if (curState) {
            let index = photo.favorite_uid.indexOf(uid);
            photo.favorite_uid.splice(index, 1);
        } else {
            photo.favorite_uid.push(uid);
        }

        photo.save();
        response.status(200).send("Favorite list is updated !!!");
    });
});

// Remove favorite photo
app.post('/favoriteRemove/:photo_id', function(request,response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let pid = request.params.photo_id;
    Photo.findByIdAndUpdate({_id:pid},      
                            { $pull: {favorite_uid : {$in: [request.session.uid]}} },
                            {useFindAndModify: false}, function(err) {
        if (err) {
            response.status(400).send('Error removing favorite photo !!!');
            return;
        }     

        response.status(200).send('Done removing photo !!!');     
    });
});

// Add tag to photo
app.post('/addTag/:photo_id', function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let pid = request.params.photo_id;
    let newTag = request.body.data;
    newTag.from_uname = request.session.uname;
    newTag.from_uid = request.session.uid;
    newTag.date_time = Date.now();

    Photo.findById({_id:pid}, function(err,photo) {
        if (err) {
            response.status(400).send('Error adding tag !!!');
            return;
        }     

        // Remove old tag - 1 tag per uid
        let index = photo.tagInfo.findIndex((element) => element.uid.equals(newTag.uid));
        if (index !== -1) {
            photo.tagInfo.splice(index, 1);
        }       

        photo.tagInfo.push(newTag);
        photo.save();  
        response.status(200).send('Done adding tag !!!');  
    });
});

// Remove tag from photo
app.post('/removeTag/:photo_id', function(request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }

    let pid = request.params.photo_id;
    let uid = request.body.uid;

    Photo.findByIdAndUpdate({_id:pid},
                            {$pull : {tagInfo : {uid : uid}}},
                            {useFindAndModify: false}, function(err) {
        if (err) {
            response.status(400).send('Error removing tag !!!');
            return;
        }     

        response.status(200).send('Done removing tag !!!');  
    });
});

// Get tagged photos user
app.get('/getTag/:uid', function(request, response) {  
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    }  

    Photo.find( {$and : [
                            {tagInfo: {$elemMatch: {uid : request.params.uid}}}, 
                            {$or :  [
                                        {allowed_uid: request.params.uid},
                                        {allowed_uid: []}
                                    ]}
                        ]
                },
                'file_name user_id tagInfo.date_time tagInfo.from_uname tagInfo.from_uid' , function(err,photos) {
        if (err) {
            response.status(400).send('Error finding tag !!!');
            return;
        }     

        photos.sort((a,b)=>b.tagInfo[0].date_time - a.tagInfo[0].date_time);
        response.status(200).send(photos);  
    });
});

app.get('/statView/:uid', function (request, response) {
    if (!request.session.uid) {
        response.status(401).send('Session Expired');
        return;
    } 

    let ans = [];
    let curUid = request.params.uid;

    User.find({}, async function(err,users) {
        if (err) {
            response.status(400).send('Error finding user !!!');
            return;
        }

        await Promise.all(users.map(async (user)=> {  
            let photoCnt = Photo.countDocuments(
                                                    {$and : 
                                                    [
                                                        {user_id : user._id},
                                                        {$or :  [
                                                                    {allowed_uid: curUid},
                                                                    {allowed_uid: []}
                                                                ]}
                                                    ]
                                                })
                                .catch(()=>{response.status(400).send('Failed to count user photo !!!');});

            let commentCnt = Photo.countDocuments(
                                                    {$and : 
                                                    [
                                                        {'comments.user_id' : user._id},
                                                        {$or :  [
                                                                    {allowed_uid: curUid},
                                                                    {allowed_uid: []}
                                                                ]}
                                                    ]
                                                })

                                .catch(()=>{response.status(400).send('Failed to count user comment !!!');});

            let comments = Photo.aggregate([    
                                                {$unwind: '$comments'},  
                                                {$match : {$and:[
                                                                    {'comments.user_id' : user._id},    
                                                                    {$or :  [
                                                                                {allowed_uid : mongoose.Types.ObjectId(curUid)},
                                                                                {allowed_uid : []}
                                                                            ]}
                                                                ]}
                                                },
                                                {$project : {   
                                                                photo_name:'$file_name', photo_id:'$_id', 
                                                                key:'$comments._id', photo_author_id: '$user_id',
                                                                comment_date_time:'$comments.date_time',
                                                                comment_text:'$comments.comment'
                                                            }
                                                }
                                            ])
                            .sort({comment_date_time:-1})
                            .catch(()=>{response.status(400).send('Failed to find comment !!!');});

            await Promise.all([photoCnt, commentCnt, comments]).then((vals)=> {
                ans.push({
                            uid : user._id,
                            uname : `${user.first_name} ${user.last_name}`,
                            photoCnt : vals[0],
                            commentCnt : vals[1],
                            commentInfo : vals[2]
                        });
            })
        }))
        response.status(200).send(ans);  
    })
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


