const express = require('express');
const path = require('path');
const mysql = require('mysql');
const app = express();


// Connecting to the DB
const connection = mysql.createConnection({host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'imagedb',
    password: 'usbw',
    multipleStatements: true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));



// 
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


connection.connect(function(err) {
    if (err){
        throw err;
    }
    console.log("Connected to DB");
});

//#region Login 
app.get('/Login', function(req, res){
  res.render('index');
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

//#region Test

app.get('/about', (req, res)=> {
    let query = 'select * from user';
    console.log('Hello');
    connection.query(query, (error, result)=> {
        if (error){
            console.log(error)
        }
        console.log(result);
        res.json(result); // res sends to the front end. 
    })
})
app.get('/info', (req, res)=> {
  let query = 'select * from image';
  console.log('Hello');
  connection.query(query, (error, result)=> {
      if (error){
          console.log(error)
      }
      console.log(result);
      res.json(result); // res sends to the front end. 
  })
})

//#endregion 

// setting up the server

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
  res.render('home');
});

// Post login data
app.post('/login', (req, res, next) => {
  
  let username = req.body.username,
  password = req.body.password,
  user = username;

  const login_query = `SELECT * FROM user WHERE Username= ?`;
  if(username == "" || password ==""){
    // req.session.err = true;
    // req.session.errMsg = "Missing details";
    return res.redirect('/login');
  }
   else{
    connection.query(login_query, [username], (error, result) => {
      if (error) {
          //res.json(new StandardResponse(0, error, 'An error occurred while browsing flights', 'An error occurred while browsing flights. Contact admin.'));
      } else {
          if(result.length == 0){
            // req.session.err = true;
            // req.session.errMsg = "Email does not exist";
            return res.redirect('/login');
          }
          //response.json(new StandardResponse(1, flight_result, '', ''));
          let dbPassword = result[0].Password;
          let ID = result[0].guid;
          //const role_query = `SELECT r.name FROM member_role m JOIN roles r ON m.role_guid= r.guid WHERE m.member_guid= ?`;
          //connection.query(role_query, [ID], (error, role_result) => {
          if(dbPassword == password){
              // req.session.loggedIn = true;
              // req.session.user = user;
              // req.session.err = null;
              // req.session.errMsg = "";
            return res.redirect('/home');
          }else {
            //req.session.errMsg = "Details Incorrect";
            return res.redirect('/login');
          }
              
          }
  });
}






  // let query = 'select * from user';
  //   connection.query(query, (error, result)=> {
  //       if (error){
  //           console.log(error)
  //       }
  //       console.log(result);
  //       res.json(result); // res sends to the front end. 
  // user.login(req.body.username, req.body.password, function(result) {
  //     if(result) {
  //         // Store the user data in a session.
  //         req.session.user = result;
  //         req.session.opp = 1;
  //         // redirect the user to the home page.
  //         res.redirect('/home');
  //     }else {
  //         // if the login function returns null send this error message back to the user.
  //         res.send('Username/Password incorrect!');
  //     }
  // })

});


// Post register data
app.post('/register', (req, res, next) => {

  let {fullname, username, password} = req.body;

  if(fullname == "" || username == "" || password == ""){
    // req.session.err = true;
    // req.session.errMsg = "Missing details";
    return res.redirect('/');
  }else {
    const member_query = `INSERT INTO user(Username, Password, First_Name, Last_Name, Email) VALUES (?, ?, ?, ?, ?)`;

    connection.query(member_query, [username, password, fullname, fullname, fullname], (error, user_result) => {
        if (error) {
            //res.json(new StandardResponse(0, error, 'An error occurred while creating a member.', 'An error occurred while creating a plane. Contact member.'));
        } else {
          return res.redirect('/home');
        }
    });
  }
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

});


// Get loggout page
app.get('/loggout', (req, res, next) => {
  // Check if the session is exist
  if(req.session.user) {
      // destroy the session and redirect the user to the index page.
      req.session.destroy(function() {
          res.redirect('/');
      });
  }
});

app.listen(5000, function() {
  console.log("App running on port: " + 5000);
})

//#region File Upload 

const fileUpload = require('express-fileupload')
const port = process.env.PORT || 5000;

// default option 
app.use(fileUpload());

//#endregion
