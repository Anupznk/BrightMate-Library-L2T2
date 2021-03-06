const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const server = require("../serverInformation");
const syRegister = require("../util/syRegister");
const {
  v4: uuidv4,
  parse: uuidParse,
  stringify: uuidStringify,
} = require("uuid");
const dbuser = server.user;
const dbpassword = server.password;
const connectionString = server.connectionString;
let responseObj = {};

async function signUp(req, resp) {
  let connection;
  let result;
  let userExistsAlready = 1;
  let syRegisterUsers = 1;

  const saltRounds = 5;
  const salt = bcrypt.genSaltSync(saltRounds);

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let user_name = req.body.USER_NAME;
    let email = req.body.EMAIL;
    let user_password = req.body.PASSWORD;
    let mobile = req.body.MOBILE;
    let gender = req.body.GENDER;
    let user_type_id = 1;

    let userCheckQuery = "SELECT * FROM USERS WHERE EMAIL = :email";
    let user_exists = await connection.execute(userCheckQuery, [email], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    console.log(user_exists);

    if (user_exists.rows.length == 0) {
      //user does not exist
      console.log("user does not exist");
      userExistsAlready = 0;

      //Get Next User Id
      let user_id;
      await syRegister
        .getNextId(connection, syRegisterUsers)
        .then(function (data) {
          user_id = data;
        });

      console.log(user_id);
      console.log(user_password, " ", salt);
      const hash = bcrypt.hashSync(user_password, salt);

      let userInsertQuery =
        "INSERT INTO USERS (USER_ID, USER_NAME, EMAIL, PASSWORD_KEY, MOBILE, GENDER, USER_TYPE_ID) VALUES( :user_id, :user_name, :email, :hash, :mobile, :gender, :user_type_id)";
      let userInsertResult = await connection.execute(userInsertQuery, [
        user_id,
        user_name,
        email,
        hash,
        mobile,
        gender,
        user_type_id,
      ]);

      console.log(userInsertResult);

      const library_card_num = uuidv4();
      console.log(library_card_num);
      today = new Date();

      let readerInsertQuery =
        "INSERT INTO USER_READERS (USER_ID, LIBRARY_CARD_NUMBER, MEMBERSHIP_TAKEN_DATE) VALUES( :user_id, :library_card_num, :today)";
      result = await connection.execute(readerInsertQuery, [
        user_id,
        library_card_num,
        today,
      ]);

      console.log(result);

      connection.commit();

      responseObj = {
        ResponseCode: 1,
        ResponseDesc: "SUCCESS",
        ResponseStatus: resp.statusCode,
        Username: user_name,
        UserId: user_id,
        Email: email,
        PasswordKey: hash,
        Mobile: mobile,
        Gender: gender,
        LibraryCardNumber: library_card_num,
      };
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "USER EXISTS ALREADY WITH THIS EMAIL",
        ResponseStatus: resp.statusCode,
      };
    }
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
    resp.send(responseObj);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "FAILURE",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (userExistsAlready == 0) {
        if (responseObj.ResponseCode == 1) {
          console.log("INSERTED");
          resp.send(responseObj);
        }
      } else {
        console.log("NOT INSERTED");
        resp.send(responseObj);
      }
    }
  }
}

