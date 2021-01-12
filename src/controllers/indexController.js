const request = require("request-promise");
const cheerio = require("cheerio");
const { json, errorJson } = require('../utils/response');

exports.index = (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    
    return json(res, {
        maintainer: 'Azhari Muhammad M <azhari.marzan@gmail.com>',
        source: '',
        hot_lyrics: {
            endpoint: '/hot',
            example: fullUrl+'hot'
        },
        detail_lyrics: {
            endpoint: '/lyrics/:id',
            example: fullUrl+'lyrics/lyrics-chrisye-kalacintamenggoda'
        },
        search_lyrics: {
            endpoint: '/lyrics/search',
            example: fullUrl+'search?q=Kala cinta menggoda'
        }
    });
}

exports.hotLyrics = async (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    const htmlResult = await request.get(`${process.env.BASE_URL}`);
    const $ = await cheerio.load(htmlResult);
    const hotsongLists = [];
    const hotsongs = $(".hotsongs")
        .children(".list-group")
        .children("a")
        .each((index, el) => {
            let id = $(el)
                .attr("href")
                .split("www.azlyrics.com/")[1]
                .split(".html")[0]
                .replace(/\//g, "-");
            let title = $(el).text();
            hotsongLists.push({
                id,
                title,
                lyrics: baseUrl+'/lyrics/'+id
            });
        });
    return json(res, hotsongLists);
}

exports.detailLyrics = async (req, res) => {
    let id = req.params.id;
    if(!id) {
        return errorJson(res, "Mohon isi song id");
    }
    try {
        songId = id.replace(/-/g, "/")+'.html';
        const htmlResult = await request.get(
            `${process.env.BASE_URL}/${songId}`
        );
        const $ = await cheerio.load(htmlResult);
        const title = $(".lyricsh").children("h2").text();
        const songTitle = $(".ringtone").next().text();
        let songLyrics = $(".ringtone").next().next().next().next().text();
        if(!songLyrics) {
            songLyrics = $(".ringtone").next().next().next().next().next().next().text();
        }
        return json(res, {
            title,
            songTitle,
            songLyrics
        });
    } catch (error) {
        return errorJson(res, "Mohon isi id dengan valid id");        
    }
}

exports.searchLyrics = async (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    const { q } = req.query;
    if(!q) {
        return errorJson(res, "Mohon isi query pencarian!");
    }
    const htmlResult = await request.get(
        `${process.env.BASE_URL_SEARCH}/search.php?q=${q}`
    );
    const $ = await cheerio.load(htmlResult);
    const resultLists = [];
    const results = $(".table-condensed")
        .children("tbody")
        .children("tr")
        .each((index, el) => {
            const artist = $(el).children("td").children("b").text();
            const title = $(el).children("td").children("a").text();
            if(artist) {
                const id = $(el)
                    .children("td")
                    .children("a")
                    .attr("href")
                    .split("www.azlyrics.com/")[1]
                    .split(".html")[0]
                    .replace(/\//g, "-");

                resultLists.push({
                    id,
                    artist,
                    title,
                    lyrics: baseUrl+'/lyrics/'+id
                })
            }
        });

    return json(res, resultLists);
}