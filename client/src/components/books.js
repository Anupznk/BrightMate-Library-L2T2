import React, {useEffect, useState} from "react";
import {setLoading, setTransferData, showToast, transferData, userInfo} from "../App";
import {
    Avatar,
    Button,
    Card,
    CardActionArea,
    CardActions,
    CardContent, Chip,
    Grid,
    Icon,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import {MdOutlineAddTask} from "react-icons/md";
import {useNavigate} from "react-router";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import Typography from "@mui/material/Typography";
import axios from "axios";

const Books = (props) => {

    var [isLoaded, setLoaded] = useState(false)
    useEffect(() => {
        setLoaded(false)

        setLoading(true);
        axios.get('/api/getbooks')
            .then((res) => {
                    setLoading(false);
                    if (res.data.ResponseCode !== 0) {
                        setBooks(res.data)
                        showToast("All Books Loaded");
                        setLoaded(true)
                    } else {
                        showToast("Books loading failed");
                    }
                }
            ).catch((e) => {
            console.log(e)
        })


    }, []);

    var navigate = useNavigate();

    const [books, setBooks] = useState({
        ResponseCode: 0,
        ResponseDesc: "",
        Books: []
    });

    function showAllBooks() {
        setLoading(true);
        axios.get('/api/getbooks')
            .then((res) => {
                    setLoading(false);
                    if (res.data.ResponseCode !== 0) {
                        setBooks(res.data)
                        showToast("All Books Loaded");
                        setLoaded(true)
                    } else {
                        showToast("Books loading failed");
                    }
                }
            ).catch((e) => {
            console.log(e)
        })
    }

    function showBookDetails(singleBook) {
        navigate("../bookdetails/" + singleBook.BookID)

        // setTransferData(singleBook)

    }


    return (
        <Grid container spacing={1} padding={1}>
            <Grid item xs={12} md={12}>
                <h2>All Books</h2>
            </Grid>

            <Grid item xs={0} md={2}></Grid>
            <Grid item xs={12} md={8}>
                <div style={{display: "flex", justifyContent: "center"}}>
                    <List>
                        {books.size === null ? <div>No books found</div> :
                            books.Books?.map((book) => (

                                <Card style={{textAlign: 'left', marginBottom: '10px'}}
                                      onClick={() => showBookDetails(book)} key={book.BookID} elevation={0}
                                      sx={{minWidth: 700}}>
                                    <CardActionArea>
                                        <CardContent>

                                            <Grid container padding={1}>
                                                <Grid sx={1} md={1}>
                                                    <ListItemIcon sx={{mb: 1.2}}>
                                                        <Avatar sx={{bgcolor: "#3A7CFF"}}>
                                                            <LibraryBooksIcon/>
                                                        </Avatar>
                                                    </ListItemIcon>
                                                </Grid>

                                                <Grid sx={6} md={8}>
                                                    <b><strong><Typography variant="h6" component="div">
                                                        {book.Title}
                                                    </Typography> </strong></b>
                                                </Grid>
                                            </Grid>

                                            ISBN: {book.ISBN}<br/>

                                            <List>
                                                {book.AuthorObject.map((singleAuthor) => (
                                                    <Chip sx={{mr: 1.5, mt: 1}} label={singleAuthor.AuthorName}
                                                    />
                                                ))}

                                            </List>

                                            {book.CopyObject.length == 0 ?
                                                <Chip sx={{mr: 1.5, mt: 1}} label={"No copies available right now"}
                                                      variant="outlined"/> :
                                                book.CopyObject.map((singleCopy) => (

                                                    <Card elevation={0}>

                                                        <Chip sx={{mr: 1.5, mt: 1, mb: 1}}
                                                              label={"Edition " + singleCopy.Edition }
                                                              variant="outlined"/>

                                                        <Typography color={"#3A7CFF"} variant="body1" component="div">
                                                            {"Copies Available: " + singleCopy.CopyCount}
                                                        </Typography>

                                                    </Card>


                                                ))
                                            }


                                        </CardContent>
                                    </CardActionArea>
                                    {/*<CardActions>*/}
                                    {/*    <center>*/}
                                    {/*        <Button size="large" color="primary">*/}
                                    {/*            <MdOutlineAddTask/>*/}
                                    {/*            &nbsp;&nbsp;&nbsp; Add to collection*/}
                                    {/*        </Button>*/}
                                    {/*    </center>*/}
                                    {/*</CardActions>*/}
                                </Card>
                            ))}


                    </List>
                </div>
            </Grid>

            <Grid item xs={0} md={2}></Grid>

            <Grid item xs={0} md={4}></Grid>

            <Grid item xs={12} md={4}>
                <center>
                    <Button
                        onClick={showAllBooks}
                        variant="contained"
                        id="showAllBooksBtn"
                        disableElevation>
                        {isLoaded ? <div>Refresh list</div> : <div>Show All Books</div>}

                    </Button>
                </center>
            </Grid>
            <Grid item xs={0} md={4}></Grid>
        </Grid>
    );
};

export default Books;
