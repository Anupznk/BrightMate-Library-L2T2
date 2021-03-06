window.onload = async () => {
  if (sessionStorage.getItem("adminId") == null) {
    window.location.replace("/");
  }

  const Admin_Name = sessionStorage.getItem("adminName");

  document.getElementById("admin_name").innerHTML = Admin_Name;
  document.getElementById(
    "mainContents"
  ).innerHTML = `<h1> Welcome, ${Admin_Name} </h1>`;
};

const logout = async () => {
  if (sessionStorage.getItem("adminId") != null) {
    sessionStorage.removeItem("adminId");
    sessionStorage.removeItem("adminName");
    sessionStorage.removeItem("adminPassword");
    window.location.replace("/adminPanel");
  }
};

$(function () {
  $("li").click(function () {
    // remove classes from all
    $("li").removeClass("nav-item");
    $("li").children().removeClass("active");
    $("li").children().addClass("text-white");
    // add class to the one we clicked
    $(this).children().removeClass("text-white");
    $(this).children().addClass("active");
  });
});

const home = async () => {
  const MainContent = document.getElementById("mainContents");
  const Admin_Name = sessionStorage.getItem("adminName");
  let design = `<h1> Welcome, ${Admin_Name} </h1>`;

  MainContent.innerHTML = design;
};

