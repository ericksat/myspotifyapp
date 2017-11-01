// TODO: The code for pause/unpause graphics is confusing and repetitive - have another look at it (standardize with function)
// TODO: What to do when there is no preview_url? How to handle that shit?
// TODO: Separate displays for album and track. Album will show album title and all album tracks in the gallery, track will only show one track in the gallery.
// TODO: Better style the volume slider
// TODO: Reformat code to be clean and nice.
// TODO: Cache template files or store templates in localStorage with expiration date.
// TODO: Popular songs are always in the US. Can we make it more flexible?

const {redirector, returny, hasToken, useRefreshToken} = require("./app/authenticator.js")
const express = require('express')

const PORT = process.env.PORT || 3000;

var app = express();

app.use(express.static(__dirname + '/public'))

app.get("/", (req, res) => {
    res.render('public/index.html')
})

app.get('/hasToken', hasToken)
app.get('/login', redirector);
app.get('/return', returny);
app.get('/refresh_token', useRefreshToken);

var server = app.listen(PORT, () => {
    console.log("Started server on port", PORT)
});
