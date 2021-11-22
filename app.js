const express = require('express');
const fileUpload = require('express-fileupload');
const serveIndex = require('serve-index');
const path = require('path');
const mysql = require('mysql');
const app = express();
const rimraf = require("rimraf");
const bcrypt = require('bcryptjs');
const fs = require('fs');

const session    = require("express-session");
const nedbstore  = require("nedb-session-store")(session);
const    nedb      = require("nedb");

app.locals.basedir = __dirname;
// Connecting to the DB
const connection = mysql.createConnection({host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'imagedb',
    password: 'usbw',
    multipleStatements: true
});

// Sessions
app.use(
  session({
    name: "TheCookie",
    secret: "InTheBleakMidwinter",
    resave: true,
    saveUnitialized: true,
    cookie:{path:"/", httpOnly: true, maxAge: 1000*60*60*6},
    store: new nedbstore({filename: "db/sessions.db"})
  })
)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/uploads', express.static('uploads'), serveIndex('uploads', {'icons': true}));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const createDir = (dirpath) => {
  fs.mkdirSync(dirpath, { recursive: true}, (error) => {
    if(error) {
      console.error('An error has occured: ', error);
    } else {
      console.log('Directory Created')
    }
  });
}


//#region 404
/* catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});*/

 /*error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});*/
//#endregion


connection.connect(function(err) {
    if (err){
        throw err;
    }
    console.log("Connected to DB");
});

//#region Login 
app.get('/Login', function(req, res){
  if(!req.session.loggedIn){
    res.render('index');
  }
  else{
    res.redirect('/home');
  }
})
//#endregion

//#region Register
// Post register data

//get index page 

// errors: page not found 404  
/*app.use((req, res, next)=> {
  var err = new Error('Page not found');
  err.status = 404;
  next(err);

  // handling errors
  app.use((err, req, next) => {
    res.status(err.status || 500);
    res.send(err.message);
  })
})*/

//#endregion

app.get('/files/:uname', (req, res) => {
  let user = req.params.uname;

  // let sql_SelectAll = "SELECT * FROM ?? WHERE ?? = ?";
  // let inserts = ['projects','project_name',projectID]
  // let sql = mysql.format(sql_SelectAll, inserts);
  // con.query(sql, function(err, result){
    //let readpath = projectID;
    const directoryPath = path.join(__dirname, '/uploads/' + user);
    var file;
    fs.readdir(directoryPath, function (err, files) {
      //handling error
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }
      //listing all files using forEach
      files.forEach(function (file) {
        // Do whatever you want to do with the file
      });
      //res.render('files', buildParams(req, {files, file, readpath, projectID}));
      res.render('files', {files, file, user});
    });
 // });
})

app.get('/upload' , (req, res) => {
  let loggdIn = req.session.loggedIn,
      user  = req.session.user;
      console.log(user);
  res.render('upload', {loggedIn, user});
})

app.post('/upload/:user', function(req, res) {
  //let projectID = req.params.projectID,
      let sampleFile,
      uploadPath,
      user = req.params.user,
      directory = __dirname + '/uploads/' + user + '/';

    if (!req.files || Object.keys(req.files).length === 0) {
      res.redirect("/files/" + uName);
      return;
    }
    sampleFile = req.files.sampleFile;
    uploadPath = directory + sampleFile.name;

    // meta data
    const {location, captured_By, tags, date} = req.body;
    if(location == "" || captured_By == ""|| tags == "" || date == ""){
      return res.redirect('/');
    }else {
      connection.query('INSERT INTO image SET ?', {location: location, captured_By: captured_By , tags: tags, date: date}, (error, result) => {
        // if(error) {
        //   console.log(error);
        // } 
        // else { //data successfully inserted into the user table
        //   console.log(result);
        //   res.redirect('/')
        // }
      });
    };

    sampleFile.mv(uploadPath, function(err) {
      if (err) {
        return res.status(500).send(err);
      }
      res.redirect("/home");
    });
});

app.post('/delete/:user', function(req, res) {
  //let projectID = req.params.projectID;
  var file = req.body.delfile,
  user = req.params.user;
  //__dirname once path can be grabed from url
  const paths = __dirname+ '/uploads/' + user + '/' + file
  try {
    fs.unlinkSync(paths)
    //res.send('Deleted: ' + file);
    res.redirect("/home");
    //file removed
  } catch(err) {
    console.error(err)
    res.send('File: ' + file +' does not exist');
  }
})

// Setting up the server
// Get the index page
app.get('/', (req, res, next) => {
  //let user = req.session.user;
  // If there is a session named user that means the use is logged in. so we redirect him to home page by using /home route below
  // if(user) {
  //     res.redirect('/home');
  //     return;
  // }
  // IF not we just send the index page.
  res.render('index', {title:"My application"});
})

// Get home page
app.get('/home', (req, res, next) => {
  // let user = req.session.user;

  // if(user) {
  //     res.render('home', {opp:req.session.opp, name:user.fullname});
  //     return;
  // }
  //res.redirect('/home');
  let loggdIn = req.session.loggedIn,
      user  = req.session.user;

  res.render('home', {loggdIn, user});
});