async function signIn(req, resp) {
  let connection;
  let userExistsAlready = 0;
  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    email = req.body.EMAIL;
    userPassword = req.body.PASSWORD;

    let userCheckQuery = "SELECT * FROM USERS WHERE EMAIL = :email";
    let userInfo = await connection.execute(userCheckQuery, [email], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    console.log(userInfo);
    if (userInfo.rows.length == 0) {
      //user does not exist
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "USER DOES NOT EXIST",
        ResponseStatus: resp.statusCode,
      };
    } else {
      let passwordKey = userInfo.rows[0].PASSWORD_KEY;
      let user_id = userInfo.rows[0].USER_ID;
      let user_name = userInfo.rows[0].USER_NAME;
      let email = userInfo.rows[0].EMAIL;
      let mobile = userInfo.rows[0].MOBILE;
      let gender = userInfo.rows[0].GENDER;
      let user_type_id = userInfo.rows[0].USER_TYPE_ID;

      let passwordCorrect = bcrypt.compareSync(userPassword, passwordKey);
      if (passwordCorrect && user_type_id == 1) {
        responseObj = {
          ResponseCode: 1,
          ResponseDesc: "SUCCESS",
          ResponseStatus: resp.statusCode,
          UserId: user_id,
          Username: user_name,
          Email: email,
          PasswordKey: passwordKey,
          Mobile: mobile,
          Gender: gender,
          UserTypeId: user_type_id,
        };
      } else {
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "PASSWORD INCORRECT",
          ResponseStatus: resp.statusCode,
        };
      }
    }
    //connection.commit();
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
    resp.send(responseObj);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "FAILURE",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (userExistsAlready == 1) {
        if (responseObj.ResponseCode == 1) {
          console.log("USER LOGGED IN SUUCCESSFULLY");
          resp.send(responseObj);
        } else {
          console.log("NOT LOGGED IN");
          resp.send(responseObj);
        }
      } else {
        console.log("NOT LOGGED IN");
        resp.send(responseObj);
      }
    }
  }
}

async function adminSignIn(req, resp) {
  let connection;
  let userExistsAlready = 0;
  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    email = req.body.EMAIL;
    userPassword = req.body.PASSWORD;

    let userCheckQuery = "SELECT * FROM USERS WHERE EMAIL = :email";
    let userInfo = await connection.execute(userCheckQuery, [email], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    console.log(userInfo);

    if (userInfo.rows.length == 0) {
      //user does not exist
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "USER DOES NOT EXIST",
        ResponseStatus: resp.statusCode,
      };
    } else {
      let passwordKey = userInfo.rows[0].PASSWORD_KEY;
      let user_id = userInfo.rows[0].USER_ID;
      let user_name = userInfo.rows[0].USER_NAME;
      let email = userInfo.rows[0].EMAIL;
      let mobile = userInfo.rows[0].MOBILE;
      let gender = userInfo.rows[0].GENDER;
      let user_type_id = userInfo.rows[0].USER_TYPE_ID;

      let passwordCorrect = bcrypt.compareSync(userPassword, passwordKey);

      if (user_type_id == 2) {
        let employeeJobQuery =
          "SELECT JOB_ID FROM USER_EMPLOYEE WHERE USER_ID = :user_id";
        let employeeJob = await connection.execute(
          employeeJobQuery,
          [user_id],
          {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          }
        );

        employeeJob = employeeJob.rows[0].JOB_ID;
        console.log("employeeJob: ", employeeJob);

        if ((employeeJob == 1 || employeeJob == 3) && passwordCorrect)
          //LIBRARIAN & LIBRARY ASSISTANTS ONLY
          responseObj = {
            ResponseCode: 1,
            ResponseDesc: "SUCCESS",
            ResponseStatus: resp.statusCode,
            UserId: user_id,
            Username: user_name,
            Email: email,
            PasswordKey: passwordKey,
            Mobile: mobile,
            Gender: gender,
            UserTypeId: user_type_id,
            JobId: employeeJob,
          };
      } else if (user_type_id == 3 && passwordCorrect) {
        responseObj = {
          ResponseCode: 1,
          ResponseDesc: "SUCCESS",
          ResponseStatus: resp.statusCode,
          UserId: user_id,
          Username: user_name,
          Email: email,
          PasswordKey: passwordKey,
          Mobile: mobile,
          Gender: gender,
          UserTypeId: user_type_id,
        };
      } else {
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "WRONG CREDENTIALS",
          ResponseStatus: resp.statusCode,
        };
      }
    }
    //connection.commit();
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
    resp.send(responseObj);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "FAILURE",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (userExistsAlready == 1) {
        if (responseObj.ResponseCode == 1) {
          console.log("USER LOGGED IN SUUCCESSFULLY");
          resp.send(responseObj);
        } else {
          console.log("NOT LOGGED IN");
          resp.send(responseObj);
        }
      } else {
        console.log("NOT LOGGED IN");
        resp.send(responseObj);
      }
    }
  }
}