const bookList = async () => {
  const MainContent = document.getElementById("mainContents");
  const response = await fetch("http://localhost:5000/api/getBooks", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  
  let ResponseObj = await response.json();
  console.log(ResponseObj);

  let design = `<div class="row"> 
  <h2 align="center"> BOOKS </h2> 
  </div> 
  
  <div class="row" style="align-items:center;">
<input style="width:88%;" type="text" id="searchString" name="searchString" value="" placeholder="Search...."> 
<button style="width:7%;" onclick="searchByBook()" class="btn btn-primary m-3">
<i class="fa fa-search"></i>
</button>
</div>

<div class="row">
  <p align="center">
  <button style="width:50%;" class="btn btn-info" onclick="openAddNewBookModal()" data-bs-toggle="modal" data-bs-target="#addNewBookModal"> Add A New Book</button>
  </p>
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Book ID</th>
                        <th scope="col">Title</th>
                        <th scope="col">Authors</th>
                        <th scope="col">Publisher</th>
                        <th scope="col">ISBN</th>
                        <th scope="col">Genre</th>
                        <th scope="col">Copies</th>
                        <th scope="col">Year</th>
                        <th scope="col">Language</th>
                        <th scope="col">Action</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.Books.forEach((element) => {
    let authors = "";
    for (let i = 0; i < element.AuthorObject.length; i++) {
      authors = authors + element.AuthorObject[i].AuthorName + ", ";
    }
    let genre = "";
    for (let i = 0; i < element.GenreObject.length; i++) {
      genre = genre + element.GenreObject[i].GenreName + ", ";
    }
    let copyCount = 0;
    for (let i = 0; i < element.CopyObject.length; i++) {
      copyCount = copyCount + element.CopyObject[i].CopyCount;
    }

    design += `<tr>
                        <th scope="row">${count}</th>
                        <td id="">${element.BookID}</td>
                        <td>${element.Title}</td>
                        <td>${authors}</td>
                        <td>${element.Publisher}</td>
                        <td>${element.ISBN}</td>
                        <td>${genre}</td>
                        <td>${copyCount}<br>
                        <button id="copies_${element.BookID}" value="${element.BookID}" onclick="openBookCopyModal(this.value)" class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#addBookCopiesModal">Add</button>
                        </td>
                        <td>${element.YearOfPublication}</td>
                        <td>${element.Language}</td>
                        <td>
                        <button id="edit_${element.BookID}" value="${element.BookID}" onclick="editBook(this.value)" class="btn btn-info btn-sm m-1" data-bs-toggle="modal" data-bs-target="#editBookModal">Edit</button>
                        </td>
                    </tr>`;

  /* <button id="delete_${element.BookID}" value="${element.BookID}" onclick="deleteBook(this.value)" class="btn btn-danger btn-sm">Delete</button>*/
    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
};

const editBook = async (bookId) => {
  console.log(bookId);

  //Get Book Info from API
  let bookObj = {
    BOOK_ID: bookId,
  };
  bookObj = JSON.stringify(bookObj);
  console.log(bookObj);

  const response = await fetch("http://localhost:5000/api/getBookInfo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: bookObj,
  });
  ResponseObj = await response.json();
  console.log(ResponseObj);

  let authors = "";
  for (let i = 0; i < ResponseObj.AuthorObject.length; i++) {
    authors = authors + ResponseObj.AuthorObject[i].AuthorName + ", ";
  }

  $("#book_id").val(ResponseObj.BookID);
  $("#title").val(ResponseObj.Title);
  $("#authors").val(authors);
  $("#year").val(ResponseObj.YearOfPublication);
  $("#description").val(ResponseObj.Description);
  $("#language").val(ResponseObj.Language);
  $("#isbn").val(ResponseObj.ISBN);

  
  await showPublishers("publisher");
  await showGenre("genre");
};

const saveBookInfo = async () => {
  let BOOK_ID = $("#book_id").val();
  let YEAR = $("#year").val();
  let DESCRIPTION = $("#description").val();
  let LANGUAGE = $("#language").val();
  let PUBLISHER_ID = $("#publisher").val();
  let GENRE = [];
  var markedCheckbox = document.getElementsByName("genreCheckbox");
  for (var checkbox of markedCheckbox) {
    if (checkbox.checked) GENRE.push(checkbox.value);
  }

  let bookObj = {
    BOOK_ID: BOOK_ID,
    YEAR: YEAR,
    DESCRIPTION: DESCRIPTION,
    LANGUAGE: LANGUAGE,
    PUBLISHER_ID: PUBLISHER_ID,
    GENRE: GENRE,
  };

  console.log(bookObj);

  bookObj = JSON.stringify(bookObj);

  const responseBook = await fetch("http://localhost:5000/api/editBook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: bookObj,
  });

  responseObj = await responseBook.json();
  console.log(responseObj);

  if (responseObj.ResponseCode == 1) {
    window.alert(responseObj.ResponseDesc);
    bookList();
  } else {
    window.alert(responseObj.ResponseDesc);
  }
};

// const deleteBook = async (bookId) => {
//   console.log(bookId);

//   //Get Book Info from API
//   let bookObj = {
//     BOOK_ID: bookId,
//   };
//   bookObj = JSON.stringify(bookObj);
//   console.log(bookObj);

//   const response = await fetch("http://localhost:5000/api/deleteBook", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: bookObj,
//   });
//   ResponseObj = await response.json();
//   if (ResponseObj.ResponseCode == 1) {
//     window.alert(ResponseObj.ResponseDesc);
//     bookList();
//   } else {
//     window.alert(ResponseObj.ResponseDesc);
//   }
// };

const openAddNewBookModal = async () => {
  await showPublishers("new_publisher");
  await showAuthors();
  await showGenre("new_genre");
};

const addNewBook = async () => {
  let BOOK_TITLE = $("#new_title").val();
  let YEAR = $("#new_year").val();
  let ISBN = $("#new_isbn").val();
  let DESCRIPTION = $("#new_description").val();
  let LANGUAGE = $("#new_language").val();
  let PUBLISHER_ID = $("#new_publisher").val();
  let AUTHOR_ID = [];
  var markedCheckbox = document.getElementsByName("new_authorCheckbox");
  for (var checkbox of markedCheckbox) {
    if (checkbox.checked) AUTHOR_ID.push(checkbox.value);
  }
  let GENRE = [];
  var markedCheckbox2 = document.getElementsByName("genreCheckbox");
  for (var checkbox2 of markedCheckbox2) {
    if (checkbox2.checked) GENRE.push(checkbox2.value);
  }

  if (
    BOOK_TITLE != "" &&
    YEAR != "" &&
    ISBN != "" &&
    LANGUAGE != "" &&
    PUBLISHER_ID != "" &&
    AUTHOR_ID.length != 0 &&
    GENRE.length != 0
  ) {
    let bookObj = {
      BOOK_TITLE: BOOK_TITLE,
      YEAR: YEAR,
      DESCRIPTION: DESCRIPTION,
      LANGUAGE: LANGUAGE,
      PUBLISHER_ID: PUBLISHER_ID,
      GENRE: GENRE,
      ISBN: ISBN,
      AUTHOR_ID: AUTHOR_ID,
    };

    console.log(bookObj);

    bookObj = JSON.stringify(bookObj);

    const responseBook = await fetch("http://localhost:5000/api/addBook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: bookObj,
    });

    responseObj = await responseBook.json();
    console.log(responseObj);

    if (responseObj.ResponseCode == 1) {
      window.alert(responseObj.ResponseDesc);
      bookList();
    } else {
      window.alert(responseObj.ResponseDesc);
    }
  } else {
    window.alert("Empty Field");
  }
};

const searchByBook = async () =>{
  const MainContent = document.getElementById("mainContents");
  
  var searchInput = document.getElementById("searchString");
  //if (searchInput && searchString != "") {
    let AUTHOR_OBJECT = [];
    AUTHOR_OBJECT.push({
      IS_AUTHOR_FILTER : 0,
      AUTHOR_ID : ""
    });

    let GENRE_OBJECT = [];
    GENRE_OBJECT.push({
      IS_GENRE_FILTER : 0,
      GENRE_ID : ""
    });

    let YEAR_OBJECT = [];
    YEAR_OBJECT.push({
      IS_YEAR_FILTER : 0,
      YEAR : ""
    });

    let bookObj = {
      SEARCH_KEY: searchInput.value,
      AUTHOR_OBJECT: AUTHOR_OBJECT,
      GENRE_OBJECT: GENRE_OBJECT,
      YEAR_OBJECT: YEAR_OBJECT
    };
  
    console.log(bookObj);
  
    bookObj = JSON.stringify(bookObj);
  
    response = await fetch("http://localhost:5000/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: bookObj,
    });

    let ResponseObj = await response.json();
    console.log(ResponseObj);


    let design = `<div class="row"> 
  <h2 align="center"> BOOKS </h2> 
  </div> 
  
  <div class="row" style="align-items:center;">
  <input style="width:88%;" type="text" id="searchString" name="searchString" value="" placeholder="Search...."> 
  <button style="width:7%;" onclick="searchByBook()" class="btn btn-primary m-3">
  <i class="fa fa-search"></i>
  </button>
  </div>

  <div class="row">
  <p align="center">
  <button style="width:50%;" class="btn btn-info" onclick="openAddNewBookModal()" data-bs-toggle="modal" data-bs-target="#addNewBookModal"> Add A New Book</button>
  </p>
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Book ID</th>
                        <th scope="col">Title</th>
                        <th scope="col">Authors</th>
                        <th scope="col">Publisher</th>
                        <th scope="col">ISBN</th>
                        <th scope="col">Genre</th>
                        <th scope="col">Copies</th>
                        <th scope="col">Year</th>
                        <th scope="col">Language</th>
                        <th scope="col">Action</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.SearchResult.forEach((element) => {
    let authors = "";
    for (let i = 0; i < element.AuthorObject.length; i++) {
      authors = authors + element.AuthorObject[i].AuthorName + ", ";
    }
    let genre = "";
    for (let i = 0; i < element.GenreObject.length; i++) {
      genre = genre + element.GenreObject[i].GenreName + ", ";
    }
    let copyCount = 0;
    for (let i = 0; i < element.CopyObject.length; i++) {
      copyCount = copyCount + element.CopyObject[i].CopyCount;
    }

    design += `<tr>
                        <th scope="row">${count}</th>
                        <td id="">${element.BookID}</td>
                        <td>${element.Title}</td>
                        <td>${authors}</td>
                        <td>${element.Publisher}</td>
                        <td>${element.ISBN}</td>
                        <td>${genre}</td>
                        <td>${copyCount}<br>
                        <button id="copies_${element.BookID}" value="${element.BookID}" onclick="openBookCopyModal(this.value)" class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#addBookCopiesModal">Add</button>
                        </td>
                        <td>${element.YearOfPublication}</td>
                        <td>${element.Language}</td>
                        <td>
                        <button id="edit_${element.BookID}" value="${element.BookID}" onclick="editBook(this.value)" class="btn btn-info btn-sm m-1" data-bs-toggle="modal" data-bs-target="#editBookModal">Edit</button>
                        </td>
                    </tr>`;

    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
  //}
}

const magazineList = async () => {
  const MainContent = document.getElementById("mainContents");

  const response = await fetch("http://localhost:5000/api/getMagazines", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let ResponseObj = await response.json();
  console.log(ResponseObj);

  let design = `<div class="row"> 
  <h2 align="center"> MAGAZINES </h2> 
  </div> 
  <div class="row">
  <p align="center">
  <button style="width:50%;" class="btn btn-info" onclick="openAddNewMagazineModal()" data-bs-toggle="modal" data-bs-target="#addNewMagazineModal"> Add A New Magazine</button>
  </p>
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Magazine ID</th>
                        <th scope="col">Title</th>
                        <th scope="col">Publisher</th>
                        <th scope="col">Genre</th>
                        <th scope="col">Language</th>
                        <th scope="col">Action</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.Magazines.forEach((element) => {
    let genre = "";
    for (let i = 0; i < element.Genre.length; i++) {
      genre = genre + element.Genre[i].GenreName + ", ";
    }

    design += `<tr>
                        <th scope="row">${count}</th>
                        <td id="">${element.MagazineID}</td>
                        <td>${element.MagazineTitle}</td>
                        <td>${element.Publisher}</td>
                        <td>${genre}</td>
                        <td>${element.Language}</td>
                        <td>
                        <button id="edit_${element.MagazineID}" value="${element.MagazineID}" onclick="editMagazine(this.value)" class="btn btn-info btn-sm m-1" data-bs-toggle="modal" data-bs-target="#editMagazineModal">Edit</button>
                        </td>
                    </tr>`;

    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
};

const openAddNewMagazineModal = async () => {
  await showPublishers("new_mag_publisher");
  await showGenre("new_mag_genre");
};

const addNewMagazine = async () => {
  let TITLE = $("#new_mag_title").val();
  let LANGUAGE = $("#new_mag_language").val();
  let PUBLISHER_ID = $("#new_mag_publisher").val();
  let GENRE = [];
  var markedCheckbox2 = document.getElementsByName("genreCheckbox");
  for (var checkbox2 of markedCheckbox2) {
    if (checkbox2.checked) GENRE.push(checkbox2.value);
  }

  if (
    TITLE != "" &&
    LANGUAGE != "" &&
    PUBLISHER_ID != "" &&
    GENRE.length != 0
  ) {
    let magObj = {
      TITLE: TITLE,
      LANGUAGE: LANGUAGE,
      PUBLISHER_ID: PUBLISHER_ID,
      GENRE: GENRE,
    };

    console.log(magObj);

    magObj = JSON.stringify(magObj);

    const responseMagazine = await fetch(
      "http://localhost:5000/api/addMagazine",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: magObj,
      }
    );

    responseObj = await responseMagazine.json();
    console.log(responseObj);

    if (responseObj.ResponseCode == 1) {
      window.alert(responseObj.ResponseDesc);
      magazineList();
    } else {
      window.alert(responseObj.ResponseDesc);
    }
  } else {
    window.alert("Empty Field");
  }
};

const editMagazine = async (magazineId) => {
  console.log(magazineId);

  //Get Magazine Info from API
  let magazineObj = {
    MAGAZINE_ID: magazineId,
  };
  magazineObj = JSON.stringify(magazineObj);
  console.log(magazineObj);

  const response = await fetch("http://localhost:5000/api/getMagazineInfo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: magazineObj,
  });
  ResponseObj = await response.json();
  console.log(ResponseObj);

  $("#edit_mag_id").val(ResponseObj.MagazineID);
  $("#edit_mag_title").val(ResponseObj.MagazineTitle);
  $("#edit_mag_language").val(ResponseObj.Language);
  
  await showPublishers("edit_mag_publisher");
  await showGenre("edit_mag_genre");
};

const saveMagazineInfo = async () => {
  let MAGAZINE_ID = $("#edit_mag_id").val();
  let TITLE = $("#edit_mag_title").val();
  let LANGUAGE = $("#edit_mag_language").val();
  let PUBLISHER_ID = $("#edit_mag_publisher").val();
  let GENRE = [];
  var markedCheckbox = document.getElementsByName("genreCheckbox");
  for (var checkbox of markedCheckbox) {
    if (checkbox.checked) GENRE.push(checkbox.value);
  }

  let magazineObj = {
    MAGAZINE_ID: MAGAZINE_ID,
    TITLE: TITLE,
    LANGUAGE: LANGUAGE,
    PUBLISHER_ID: PUBLISHER_ID,
    GENRE: GENRE,
  };

  console.log(magazineObj);

  magazineObj = JSON.stringify(magazineObj);

  const responseBook = await fetch("http://localhost:5000/api/editMagazine", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: magazineObj,
  });

  responseObj = await responseBook.json();
  console.log(responseObj);

  if (responseObj.ResponseCode == 1) {
    window.alert(responseObj.ResponseDesc);
    magazineList();
  } else {
    window.alert(responseObj.ResponseDesc);
  }
};

const showPublishers = async (docId) => {
  const responsePublishers = await fetch(
    "http://localhost:5000/api/getPublishers",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  ResponseObj = await responsePublishers.json();

  let pubDesign = "";

  ResponseObj.PublisherList.forEach((pub) => {
    pubDesign += `<option value="${pub.PublisherID}">${pub.PublisherName}</option>`;
  });

  document.getElementById(docId).innerHTML = pubDesign;
};

const showAuthors = async () => {
  const responseAuthors = await fetch("http://localhost:5000/api/getAuthors", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  ResponseObj = await responseAuthors.json();

  let authorDesign = "";
  ResponseObj.AuthorList.forEach((author) => {
    authorDesign += `<div class="form-check">
    <input class="form-check-input" type="checkbox" value="${author.AuthorID}" id="new_author_${author.AuthorID}" name="new_authorCheckbox">
    <label class="form-check-label" for="new_author_${author.AuthorID}">
    ${author.AuthorName}
    </label>
    </div>`;
  });
  document.getElementById("new_authors").innerHTML = authorDesign;
};

const showGenre = async (docId) => {
  const responseGenre = await fetch("http://localhost:5000/api/getGenre", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  ResponseObj = await responseGenre.json();

  console.log(ResponseObj);

  let genreDesign = "";
  ResponseObj.GenreList.forEach((genre) => {
    genreDesign += `<div class="form-check">
    <input class="form-check-input" type="checkbox" value="${genre.GenreID}" id="genre_${genre.GenreID}" name="genreCheckbox">
    <label class="form-check-label" for="genre_${genre.GenreID}">
    ${genre.GenreName}
    </label>
    </div>`;
  });
  document.getElementById(docId).innerHTML = genreDesign;
};

const genreList = async () => {
  const MainContent = document.getElementById("mainContents");

  const responseGenre = await fetch("http://localhost:5000/api/getGenre", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  ResponseObj = await responseGenre.json();

  console.log(ResponseObj);
  let design = `<div class="row"> 
  <h2 align="center"> Genre </h2> 
  </div> 
  <div class="row">
  <p align="center">
  <button style="width:50%;" class="btn btn-info" onclick="openAddNewGenreModal()" data-bs-toggle="modal" data-bs-target="#addNewGenreModal"> Add A New Genre</button>
  </p>
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Genre Name</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.GenreList.forEach((element) => {

    design += `<tr>
                        <th scope="row">${count}</th>
                        <td>${element.GenreName}</td>
                    </tr>`;

    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
};

const addNewGenre = async () => {
  let GENRE_NAME = $("#add_new_genre").val();

  if (GENRE_NAME != null) {
    let genreObj = {
      GENRE_NAME: GENRE_NAME
    };

    console.log(genreObj);
    genreObj = JSON.stringify(genreObj);

    const responseBook = await fetch(
      "http://localhost:5000/api/addGenre",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: genreObj,
      }
    );

    ResponseObj = await responseBook.json();
    console.log(ResponseObj);

    if (ResponseObj.ResponseCode == 1) {
      window.alert(ResponseObj.ResponseDesc);
      genreList();
    } else {
      window.alert(responseObj.ResponseDesc);
    }
  } else {
    window.alert("Field empty");
  }
};

const openBookCopyModal = async (bookId) => {
  $("#c_book_id").val(bookId);
};

const addBookCopies = async (bookId) => {
  let BOOK_ID = $("#c_book_id").val();
  let COPIES = $("#copies").val();
  let EDITION = $("#edition").val();

  if (COPIES != null && EDITION != null) {
    let bookObj = {
      BOOK_ID: BOOK_ID,
      COPIES: COPIES,
      EDITION: EDITION,
    };

    console.log(bookObj);
    bookObj = JSON.stringify(bookObj);

    const responseBook = await fetch(
      "http://localhost:5000/api/addBookCopies",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bookObj,
      }
    );

    responseObj = await responseBook.json();
    console.log(responseObj);

    if (responseObj.ResponseCode == 1) {
      window.alert(responseObj.ResponseDesc);
      bookList();
    } else {
      window.alert(responseObj.ResponseDesc);
    }
  } else {
    window.alert("Field empty");
  }
};

const authorList = async () => {
  const MainContent = document.getElementById("mainContents");
  const searchInput = document.getElementById("searchString");
  let response = "";
  if(searchInput && searchInput.value != ""){
    let authorObj = {
      SEARCH_KEY: searchInput.value
    };
  
    console.log(authorObj);
    authorObj = JSON.stringify(authorObj);
  
    response = await fetch("http://localhost:5000/api/searchByAuthor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: authorObj,
    });
  } else{
  response = await fetch("http://localhost:5000/api/getAuthors", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
  let ResponseObj = await response.json();
  console.log(ResponseObj);

  let design = `<div class="row"> 
  <h2 align="center"> AUTHORS </h2> 
  </div> 


  <div class="row" style="align-items:center;">
<input style="width:88%;" type="text" id="searchString" name="searchString" value="" placeholder="Search...."> 
<button style="width:7%;" onclick="authorList()" class="btn btn-primary m-3">
<i class="fa fa-search"></i>
</button>
</div>


  <div class="row">
  <p align="center">
  <button style="width:50%;" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#addNewAuthorModal"> Add A New Author</button>
  </p>
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Author ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Date Of Birth</th>
                        <th scope="col">Date Of Death</th>
                        <th scope="col">Bio</th>
                        <th scope="col">Action</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.AuthorList.forEach((element) => {
    let dateOfBirth = "";
    if (element.DateOfBirth != null) {
      dateOfBirth = element.DateOfBirth;
      dateOfBirth = dateOfBirth.split("T");
      dateOfBirth = dateOfBirth[0];
    }

    let dateOfDeath = "";
    if (element.DateOfDeath != null) {
      dateOfDeath = element.DateOfDeath;
      dateOfDeath = dateOfDeath.split("T");
      dateOfDeath = dateOfDeath[0];
    }

    let bio = "";
    if (element.Bio != null) {
      bio = element.Bio;
    }

    design += `<tr>
                        <th scope="row">${count}</th>
                        <td id="">${element.AuthorID}</td>
                        <td>${element.AuthorName}</td>
                        <td>${dateOfBirth}</td>
                        <td>${dateOfDeath}</td>
                        <td>${bio}</td>
                        <td>
                        <button id="edit_${element.AuthorID}" value="${element.AuthorID}" onclick="editAuthor(this.value)" class="btn btn-info btn-sm m-1" data-bs-toggle="modal" data-bs-target="#editAuthorModal">Edit</button>
                        </td>
                    </tr>`;

    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
};

const editAuthor = async (authorId) => {
  console.log(authorId);

  let authorObj = {
    AUTHOR_ID: authorId,
  };
  authorObj = JSON.stringify(authorObj);
  console.log(authorObj);

  const response = await fetch("http://localhost:5000/api/getAuthorById", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: authorObj,
  });
  ResponseObj = await response.json();
  console.log(ResponseObj);

  let dateOfBirth = "";
  if (ResponseObj.DateOfBirth != null) {
    dateOfBirth = ResponseObj.DateOfBirth.split("T");
    dateOfBirth = dateOfBirth[0];
  }
  let dateOfDeath = "";
  if (ResponseObj.DateOfDeath != null) {
    dateOfDeath = ResponseObj.DateOfDeath.split("T");
    dateOfDeath = dateOfDeath[0];
  }
  console.log(dateOfBirth,"......",dateOfDeath);

  $("#authorId").val(ResponseObj.AuthorID);
  $("#authorName").val(ResponseObj.AuthorName);
  document.getElementById("dateOfBirth").value = dateOfBirth;
  document.getElementById("dateOfDeath").value = dateOfDeath;
  $("#bio").val(ResponseObj.Bio);
};

const saveAuthorInfo = async () => {
  let AUTHOR_ID = $("#authorId").val();
  let AUTHOR_NAME = $("#authorName").val();
  let DATE_OF_BIRTH = $("#dateOfBirth").val();
  let DATE_OF_DEATH = $("#dateOfDeath").val();
  let BIO = $("#bio").val();

  let authorObj = {
    AUTHOR_ID: AUTHOR_ID,
    AUTHOR_NAME: AUTHOR_NAME,
    DATE_OF_BIRTH: DATE_OF_BIRTH,
    DATE_OF_DEATH: DATE_OF_DEATH,
    BIO: BIO,
  };

  console.log(authorObj);

  authorObj = JSON.stringify(authorObj);

  const responseAuthor = await fetch("http://localhost:5000/api/editAuthor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: authorObj,
  });

  responseObj = await responseAuthor.json();
  console.log(responseObj);

  if (responseObj.ResponseCode == 1) {
    window.alert(responseObj.ResponseDesc);
    authorList();
  } else {
    window.alert(responseObj.ResponseDesc);
  }
};

const addNewAuthor = async () => {
  let AUTHOR_NAME = $("#new_authorName").val();
  let DATE_OF_BIRTH = $("#new_dateOfBirth").val();
  let DATE_OF_DEATH = $("#new_dateOfDeath").val();
  let BIO = $("#new_bio").val();

  let authorObj = {
    AUTHOR_NAME: AUTHOR_NAME,
    DATE_OF_BIRTH: DATE_OF_BIRTH,
    DATE_OF_DEATH: DATE_OF_DEATH,
    BIO: BIO,
  };

  console.log(authorObj);
  authorObj = JSON.stringify(authorObj);

  const responseAuthor = await fetch("http://localhost:5000/api/addAuthor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: authorObj,
  });

  responseObj = await responseAuthor.json();
  console.log(responseObj);

  if (responseObj.ResponseCode == 1) {
    window.alert(responseObj.ResponseDesc);
    authorList();
  } else {
    window.alert(responseObj.ResponseDesc);
  }
};

const publisherList = async () => {
  const MainContent = document.getElementById("mainContents");

  const response = await fetch("http://localhost:5000/api/getPublishers", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let ResponseObj = await response.json();
  console.log(ResponseObj);

  let design = `<div class="row"> 
  <h2 align="center"> PUBLISHERS </h2> 
  </div> 
  <div class="row">
  <p align="center">
  <button style="width:50%;" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#addNewPublisherModal"> Add A New Publisher</button>
  </p>
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Publisher ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Address Line</th>
                        <th scope="col">City</th>
                        <th scope="col">Postal Code</th>
                        <th scope="col">Country</th>
                        <th scope="col">Action</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.PublisherList.forEach((element) => {

    let adLine = "";
    if(element.AddressLine != null){
      adLine = element.AddressLine;
    }
    let city = "";
    if(element.City != null){
      city = element.City;
    }
    let postalCode = "";
    if(element.PostalCode != null){
      postalCode = element.PostalCode;
    }
    let country = "";
    if(element.Country != null){
      country = element.Country;
    }

    design += `<tr>
                        <th scope="row">${count}</th>
                        <td id="">${element.PublisherID}</td>
                        <td>${element.PublisherName}</td>
                        <td>${element.Phone}</td>
                        <td>${adLine}</td>
                        <td>${city}</td>
                        <td>${postalCode}</td>
                        <td>${country}</td>
                        <td>
                        <button id="edit_${element.PublisherID}" value="${element.PublisherID}" onclick="editPublisher(this.value)" class="btn btn-info btn-sm m-1" data-bs-toggle="modal" data-bs-target="#editPublisherModal">Edit</button>
                        </td>
                    </tr>`;

    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
};

const editPublisher = async (publisherId) => {
  console.log(publisherId);

  let publisherObj = {
    PUBLISHER_ID: publisherId,
  };
  publisherObj = JSON.stringify(publisherObj);
  console.log(publisherObj);

  const response = await fetch("http://localhost:5000/api/getPublisherById", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: publisherObj,
  });
  ResponseObj = await response.json();
  console.log(ResponseObj);

  $("#publisherId").val(ResponseObj.PublisherID);
  $("#publisherName").val(ResponseObj.PublisherName);
  $("#phone").val(ResponseObj.Phone);
  $("#addressLine").val(ResponseObj.AddressLine);
  $("#city").val(ResponseObj.City);
  $("#postalCode").val(ResponseObj.PostalCode);
  $("#country").val(ResponseObj.Country);
};

const savePublisherInfo = async () => {
  let PUBLISHER_ID = $("#publisherId").val();
  let PUBLISHER_NAME = $("#publisherName").val();
  let PHONE = $("#phone").val();
  let ADDRESS_LINE = $("#addressLine").val();
  let CITY = $("#city").val();
  let POSTAL_CODE = $("#postalCode").val();
  let COUNTRY = $("#country").val();

  let publisherObj = {
    PUBLISHER_ID: PUBLISHER_ID,
    PUBLISHER_NAME: PUBLISHER_NAME,
    PHONE: PHONE,
    ADDRESS_LINE: ADDRESS_LINE,
    CITY: CITY,
    POSTAL_CODE: POSTAL_CODE,
    COUNTRY: COUNTRY,
  };

  console.log(publisherObj);

  publisherObj = JSON.stringify(publisherObj);

  const responsePublisher = await fetch(
    "http://localhost:5000/api/editPublisher",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: publisherObj,
    }
  );

  responseObj = await responsePublisher.json();
  console.log(responseObj);

  if (responseObj.ResponseCode == 1) {
    window.alert(responseObj.ResponseDesc);
    publisherList();
  } else {
    window.alert(responseObj.ResponseDesc);
  }
};

const addNewPublisher = async () => {
  let PUBLISHER_NAME = $("#new_publisherName").val();
  let PHONE = $("#new_phone").val();
  let ADDRESS_LINE = $("#new_addressLine").val();
  let CITY = $("#new_city").val();
  let POSTAL_CODE = $("#new_postalCode").val();
  let COUNTRY = $("#new_country").val();

  let publisherObj = {
    PUBLISHER_NAME: PUBLISHER_NAME,
    PHONE: PHONE,
    ADDRESS_LINE: ADDRESS_LINE,
    CITY: CITY,
    POSTAL_CODE: POSTAL_CODE,
    COUNTRY: COUNTRY,
  };

  console.log(publisherObj);
  publisherObj = JSON.stringify(publisherObj);

  const responsePublisher = await fetch(
    "http://localhost:5000/api/addPublisher",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: publisherObj,
    }
  );

  responseObj = await responsePublisher.json();
  console.log(responseObj);

  if (responseObj.ResponseCode == 1) {
    window.alert(responseObj.ResponseDesc);
    publisherList();
  } else {
    window.alert(responseObj.ResponseDesc);
  }
};

const rentalHistoryList = async () => {
  const MainContent = document.getElementById("mainContents");

  const response = await fetch(
    "http://localhost:5000/api/getAllRentalHistoryList",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  let ResponseObj = await response.json();
  console.log(ResponseObj);

  let design = `<div class="row"> 
  <h2 align="center"> RENTAL HISTORY </h2> 
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">ID</th>
                        <th scope="col">User ID</th>
                        <th scope="col">User Name</th>
                        <th scope="col">Card No.</th>
                        <th scope="col">Book ID</th>
                        <th scope="col">Title</th>
                        <th scope="col">Book Copy ID</th>
                        <th scope="col">Edition</th>
                        <th scope="col">Issue Date</th>
                        <th scope="col">Return Date</th>
                        <th scope="col">Rental Status</th>
                        <th scope="col">Action</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.RentalObject.forEach((element) => {
    let rStatus = element.RentalStatus;
    let stat = "";
    if (rStatus == 1) {
      stat = "Borrowed";
    } else if (rStatus == 2) {
      stat = "Overdue";
    } else if (rStatus == 3) {
      stat = "Due Cleared";
    } else if (rStatus == 4) {
      stat = "Returned";
    }
    let returnDate = "";
    if(element.ReturnDate != null){
      returnDate = element.ReturnDate;
    }
    design += `<tr>
                        <th scope="row">${count}</th>
                        <td id="">${element.RentalId}</td>
                        <td>${element.UserId}</td>
                        <td>${element.UserName}</td>
                        <td>${element.LibraryCardNumber}</td>
                        <td>${element.BookId}</td>
                        <td>${element.BookTitle}</td>
                        <td>${element.BookCopyId}</td>
                        <td>${element.Edition}</td>
                        <td>${element.IssueDate}</td>
                        <td>${returnDate}</td>
                        <td>${stat}</td>`;
    if (rStatus == 1 || rStatus == 3) {
      design += `<td>
                        <button id="return_${element.RentalId}" value="${element.RentalId}" onclick="returnBook(this.value)" class="btn btn-info btn-sm m-1">Return</button>
                        </td>`;
    } else if (rStatus == 2) {
      design += `<td>
                        <button disabled id="return_${element.RentalId}" value="${element.RentalId}" class="btn btn-warning btn-sm m-1">Clear Due First</button>
                        </td>`;
    } else if (rStatus == 4) {
      design += `<td>
                        <button disabled id="${element.RentalId}" value="${element.RentalId}" class="btn btn-secondary btn-sm m-1">Returned</button>
                        </td>`;
    }
    design += `</tr>`;

    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
};

const feeList = async () => {
  const MainContent = document.getElementById("mainContents");

  const response = await fetch(
    "http://localhost:5000/api/getAllFineHistoryList",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  let ResponseObj = await response.json();
  console.log(ResponseObj);

  let design = `<div class="row"> 
  <h2 align="center"> ALL FINE HISTORIES </h2> 
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">ID</th>
                        <th scope="col">User ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Card No.</th>
                        <th scope="col">Rental History ID</th>
                        <th scope="col">Fine Starting Date</th>
                        <th scope="col">Payment Date</th>
                        <th scope="col">Fee Amount</th>
                        <th scope="col">Payment Status</th>
                        <th scope="col">Action</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.FineObject.forEach((element) => {
    let pStatus = element.PaymentStatus;
    let fineStartingDate = element.FineStartingDate;
    if (fineStartingDate != null) {
      fineStartingDate = fineStartingDate.split("T");
      fineStartingDate = fineStartingDate[0];
    }

    let paymentDate = element.PaymentDate;
    if (paymentDate != null) {
      paymentDate = paymentDate.split("T");
      paymentDate = paymentDate[0];
    }

    design += `<tr>
                        <th scope="row">${count}</th>
                        <td id="">${element.FineId}</td>
                        <td>${element.UserId}</td>
                        <td>${element.UserName}</td>
                        <td>${element.LibraryCardNumber}</td>
                        <td>${element.RentalId}</td>
                        <td>${fineStartingDate}</td>
                        <td>${paymentDate}</td>
                        <td>${element.FeeAmount}</td>
                        <td>${element.PaymentStatus}</td>`;
    if (pStatus == 0) {
      design += `<td>
                        <button id="fee_${element.RentalId}" value="${element.RentalId}" onclick="clearDue(this.value)" class="btn btn-warning btn-sm m-1" data-bs-toggle="modal" data-bs-target="#payFeeModal">Clear Due</button>
                        </td>`;
    }
    if (pStatus == 1) {
      design += `<td>
                        <button disabled id="${element.FineId}" value="${element.FineId}" class="btn btn-success btn-sm m-1">Paid</button>
                        </td>`;
    }
    design += `</tr>`;

    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
};

const employeeList = async () => {
  const MainContent = document.getElementById("mainContents");

  const response = await fetch("http://localhost:5000/api/getEmployees", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let ResponseObj = await response.json();
  console.log(ResponseObj);

  let design = `<div class="row"> 
  <h2 align="center"> EMPLOYEES </h2> 
  </div> 
  <div class="row">
  <p align="center">
  <button style="width:50%;" onclick="openNewEmployeeModal()" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#addNewEmployeeModal"> Add A New Employee</button>
  </p>
  </div> 
  <hr>`;

  design += `<table class="table" style="font-size:smaller">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Employee ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Gender</th>
                        <th scope="col">Job</th>
                        <th scope="col">Salary</th>
                        <th scope="col">Join Date</th>
                        <th scope="col">End Date</th>
                    </tr>
                    </thead>
                    <tbody>`;

  let count = 1;
  ResponseObj.Employees.forEach((element) => {
let endDate = "";
if(element.EndDate){
  endDate = element.EndDate;
}
    design += `<tr>
                        <th scope="row">${count}</th>
                        <td id="">${element.EmployeeID}</td>
                        <td>${element.EmployeeName}</td>
                        <td>${element.Email}</td>
                        <td>${element.Phone}</td>
                        <td>${element.Gender}</td>
                        <td>${element.JobTitle}</td>
                        <td>${element.Salary}</td>
                        <td>${element.JoinDate}</td>
                        <td>${endDate}</td>
                    </tr>`;

    count++;
  });

  design += `</tbody>
                </table>`;
  MainContent.innerHTML = design;
};

const openNewEmployeeModal = async () => {
  showJobs();
};

const showJobs = async () => {
  const responseJobs = await fetch("http://localhost:5000/api/getJobs", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  ResponseObj = await responseJobs.json();

  console.log(ResponseObj);

  let jobDesign = "";
  ResponseObj.Jobs.forEach((job) => {
    jobDesign += `<div class="form-check">
    <input class="form-check-input" type="radio" name="new_employee_job"
    value="${job.JobID}" id="job_${job.JobID}">
    <label class="form-check-label" for="job_${job.JobID}">
    ${job.JobTitle}
    </label>
    </div>`;
  });
  document.getElementById("new_employee_jobList").innerHTML = jobDesign;
};

const addNewEmployee = async () => {
  let USER_NAME = $("#new_employee_name").val();
  let EMAIL = $("#new_employee_email").val();
  let PASSWORD = $("#new_employee_password").val();
  let MOBILE = $("#new_employee_mobile").val();

  let GENDER;
  if (document.getElementById("flexRadioMale").checked) {
    GENDER = "Male";
  } else if (document.getElementById("flexRadioFemale").checked) {
    GENDER = "Female";
  } else if (document.getElementById("flexRadioOther").checked) {
    GENDER = "Rather Not Say";
  }

  let JOB_ID;
  let job = document.getElementsByName("new_employee_job");
  for (var i = 0; i < job.length; i++) {
    if (job[i].checked) {
      JOB_ID = job[i].value;
    }
  }

  let employeeObj = {
    USER_NAME: USER_NAME,
    EMAIL: EMAIL,
    PASSWORD: PASSWORD,
    MOBILE: MOBILE,
    GENDER: GENDER,
    JOB_ID: JOB_ID,
  };

  console.log(employeeObj);
  employeeObj = JSON.stringify(employeeObj);

  const responsePublisher = await fetch(
    "http://localhost:5000/api/addEmployee",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: employeeObj,
    }
  );

  responseObj = await responsePublisher.json();
  console.log(responseObj);

  if (responseObj.ResponseCode == 1) {
    window.alert(responseObj.ResponseDesc);
    employeeList();
  } else {
    window.alert(responseObj.ResponseDesc);
  }
};

const returnBook = async (rentId) => {
  let returnObj = {
    RENT_ID: rentId,
  };
  returnObj = JSON.stringify(returnObj);
  console.log(returnObj);

  const response = await fetch("http://localhost:5000/api/returnBook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: returnObj,
  });
  ResponseObj = await response.json();

  if (ResponseObj.ResponseCode == 1) {
    window.alert(ResponseObj.ResponseDesc);
    rentalHistoryList();
  } else {
    window.alert(ResponseObj.ResponseDesc);
  }
};

const clearDue = async (rentId) => {
  let dueObj = {
    RENT_ID: rentId,
  };
  dueObj = JSON.stringify(dueObj);
  console.log(dueObj);

  const response = await fetch("http://localhost:5000/api/clearDue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: dueObj,
  });
  ResponseObj = await response.json();
  if (ResponseObj.ResponseCode == 1) {
    window.alert(ResponseObj.ResponseDesc);
    feeList();
  } else {
    window.alert(ResponseObj.ResponseDesc);
  }
};
