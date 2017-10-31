"use strict";

var app = {
    accessToken: null,
    templates: {},
    artist: null,
    tracks: null,
    audioInfo: {
        element: null,
        volume: 50,
        id: ""
    },
    fetchTemplates() {
        $.get("/templates/userProfile.html").then((res) => {
            this.templates['userProfile'] = res;
        }).catch((e) => {
            console.log("Failed to fetch template file user")
        })

        $.get("/templates/artistProfile.html").then((res) => {
            this.templates['artistProfile'] = res;
        }).catch((e) => {
            console.log("Failed to fetch template file artist")
        })

        $.get("/templates/gallery.html").then((res) => {
            this.templates['gallery'] = res;
        }).catch((e) => {
            console.log("Failed to fetch template file gallery")
        })
    },
    tryRefreshToken() {
        $.get("/refresh_token").then((res) => {
            if (res.success) {
                this.accessToken = res.accessToken;
                this.getUserDetails();
            } else {
                throw Error("Failed to refresh with token, sorry.")
            }
        }).catch((e) => {
            console.log(e.message)
            $("#loginForm").show()
        })
    },
    getUserDetails() {
        $.get({
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + this.accessToken }
        }).then((res) => {
            // console.log(res)
            let params = {
                name: res.display_name,
                country: res.country,
                email: res.email,
                followers: res.followers.total,
                profilePic: res.images[0].url
            }
            var output = Mustache.render(this.templates['userProfile'], params);
            $("#response").html(output);
            $("#searchForm").show();
            // $("#response").text(JSON.stringify(res, null, 2))
        }).catch((e) => {
            if (e.status === 401) { // Unauthorized
                this.accessToken = null;
                this.tryRefreshToken();
                // $("response").text("Token has expired.")
            } else {
                console.log("Get details error:", e)
            }
        })
    },
    checkToken() {
        $.get('/hasToken').then((res) => {
            // $("#response").text(JSON.stringify(res, null, 2))
            if (res.success) {
                // $("#response").text("Has token")
                this.accessToken = res.accessToken,
                $("#loginForm").hide()
                this.getUserDetails()
            } else {
                throw Error(res.error)
            }
        }).catch((e) => {
            if (e.message !== "No tokens") {
                $("#response").text("Error: " + e.message)
            }
        })
    },
    renderArtistProfile() {
        let params = {
            name: this.artist.name,
            followers: this.artist.followers.total,
            popularity: this.artist.popularity,
            image: this.artist.images[1].url,
            genres: this.artist.genres
        }
        // console.log(params)
        var output = Mustache.render(this.templates['artistProfile'], params);
        $("#artistProfile").html(output);
    },
    renderGallery() {
        let params = [];
        for (let track of this.tracks) {
            params.push({
                image: track.album.images[1].url,
                previewUrl: track.preview_url,
                name: track.name,
                id: track.id
            })
        }
        let output = Mustache.render(this.templates['gallery'], {tracks: params} );
        $("#gallery").html(output);
    },
    searchSpotify(value, type) {
        const BASE_URL = 'https://api.spotify.com/';
        const searchValue = encodeURIComponent(value);
        const FETCH_URL = `${BASE_URL}v1/search?q=${searchValue}&type=${type}&limit=1`;
        const ALBUM_URL = `${BASE_URL}v1/artists/`;

        var myOptions = {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + this.accessToken
            },
            mode: 'cors',
            cache: 'default'
        };

        fetch(FETCH_URL, myOptions)
            .then(response => response.json())
            .then(json => {
                if (!json.artists) throw Error(`Artist ${value} not found.`)
                const artist = json.artists.items[0];
                if (artist.images.length === 0) {
                    throw Error("No artist results, please try another search.")
                }
                // console.log(artist)
                this.artist = artist;
                this.renderArtistProfile()
                let albumsUrl = `${BASE_URL}v1/artists/${artist.id}/top-tracks?country=US`
                return fetch(albumsUrl, myOptions)
            })
            .then(response => response.json())
            .then(json => {
                const { tracks } = json;
                this.tracks = tracks;
                // console.log("Tracks", this.tracks)
                this.renderGallery()
            })
            .catch((e) => {
                alert("Problem: " + e.message)
            })
    },
    pauseTrack() {
        this.audioInfo.element.pause();
        // Switch display on play/pause DOM element
        let inner = $(`#inner_${this.audioInfo.id}`);
        inner.find("span[data-role=play]").removeClass("hidden")
        inner.find("span[data-role=pause]").addClass("hidden")
    },
    unpauseTrack() {
        this.audioInfo.element.play();
        // Switch display on play/pause DOM element
        let inner = $(`#inner_${this.audioInfo.id}`);
        inner.find("span[data-role=play]").addClass("hidden")
        inner.find("span[data-role=pause]").removeClass("hidden")
    },
    playTrack(url, id) {
        // console.log("Playing url", url)
        if (!this.audioInfo.element) {
            this.audioInfo.element = document.createElement("AUDIO");
            this.audioInfo.element.id = "audio";
            document.body.appendChild(this.audioInfo.element)
            this.audioInfo.element.onended = () => {
                let inner = $(`#inner_${this.audioInfo.id}`);
                inner.find("span[data-role=play]").removeClass("hidden")
                inner.find("span[data-role=pause]").addClass("hidden")
            };
        }

        let audio = this.audioInfo.element;

        if (url === audio.currentSrc) { // Play/pause current
            if (audio.paused || audio.ended) {
                return this.unpauseTrack();
            } else {
                return this.pauseTrack();
            }
        }
        // New track
        if(audio.currentSrc && !audio.paused && !audio.ended) {
            console.log("Pausing previous track");
            this.pauseTrack()
        }

        audio.volume = this.audioInfo.volume / 100;
        audio.src = url;
        this.audioInfo.id = id;
        this.unpauseTrack()
    },
    updateVolume(volume) {
        this.audioInfo.volume = parseInt(volume);
        if  (this.audioInfo.element) {
            this.audioInfo.element.volume = volume / 100;
        }
    }
};