async function changePassword(req, resp) {
  let connection;
  const saltRounds = 5;
  const salt = bcrypt.genSaltSync(saltRounds);

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let user_id = req.body.USER_ID;
    let old_password = req.body.OLD_PASSWORD;
    let new_password = req.body.NEW_PASSWORD;

    let userCheckQuery = "SELECT * FROM USERS WHERE USER_ID = :user_id";
    let userInfo = await connection.execute(userCheckQuery, [user_id], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    console.log(userInfo);
    let passwordKey = userInfo.rows[0].PASSWORD_KEY;
    let passwordCorrect = bcrypt.compareSync(old_password, passwordKey);

    if (passwordCorrect) {
      const hash = bcrypt.hashSync(new_password, salt);

      let setPasswordQuery =
        "UPDATE USERS SET PASSWORD_KEY = :hash WHERE USER_ID = :user_id";
      let setPasswordResult = await connection.execute(
        setPasswordQuery,
        [hash, user_id],
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );

      connection.commit();

      responseObj = {
        ResponseCode: 1,
        ResponseDesc: "SUCCESS",
        ResponseStatus: resp.statusCode,
        UserId: user_id,
        PasswordKey: hash,
      };
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "PASSWORD INCORRECT",
        ResponseStatus: resp.statusCode,
      };
    }
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
    resp.send(responseObj);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
        resp.send(responseObj);
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "FAILURE",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
    }
  }
}

async function updateUserInfo(req, resp) {
  let connection;
  const saltRounds = 5;
  const salt = bcrypt.genSaltSync(saltRounds);

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let user_id = req.body.USER_ID;
    let user_password = req.body.PASSWORD;
    let userName = req.body.USER_NAME;
    let mobile = req.body.MOBILE;

    let userCheckQuery = "SELECT * FROM USERS WHERE USER_ID = :user_id";
    let userInfo = await connection.execute(userCheckQuery, [user_id], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    console.log(userInfo);
    let passwordKey = userInfo.rows[0].PASSWORD_KEY;
    if (passwordKey == user_password) {
      if (!userName || userName == "") {
        userName = userInfo.rows[0].USER_NAME;
      }
      if (!mobile || mobile == "") {
        mobile = userInfo.rows[0].MOBILE;
      }
      let setUserInfoQuery =
        "UPDATE USERS SET USER_NAME = :userName, MOBILE = :mobile WHERE USER_ID = :user_id";
      let setUserInfoResult = await connection.execute(
        setUserInfoQuery,
        [userName, mobile, user_id],
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );
      console.log(setUserInfoResult);

      connection.commit();

      responseObj = {
        ResponseCode: 1,
        ResponseDesc: "SUCCESS",
        ResponseStatus: resp.statusCode,
        UserId: user_id,
        PasswordKey: user_password,
        UserName: userName,
        Mobile: mobile,
        Email: userInfo.rows[0].EMAIL,
      };
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "PASSWORD INCORRECT",
        ResponseStatus: resp.statusCode,
      };
    }
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
    resp.send(responseObj);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
        resp.send(responseObj);
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "FAILURE",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
    }
  }
}

