const oracledb = require("oracledb");

const server = require("../serverInformation");
const syRegister = require("../util/syRegister");
const dbuser = server.user;
const dbpassword = server.password;
const connectionString = server.connectionString;
let responseObj = {};

async function addBook(req, resp) {
  let connection;
  let syRegisterBooks = 4;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

      let title = req.body.BOOK_TITLE;
      let yearOfPublication = req.body.YEAR;
      let book_description = null;
      if (typeof req.body.DESCRIPTION !== "undefined") {
        book_description = req.body.DESCRIPTION;
      }
      let language = req.body.LANGUAGE;
      let authorArr = req.body.AUTHOR_ID;
      let isbn = req.body.ISBN;
      let publisher_id = req.body.PUBLISHER_ID;
      let genreArr = req.body.GENRE;

      //Get Next Book Id
      let book_id;
      await syRegister
        .getNextId(connection, syRegisterBooks)
        .then(function (data) {
          book_id = parseInt(data);
        });

      console.log(book_id);

      let bookInsertQuery =
        "INSERT INTO BOOKS (BOOK_ID, BOOK_TITLE, YEAR_OF_PUBLICATION, DESCRIPTION, LANGUAGE, PUBLISHER_ID, ISBN) " +
        "VALUES( :book_id, :title, :yearOfPublication, :book_description, :language, :publisher_id, :isbn)";
      let bookInsertResult = await connection.execute(bookInsertQuery, [
        book_id,
        title,
        yearOfPublication,
        book_description,
        language,
        publisher_id,
        isbn,
      ]);

      console.log(bookInsertResult);

      for (let i = 0; i < authorArr.length; i++) {
        author_id = authorArr[i];
        let authorInsertQuery =
          "INSERT INTO BOOKS_AUTHORS(BOOK_ID, AUTHOR_ID) VALUES(:book_id, :author_id)";
        let authorInsertResult = await connection.execute(authorInsertQuery, [
          book_id,
          author_id,
        ]);

        console.log(authorInsertResult);
      }

      for (let i = 0; i < genreArr.length; i++) {
        genre_id = genreArr[i];
        let genreInsertQuery =
          "INSERT INTO BOOKS_GENRE(BOOK_ID, GENRE_ID) VALUES(:book_id, :genre_id)";
        let genreInsertResult = await connection.execute(genreInsertQuery, [
          book_id,
          genre_id,
        ]);

        console.log(genreInsertResult);
      }

      connection.commit();

      responseObj = {
        ResponseCode: 1,
        ResponseDesc: "SUCCESS",
        ResponseStatus: resp.statusCode,
        BookID: book_id,
        Title: title,
        AuthorId: authorArr,
        Genre: genreArr,
        Publisher_id: publisher_id,
        YearOfPublication: yearOfPublication,
        ISBN: isbn,
        Description: book_description,
        Language: language,
      };
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
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (responseObj.ResponseCode == 1) {
        console.log("INSERTED");
        resp.send(responseObj);
      }
    } else {
      console.log("NOT INSERTED");
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "NOT INSERTED",
        ResponseStatus: resp.statusCode,
      };
      resp.send(responseObj);
    }
  }
}

