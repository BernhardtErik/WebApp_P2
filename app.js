
const express = require('express');
const path = require('path');


const mysql = require('mysql');




const app = express();

const connection = mysql.createConnection({host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'imagedb',
    password: 'usbw',
    multipleStatements: true
})

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

/* error handler
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

app.listen(5000, function() {
  console.log("App running on port: " + 5000);
})