async function addEmployee(req, resp) {
  let connection;
  let syRegisterUsers = 1;

  const saltRounds = 5;
  const salt = bcrypt.genSaltSync(saltRounds);

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let user_name = req.body.USER_NAME;
    let email = req.body.EMAIL;
    let user_password = req.body.PASSWORD;
    let mobile = req.body.MOBILE;
    let gender = req.body.GENDER;
    let job_id = req.body.JOB_ID;
    let user_type_id = 2; //EMPLOYEE

    let userCheckQuery = "SELECT * FROM USERS WHERE EMAIL = :email";
    let user_exists = await connection.execute(userCheckQuery, [email], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    console.log(user_exists);

    if (user_exists.rows.length == 0) {
      //user does not exist
      console.log("user does not exist");
      userExistsAlready = false;

      //Get Next User Id
      let user_id;
      await syRegister
        .getNextId(connection, syRegisterUsers)
        .then(function (data) {
          user_id = data;
        });

      console.log(user_id);
      const hash = bcrypt.hashSync(user_password, salt);

      let userInsertQuery =
        "INSERT INTO USERS (USER_ID, USER_NAME, EMAIL, PASSWORD_KEY, MOBILE, GENDER, USER_TYPE_ID) VALUES( :user_id, :user_name, :email, :hash, :mobile, :gender, :user_type_id)";
      let userInsertResult = await connection.execute(userInsertQuery, [
        user_id,
        user_name,
        email,
        hash,
        mobile,
        gender,
        user_type_id,
      ]);

      console.log(userInsertResult);

      join_date = new Date();

      let employeeInsertQuery =
        "INSERT INTO USER_EMPLOYEE (USER_ID, JOIN_DATE, JOB_ID) VALUES( :user_id, :join_date, :job_id)";
      employeeInsertResult = await connection.execute(employeeInsertQuery, [
        user_id,
        join_date,
        job_id,
      ]);

      console.log(employeeInsertResult);

      connection.commit();

      responseObj = {
        ResponseCode: 1,
        ResponseDesc: "SUCCESS",
        ResponseStatus: resp.statusCode,
        Username: user_name,
        UserType: 2,
        UserId: user_id,
        Email: email,
        PasswordKey: hash,
        Mobile: mobile,
        Gender: gender,
        JobID: job_id,
      };
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "USER EXISTS ALREADY",
        ResponseStatus: resp.statusCode,
      };
    }
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
    resp.send(responseObj);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
        resp.send(responseObj);
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "Error closing connection",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "SOMETHING WENT WRONG",
        ResponseStatus: resp.statusCode,
      };
      resp.send(responseObj);
    }
  }
}

async function getJobs(req, resp) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    jobSelectQuery = "SELECT * FROM JOBS";
    let jobSelectResult = await connection.execute(jobSelectQuery, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    if (jobSelectResult.rows.length === 0) {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "NO DATA FOUND",
        ResponseStatus: resp.statusCode,
      };
    } else {
      let jobObject = [];
      for (let i = 0; i < jobSelectResult.rows.length; i++) {
        let jobItem = jobSelectResult.rows[i];

        jobObject.push({
          JobID: jobItem.JOB_ID,
          JobTitle: jobItem.JOB_TITLE,
          Salary: jobItem.SALARY,
        });
      }
      responseObj = {
        ResponseCode: 1,
        ResponseDesc: "SUCCESS",
        ResponseStatus: resp.statusCode,
        Jobs: jobObject,
      };
    }
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
    resp.send(responseObj);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
        resp.send(responseObj);
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
    } else {
      console.log("NOT FOUND");
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "NOT FOUND",
        ResponseStatus: resp.statusCode,
      };
      resp.send(responseObj);
    }
  }
}