async function getBooks(req, resp) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    bookSelectQuery = "SELECT * FROM BOOKS";
    let bookSelectResult = await connection.execute(bookSelectQuery, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    let bookObject = [];
    for (let i = 0; i < bookSelectResult.rows.length; i++) {
      let bookItem = bookSelectResult.rows[i];

      let book_id = bookItem.BOOK_ID;

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
          authorNameResult = await connection.execute(authorQuery, [authorId], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });
          let authorName = authorNameResult.rows[0].AUTHOR_NAME;
          authorObject.push({
            AuthorId: authorId,
            AuthorName: authorName,
          });
        }
      }

      let publisherId = bookItem.PUBLISHER_ID;
      let publisherName;
      if (publisherId != undefined) {
        let publisherQuery =
          "SELECT PUBLISHER_NAME FROM PUBLISHER WHERE PUBLISHER_ID = :publisherId";
        publisherName = await connection.execute(
          publisherQuery,
          [publisherId],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        publisherName = publisherName.rows[0].PUBLISHER_NAME;
      }

      genreSelectQuery = "SELECT * FROM BOOKS_GENRE WHERE BOOK_ID = :book_id";
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
          genreNameResult = await connection.execute(genreQuery, [genreId], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });
          let genreName = genreNameResult.rows[0].GENRE_NAME;
          genreObject.push({
            GenreId: genreId,
            GenreName: genreName,
          });
        }
      }

      copySelectQuery =
        "SELECT COUNT(BOOK_COPY_ID) AS CNT, BOOK_ID, EDITION FROM BOOK_COPY WHERE STATUS = 1 GROUP BY BOOK_ID, EDITION HAVING BOOK_ID = :book_id";
      let copySelectResult = await connection.execute(
        copySelectQuery,
        [book_id],
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );

      let copyObject = [];
      if (copySelectResult.rows.length != 0) {
        for (let k = 0; k < copySelectResult.rows.length; k++) {
          let copyCount = copySelectResult.rows[k].CNT;
          let edition = copySelectResult.rows[k].EDITION;
          copyObject.push({
            CopyCount: copyCount,
            Edition: edition,
          });
        }
      }

      bookObject.push({
        BookID: book_id,
        Title: bookItem.BOOK_TITLE,
        AuthorObject: authorObject,
        GenreObject: genreObject,
        CopyObject: copyObject,
        Publisher: publisherName,
        CountOfBooks: bookItem.CNT,
        YearOfPublication: bookItem.YEAR_OF_PUBLICATION,
        Description: bookItem.DESCRIPTION,
        Language: bookItem.LANGUAGE,
        Edition: bookItem.EDITION,
        ISBN: bookItem.ISBN,
      });
    }
    responseObj = {
      ResponseCode: 1,
      ResponseDesc: "SUCCESS",
      ResponseStatus: resp.statusCode,
      Books: bookObject,
    };
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
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (responseObj.ResponseCode == 1) {
        console.log("FOUND");
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

async function getBookInfo(req, resp) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let book_id = req.body.BOOK_ID;

    bookSelectQuery = "SELECT * FROM BOOKS b WHERE BOOK_ID = :book_id";
    let bookSelectResult = await connection.execute(
      bookSelectQuery,
      [book_id],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    let bookItem = bookSelectResult.rows[0];
    authorSelectQuery = "SELECT * FROM BOOKS_AUTHORS WHERE BOOK_ID = :book_id";
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
        authorNameResult = await connection.execute(authorQuery, [authorId], {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        let authorName = authorNameResult.rows[0].AUTHOR_NAME;
        authorObject.push({
          AuthorId: authorId,
          AuthorName: authorName,
        });
      }
    }

    let publisherId = bookItem.PUBLISHER_ID;
    let publisherName;
    if (publisherId != undefined) {
      let publisherQuery =
        "SELECT PUBLISHER_NAME FROM PUBLISHER WHERE PUBLISHER_ID = :publisherId";
      publisherName = await connection.execute(publisherQuery, [publisherId], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      publisherName = publisherName.rows[0].PUBLISHER_NAME;
    }

    genreSelectQuery = "SELECT * FROM BOOKS_GENRE WHERE BOOK_ID = :book_id";
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
        genreNameResult = await connection.execute(genreQuery, [genreId], {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        let genreName = genreNameResult.rows[0].GENRE_NAME;
        genreObject.push({
          GenreId: genreId,
          GenreName: genreName,
        });
      }
    }

    copySelectQuery =
      "SELECT COUNT(BOOK_COPY_ID) AS CNT, BOOK_ID, EDITION FROM BOOK_COPY WHERE STATUS = 1 GROUP BY BOOK_ID, EDITION HAVING BOOK_ID = :book_id";
    let copySelectResult = await connection.execute(
      copySelectQuery,
      [book_id],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    let copyObject = [];
    if (copySelectResult.rows.length != 0) {
      for (let k = 0; k < copySelectResult.rows.length; k++) {
        let copyCount = copySelectResult.rows[k].CNT;
        let edition = copySelectResult.rows[k].EDITION;
        copyObject.push({
          CopyCount: copyCount,
          Edition: edition,
        });
      }
    }

    responseObj = {
      ResponseCode: 1,
      ResponseDesc: "SUCCESS",
      ResponseStatus: resp.statusCode,
      BookID: book_id,
      Title: bookItem.BOOK_TITLE,
      AuthorObject: authorObject,
      GenreObject: genreObject,
      CopyObject: copyObject,
      Publisher: publisherName,
      CountOfBooks: bookItem.CNT,
      YearOfPublication: bookItem.YEAR_OF_PUBLICATION,
      Description: bookItem.DESCRIPTION,
      Language: bookItem.LANGUAGE,
      Edition: bookItem.EDITION,
      ISBN: bookItem.ISBN,
    };
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
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (responseObj.ResponseCode == 1) {
        console.log("FOUND");
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

async function getCopyInfo(req, resp) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let copy_id = req.body.COPY_ID;

    copySelectQuery = "SELECT * FROM BOOK_COPY bc WHERE BOOK_COPY_ID = :copy_id";
    let copySelectResult = await connection.execute(
      copySelectQuery,
      [copy_id],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    let book_id = copySelectResult.rows[0].BOOK_ID;

    bookSelectQuery = "SELECT * FROM BOOKS b WHERE BOOK_ID = :book_id";
    let bookSelectResult = await connection.execute(
      bookSelectQuery,
      [book_id],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    let bookItem = bookSelectResult.rows[0];

    authorSelectQuery = "SELECT * FROM BOOKS_AUTHORS WHERE BOOK_ID = :book_id";
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
        authorNameResult = await connection.execute(authorQuery, [authorId], {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        let authorName = authorNameResult.rows[0].AUTHOR_NAME;
        authorObject.push({
          AuthorId: authorId,
          AuthorName: authorName,
        });
      }
    }

    let publisherId = bookItem.PUBLISHER_ID;
    let publisherName;
    if (publisherId != undefined) {
      let publisherQuery =
        "SELECT PUBLISHER_NAME FROM PUBLISHER WHERE PUBLISHER_ID = :publisherId";
      publisherName = await connection.execute(publisherQuery, [publisherId], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      publisherName = publisherName.rows[0].PUBLISHER_NAME;
    }

    genreSelectQuery = "SELECT * FROM BOOKS_GENRE WHERE BOOK_ID = :book_id";
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
        genreNameResult = await connection.execute(genreQuery, [genreId], {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        let genreName = genreNameResult.rows[0].GENRE_NAME;
        genreObject.push({
          GenreId: genreId,
          GenreName: genreName,
        });
      }
    }

    copySelectQuery =
      "SELECT COUNT(BOOK_COPY_ID) AS CNT, BOOK_ID, EDITION FROM BOOK_COPY WHERE STATUS = 1 GROUP BY BOOK_ID, EDITION HAVING BOOK_ID = :book_id";
    copySelectResult = await connection.execute(
      copySelectQuery,
      [book_id],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    let copyObject = [];
    if (copySelectResult.rows.length != 0) {
      for (let k = 0; k < copySelectResult.rows.length; k++) {
        let copyCount = copySelectResult.rows[k].CNT;
        let edition = copySelectResult.rows[k].EDITION;
        copyObject.push({
          CopyCount: copyCount,
          Edition: edition,
        });
      }
    }

    responseObj = {
      ResponseCode: 1,
      ResponseDesc: "SUCCESS",
      ResponseStatus: resp.statusCode,
      CopyId: copy_id,
      BookID: book_id,
      Title: bookItem.BOOK_TITLE,
      AuthorObject: authorObject,
      GenreObject: genreObject,
      CopyObject: copyObject,
      Publisher: publisherName,
      CountOfBooks: bookItem.CNT,
      YearOfPublication: bookItem.YEAR_OF_PUBLICATION,
      Description: bookItem.DESCRIPTION,
      Language: bookItem.LANGUAGE,
      Edition: bookItem.EDITION,
      ISBN: bookItem.ISBN,
    };
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
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (responseObj.ResponseCode == 1) {
        console.log("FOUND");
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

async function addBookCopies(req, resp) {
  let connection;
  let syRegisterCopies = 9;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let book_id = req.body.BOOK_ID;
    let copies = req.body.COPIES;
    let edition = req.body.EDITION;

    //Get Next Copy Id
    let copy_id;
    let nextValueQuery =
      "SELECT SY_REGISTER_NEXTVAL FROM SYSTEM_REGISTER WHERE SY_REGISTER_ID = :syRegisterCopies";
    copy_id = await connection.execute(nextValueQuery, [syRegisterCopies], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    copy_id = copy_id.rows[0].SY_REGISTER_NEXTVAL;

    let i = 0;
    do {
      console.log(copy_id);

      let copyInsertQuery =
        "INSERT INTO BOOK_COPY (BOOK_COPY_ID, EDITION, BOOK_ID) VALUES(:copy_id, :edition, :book_id)";
      let copyInsertResult = await connection.execute(copyInsertQuery, [
        copy_id,
        edition,
        book_id,
      ]);

      console.log(copyInsertResult);

      i = i + 1;
      copy_id = copy_id + 1;
    } while (i < copies);

    let updateValueQuery =
      "UPDATE SYSTEM_REGISTER SET SY_REGISTER_NEXTVAL = :copy_id WHERE SY_REGISTER_ID = :syRegisterCopies";
    let updateValue = await connection.execute(updateValueQuery, [
      copy_id,
      syRegisterCopies,
    ]);

    console.log(updateValue);

    connection.commit();

    responseObj = {
      ResponseCode: 1,
      ResponseDesc: "SUCCESS",
      ResponseStatus: resp.statusCode,
    };
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
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (responseObj.ResponseCode == 1) {
        resp.send(responseObj);
      }
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "FAILURE",
        ResponseStatus: resp.statusCode,
      };
      resp.send(responseObj);
    }
  }
}

async function editBook(req, resp) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let book_id = req.body.BOOK_ID;
    let yearOfPublication = req.body.YEAR;
    let book_description = req.body.DESCRIPTION;
    let language = req.body.LANGUAGE;
    let publisher_id = req.body.PUBLISHER_ID;
    let genreArr = req.body.GENRE;

    console.log(genreArr);

    let bookEditQuery =
      "UPDATE BOOKS SET YEAR_OF_PUBLICATION = :yearOfPublication, DESCRIPTION = :book_description, LANGUAGE = :language, PUBLISHER_ID = :publisher_id WHERE BOOK_ID = :book_id";
    let bookEditResult = await connection.execute(bookEditQuery, [
      yearOfPublication,
      book_description,
      language,
      publisher_id,
      book_id,
    ]);

    let genreDeleteQuery = "DELETE FROM BOOKS_GENRE WHERE BOOK_ID = :book_id";
    let genreDeleteResult = await connection.execute(genreDeleteQuery, [
      book_id,
    ]);

    for (let i = 0; i < genreArr.length; i++) {
      genre_id = genreArr[i];
      let genreInsertQuery =
        "INSERT INTO BOOKS_GENRE(BOOK_ID, GENRE_ID) VALUES(:book_id, :genre_id)";
      let genreInsertResult = await connection.execute(genreInsertQuery, [
        book_id,
        genre_id,
      ]);
    }

    connection.commit();

    responseObj = {
      ResponseCode: 1,
      ResponseDesc: "SUCCESS",
      ResponseStatus: resp.statusCode,
      BookID: book_id,
    };
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
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (responseObj.ResponseCode == 1) {
        resp.send(responseObj);
      }
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "FAILURE",
        ResponseStatus: resp.statusCode,
      };
      resp.send(responseObj);
    }
  }
}

async function deleteBook(req, resp) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    let book_id = req.body.BOOK_ID;

    let bookDeleteQuery =
      "DELETE FROM BOOKS WHERE BOOK_ID = :book_id";
    let bookDeleteResult = await connection.execute(bookDeleteQuery, [
      book_id,
    ]);

    console.log(bookDeleteResult);
    connection.commit();

    responseObj = {
      ResponseCode: 1,
      ResponseDesc: "SUCCESS",
      ResponseStatus: resp.statusCode,
    };
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
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (responseObj.ResponseCode == 1) {
        resp.send(responseObj);
      }
    } else {
      responseObj = {
        ResponseCode: 0,
        ResponseDesc: "FAILURE",
        ResponseStatus: resp.statusCode,
      };
      resp.send(responseObj);
    }
  }
}

async function searchByBook(req, resp) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: dbuser,
      password: dbpassword,
      connectString: connectionString,
    });
    console.log("DATABASE CONNECTED");

    searchString = req.body.SEARCH_KEY;
    searchString = "%" + searchString + "%";

    bookSelectQuery = "SELECT * FROM BOOKS WHERE UPPER(BOOK_TITLE) LIKE UPPER(:searchString)";
    let bookSelectResult = await connection.execute(bookSelectQuery, [searchString], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    let bookObject = [];
    for (let i = 0; i < bookSelectResult.rows.length; i++) {
      let bookItem = bookSelectResult.rows[i];

      let book_id = bookItem.BOOK_ID;

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
          authorNameResult = await connection.execute(authorQuery, [authorId], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });
          let authorName = authorNameResult.rows[0].AUTHOR_NAME;
          authorObject.push({
            AuthorId: authorId,
            AuthorName: authorName,
          });
        }
      }

      let publisherId = bookItem.PUBLISHER_ID;
      let publisherName;
      if (publisherId != undefined) {
        let publisherQuery =
          "SELECT PUBLISHER_NAME FROM PUBLISHER WHERE PUBLISHER_ID = :publisherId";
        publisherName = await connection.execute(
          publisherQuery,
          [publisherId],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        publisherName = publisherName.rows[0].PUBLISHER_NAME;
      }

      genreSelectQuery = "SELECT * FROM BOOKS_GENRE WHERE BOOK_ID = :book_id";
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
          genreNameResult = await connection.execute(genreQuery, [genreId], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });
          let genreName = genreNameResult.rows[0].GENRE_NAME;
          genreObject.push({
            GenreId: genreId,
            GenreName: genreName,
          });
        }
      }

      copySelectQuery =
        "SELECT COUNT(BOOK_COPY_ID) AS CNT, BOOK_ID, EDITION FROM BOOK_COPY WHERE STATUS = 1 GROUP BY BOOK_ID, EDITION HAVING BOOK_ID = :book_id";
      let copySelectResult = await connection.execute(
        copySelectQuery,
        [book_id],
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );

      let copyObject = [];
      if (copySelectResult.rows.length != 0) {
        for (let k = 0; k < copySelectResult.rows.length; k++) {
          let copyCount = copySelectResult.rows[k].CNT;
          let edition = copySelectResult.rows[k].EDITION;
          copyObject.push({
            CopyCount: copyCount,
            Edition: edition,
          });
        }
      }

      bookObject.push({
        BookID: book_id,
        Title: bookItem.BOOK_TITLE,
        AuthorObject: authorObject,
        GenreObject: genreObject,
        CopyObject: copyObject,
        Publisher: publisherName,
        CountOfBooks: bookItem.CNT,
        YearOfPublication: bookItem.YEAR_OF_PUBLICATION,
        Description: bookItem.DESCRIPTION,
        Language: bookItem.LANGUAGE,
        Edition: bookItem.EDITION,
        ISBN: bookItem.ISBN,
      });
    }
    responseObj = {
      ResponseCode: 1,
      ResponseDesc: "SUCCESS",
      ResponseStatus: resp.statusCode,
      Books: bookObject,
    };
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
          ResponseDesc: "ERROR CLOSING CONNECTION",
          ResponseStatus: resp.statusCode,
        };
        resp.send(responseObj);
      }
      if (responseObj.ResponseCode == 1) {
        console.log("FOUND");
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
  addBook,
  getBooks,
  getBookInfo,
  getCopyInfo,
  addBookCopies,
  editBook,
  deleteBook,
  searchByBook
};