// Post login data
app.post('/login', async (req, res) => {
  const {username, password} = req.body;

  connection.query('SELECT * FROM user WHERE username = ?', [username], async (error, result) => {
    if(!(await bcrypt.compare(password, result[0].password)))
    {
      console.log(error);
      console.log('Email or password incorrect');
    }
    else
    {
      req.session.loggedIn = true;
      req.session.user = username;
      console.log(result);
      return res.redirect('/home');
    }
  });
});

// Post register data
app.post('/register', async(req, res, next) => {
  const {username, password, email} = req.body;
  if(username == "" || password == ""|| email == ""){
    return res.redirect('/');
  }
  let hashedPassword = await bcrypt.hash(password, 8)
  let dir = username;
  let directory = __dirname + '/uploads/' + dir + '/';
  connection.query('INSERT INTO user SET ?', {username: username, password: hashedPassword , email: email}, (error, result) => {
    if(error) {
      console.log(error);
    } 
    else { //data successfully inserted into the user table
      console.log(result);
      createDir(directory);
      res.redirect('/Login')
    }
  });
});

// Get loggout page
app.get('/logout', function(req, res) {
  req.session.user = undefined;
  req.session.loggedIn = false;
  res.redirect('/');
})

app.listen(5000, function() {
  console.log("App running on port: " + 5000);
})




















// app.post('/register', (req, res, next) => {

//   const {fullname, username, lastname, password, email} = req.body;

//   if(fullname == "" || username == "" || password == ""|| lastname == "" || email == ""){
//     // req.session.err = true;
//     // req.session.errMsg = "Missing details";
//     return res.redirect('/');
//   }else {
//     const member_query = `INSERT INTO user(Username, Password, First_Name, Last_Name, Email) VALUES (?, ?, ?, ?, ?)`;

//     connection.query(member_query, [username, password, fullname, lastname, email], (error, user_result) => {
//         if (error) {
//             //res.json(new StandardResponse(0, error, 'An error occurred while creating a member.', 'An error occurred while creating a plane. Contact member.'));
//         } else {
//           return res.redirect('/');
          
//         }
//     });
//   }
  // // prepare an object containing all user inputs.
  // let userInput = {
  //     username: req.body.username,
  //     firtName: req.body.fullname,
  //     lastName: req.body.fullname,
  //     password: req.body.password
  // };
  // // call create function. to create a new user. if there is no error this function will return it's id.
  // user.create(userInput, function(lastId) {
  //     // if the creation of the user goes well we should get an integer (id of the inserted user)
  //     if(lastId) {
  //         // Get the user data by it's id. and store it in a session.
  //         user.find(lastId, function(result) {
  //             req.session.user = result;
  //             req.session.opp = 0;
  //             res.redirect('/home');
  //         });

  //     }else {
  //         console.log('Error creating a new user ...');
  //     }
  // });

// });



// app.post('/login', (req, res, next) => {
  
//   let username = req.body.username,
//   password = req.body.password,
//   user = username;

//   const login_query = `SELECT * FROM user WHERE Username= ?`;
//   if(username == "" || password ==""){
//     // req.session.err = true;
//     // req.session.errMsg = "Missing details";
//     return res.redirect('/login');
//   }
//    else{
//     connection.query(login_query, [username], (error, result) => {
//       if (error) {
//           //res.json(new StandardResponse(0, error, 'An error occurred while browsing flights', 'An error occurred while browsing flights. Contact admin.'));
//       } else {
//           if(result.length == 0){
//             // req.session.err = true;
//             // req.session.errMsg = "Email does not exist";
//             return res.redirect('/login');
//           }
//           //response.json(new StandardResponse(1, flight_result, '', ''));
//           let dbPassword = result[0].Password;
//           let ID = result[0].guid;
//           //const role_query = `SELECT r.name FROM member_role m JOIN roles r ON m.role_guid= r.guid WHERE m.member_guid= ?`;
//           //connection.query(role_query, [ID], (error, role_result) => {
//           if(dbPassword == password){
//               // req.session.loggedIn = true;
//               // req.session.user = user;
//               // req.session.err = null;
//               // req.session.errMsg = "";
//             return res.redirect('/home');
//           }else {
//             //req.session.errMsg = "Details Incorrect";
//             return res.redirect('/login');
//           }
              
//           }
//   });
// }






//   // let query = 'select * from user';
//   //   connection.query(query, (error, result)=> {
//   //       if (error){
//   //           console.log(error)
//   //       }
//   //       console.log(result);
//   //       res.json(result); // res sends to the front end. 
//   // user.login(req.body.username, req.body.password, function(result) {
//   //     if(result) {
//   //         // Store the user data in a session.
//   //         req.session.user = result;
//   //         req.session.opp = 1;
//   //         // redirect the user to the home page.
//   //         res.redirect('/home');
//   //     }else {
//   //         // if the login function returns null send this error message back to the user.
//   //         res.send('Username/Password incorrect!');
//   //     }
//   // })

// });