async function getUserInfo(req, resp) {
  let connection;

  const saltRounds = 5;
  const salt = bcrypt.genSaltSync(saltRounds);

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let user_id = req.body.USER_ID;

    let userQuery = "SELECT * FROM USERS WHERE USER_ID = :user_id";
    let userResult = await connection.execute(userQuery, [user_id], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    let user = userResult.rows[0];
    let user_type_id = user.USER_TYPE_ID;

    if (user_type_id == 1) {
      let readerQuery = "SELECT * FROM USER_READERS WHERE USER_ID = :user_id";
      let readerResult = await connection.execute(readerQuery, [user_id], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      let reader = readerResult.rows[0];

      let rentalQuery = "SELECT * FROM RENTAL_HISTORY WHERE USER_ID = :user_id";
      let rentalResult = await connection.execute(rentalQuery, [user_id], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      let rentalObject = [];
      if (rentalResult.rows.length != 0) {
        for (let j = 0; j < rentalResult.rows.length; j++) {
          let rentalId = rentalResult.rows[j].RENTAL_HISTORY_ID;
          let bookCopyId = rentalResult.rows[j].BOOK_COPY_ID;

          let bookInfoQuery =
            "SELECT * FROM BOOKS b, BOOK_COPY bc WHERE bc.BOOK_COPY_ID = :bookCopyId AND b.BOOK_ID = bc.BOOK_ID";
          let bookInfoResult = await connection.execute(
            bookInfoQuery,
            [bookCopyId],
            {
              outFormat: oracledb.OUT_FORMAT_OBJECT,
            }
          );

          let bookInfo = bookInfoResult.rows[0];
          let book_id = bookInfo.BOOK_ID;

          authorSelectQuery =
            "SELECT * FROM BOOKS_AUTHORS WHERE BOOK_ID = :book_id";
          let authorSelectResult = await connection.execute(
            authorSelectQuery,
            [book_id],
            {
              outFormat: oracledb.OUT_FORMAT_OBJECT,
            }
          );

          let authorObject = [];
          if (authorSelectResult.rows.length != 0) {
            for (let j = 0; j < authorSelectResult.rows.length; j++) {
              let authorId = authorSelectResult.rows[j].AUTHOR_ID;
              let authorQuery =
                "SELECT AUTHOR_NAME FROM AUTHOR WHERE AUTHOR_ID = :authorId";
              authorNameResult = await connection.execute(
                authorQuery,
                [authorId],
                {
                  outFormat: oracledb.OUT_FORMAT_OBJECT,
                }
              );
              let authorName = authorNameResult.rows[0].AUTHOR_NAME;
              authorObject.push({
                AuthorId: authorId,
                AuthorName: authorName,
              });
            }
          }

          let publisherId = bookInfo.PUBLISHER_ID;
          let publisherName;
          if (publisherId != undefined) {
            let publisherQuery =
              "SELECT PUBLISHER_NAME FROM PUBLISHER WHERE PUBLISHER_ID = :publisherId";
            publisherName = await connection.execute(
              publisherQuery,
              [publisherId],
              {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
              }
            );
            publisherName = publisherName.rows[0].PUBLISHER_NAME;
          }

          genreSelectQuery =
            "SELECT * FROM BOOKS_GENRE WHERE BOOK_ID = :book_id";
          let genreSelectResult = await connection.execute(
            genreSelectQuery,
            [book_id],
            {
              outFormat: oracledb.OUT_FORMAT_OBJECT,
            }
          );

          let genreObject = [];
          if (genreSelectResult.rows.length != 0) {
            for (let j = 0; j < genreSelectResult.rows.length; j++) {
              let genreId = genreSelectResult.rows[j].GENRE_ID;
              let genreQuery =
                "SELECT GENRE_NAME FROM GENRE WHERE GENRE_ID = :genreId";
              genreNameResult = await connection.execute(
                genreQuery,
                [genreId],
                {
                  outFormat: oracledb.OUT_FORMAT_OBJECT,
                }
              );
              let genreName = genreNameResult.rows[0].GENRE_NAME;
              genreObject.push({
                GenreId: genreId,
                GenreName: genreName,
              });
            }
          }

          let bookObject = [];
          bookObject.push({
            BookID: bookInfo.BOOK_ID,
            Title: bookInfo.BOOK_TITLE,
            YearOfPublication: bookInfo.YEAR_OF_PUBLICATION,
            Description: bookInfo.DESCRIPTION,
            Language: bookInfo.LANGUAGE,
            Publisher: bookInfo.PUBLISHER_ID,
            ISBN: bookInfo.ISBN,
            Edition: bookInfo.EDITION,
            AuthorObject: authorObject,
            GenreObject: genreObject,
            PublisherName: publisherName,
          });

          let fineQuery =
            "SELECT * FROM FINE_HISTORY WHERE RENTAL_HISTORY_ID = :rentalId";
          let fineResult = await connection.execute(fineQuery, [rentalId], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });
          let fineObject = [];
          if (fineResult.rows.length != 0) {
              for (let j = 0; j < fineResult.rows.length; j++) {
                let fineId = fineResult.rows[j].FINE_HISTORY_ID;
                console.log("fineId = ", fineId);

                fineObject.push({
                  FineId: fineId,
                  FineStartingDate: fineResult.rows[j].FINE_STARTING_DATE,
                  Fee: fineResult.rows[j].FEE_AMOUNT,
                  FineStatus: fineResult.rows[j].PAYMENT_STATUS,
                  PaymentDate: fineResult.rows[j].PAYMENT_DATE,
                  RentalId: fineResult.rows[j].RENTAL_HISTORY_ID,
                });
              }
          }

          rentalObject.push({
            RentalId: rentalId,
            BookCopyId: rentalResult.rows[j].BOOK_COPY_ID,
            BookObject: bookObject,
            FineObject: fineObject,
            IssueDate: rentalResult.rows[j].ISSUE_DATE,
            ReturnDate: rentalResult.rows[j].RETURN_DATE,
            RentalStatus: rentalResult.rows[j].RENTAL_STATUS,
          });
        }
      }
      connection.commit();

      responseObj = {
        ResponseCode: 1,
        ResponseDesc: "SUCCESS",
        ResponseStatus: resp.statusCode,
        Username: user.USER_NAME,
        UserType: user.USER_TYPE_ID,
        UserId: user.USER_ID,
        Email: user.EMAIL,
        PasswordKey: user.PASSWORD_KEY,
        Mobile: user.MOBILE,
        Gender: user.GENDER,
        LibraryCardNumber: reader.LIBRARY_CARD_NUMBER,
        MembershipTakenDate: reader.MEMBERSHIP_TAKEN_DATE,
        RentalObject: rentalObject
      };
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "NOT A READER",
        ResponseStatus: resp.statusCode,
      };
    }
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
        resp.send(responseObj);
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "Error closing connection",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "SOMETHING WENT WRONG",
        ResponseStatus: resp.statusCode,
      };
      resp.send(responseObj);
    }
  }
}

