// TODO: The code for pause/unpause graphics is confusing and repetitive - have another look at it (standardize with function)
// TODO: Separate displays for album and track. Album will show album title and all album tracks in the gallery, track will only show one track in the gallery.
// TODO: Better style the volume slider
// TODO: Reformat code to be clean and nice.
// TODO: Cache template files or store templates in localStorage with expiration date.

const {redirector, returny, hasToken, useRefreshToken} = require("./app/authenticator.js")
const express = require('express')

var app = express();

app.use(express.static(__dirname + '/public'))

app.get("/", (req, res) => {
    res.render('public/index.html')
})

app.get('/hasToken', hasToken)
app.get('/login', redirector);
app.get('/return', returny);
app.get('/refresh_token', useRefreshToken);

var server = app.listen(3000, () => {
    console.log("Started server on port 3000")
});
