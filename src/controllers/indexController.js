const request = require("request-promise");
const cheerio = require("cheerio");
const { json, errorJson } = require('../utils/response');

exports.index = (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    
    return json(res, {
        maintainer: 'Azhari Muhammad M <azhari.marzan@gmail.com>',
        source: 'https://github.com/azharimm/song-lyrics-api',
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
    const htmlResult = await request.get({
        uri: `${process.env.BASE_URL}/top`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
        },
    });
    const $ = await cheerio.load(htmlResult);
    const hotsongLists = [];
    $(".lf-list__row").each((index, el) => {
        let songId = $(el)
            .children(".lf-list__subtitle")
            .children("a")
            .attr("href")
            
        let artist = $(el)
            .children(".lf-list__title")
            .children("span")
            .text()
            .replace(/\s+/g, "")
            .replace(/([A-Z])/g, " $1")
            .trim();
        let songTitle = $(el)
            .children(".lf-list__subtitle")
            .children("a")
            .text()
            .replace(/\s+/g, "")
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace("Lyrics", "");
        if(index > 0) {
            hotsongLists.push({
                songId: songId.split(".html")[0]
                .replace(/\//g, "-"),
                artist,
                songTitle 
            });
        }
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