async function getEmployees(req, resp) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    employeeSelectQuery = "SELECT * FROM USERS WHERE USER_TYPE_ID = 2";
    let employeeSelectResult = await connection.execute(
      employeeSelectQuery,
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    if (employeeSelectResult.rows.length === 0) {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "NO DATA FOUND",
        ResponseStatus: resp.statusCode,
      };
    } else {
      let employeeObject = [];
      for (let i = 0; i < employeeSelectResult.rows.length; i++) {
        let employeeItem = employeeSelectResult.rows[i];

        let employeeID = employeeItem.USER_ID,
          empSelectQuery =
            "SELECT * FROM USER_EMPLOYEE WHERE USER_ID = :employeeID";
        let empSelectResult = await connection.execute(
          empSelectQuery,
          [employeeID],
          {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          }
        );

        let empItem = empSelectResult.rows[0];
        let jobId = empItem.JOB_ID;

        jobSelectQuery = "SELECT * FROM JOBS WHERE JOB_ID = :jobId";
        let jobSelectResult = await connection.execute(
          jobSelectQuery,
          [jobId],
          {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          }
        );

        let jobItem = jobSelectResult.rows[0];
        let joinDate = empItem.JOIN_DATE;
        joinDate = joinDate.split(" ");
        joinDate = joinDate[0];

        let endDate = empItem.END_DATE;
        if (empItem.END_DATE != null) {
          endDate = endDate.split(" ");
          endDate = endDate[0];
        }

        employeeObject.push({
          EmployeeID: employeeItem.USER_ID,
          EmployeeName: employeeItem.USER_NAME,
          Email: employeeItem.EMAIL,
          Phone: employeeItem.MOBILE,
          Gender: employeeItem.GENDER,
          JobId: empItem.JOB_ID,
          JobTitle: jobItem.JOB_TITLE,
          Salary: jobItem.SALARY,
          JoinDate: joinDate,
          EndDate: endDate,
        });
      }
      responseObj = {
        ResponseCode: 1,
        ResponseDesc: "SUCCESS",
        ResponseStatus: resp.statusCode,
        Employees: employeeObject,
      };
    }
  } catch (err) {
    console.log(err);
    responseObj = {
      ResponseCode: 0,
      ResponseDesc: "FAILURE",
      ResponseStatus: resp.statusCode,
    };
    resp.send(responseObj);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("CONNECTION CLOSED");
        resp.send(responseObj);
      } catch (err) {
        console.log("Error closing connection");
        responseObj = {
          ResponseCode: 0,
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
    } else {
      console.log("NOT FOUND");
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "NOT FOUND",
        ResponseStatus: resp.statusCode,
      };
      resp.send(responseObj);
    }
  }
}

module.exports = {
  signUp,
  signIn,
  adminSignIn,
  changePassword,
  addEmployee,
  getJobs,
  getEmployees,
  getUserInfo,
  updateUserInfo,
};
