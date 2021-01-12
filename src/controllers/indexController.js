const request = require("request-promise");
const cheerio = require("cheerio");
const { json } = require('../utils/response');

exports.index = (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    return json(res, {
        maintainer: 'Azhari Muhammad M <azhari.marzan@gmail.com>',
        source: '',
    })
}

exports.hotLyrics = async (req, res) => {
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
            hotsongLists.push({ id, title });
        });
    return json(res, hotsongLists);
}

exports.detailLyrics = async (req, res) => {
    const htmlResult = await request.get(
        `${process.env.BASE_URL}/lyrics/chrisye/kalacintamenggoda.html`
    );
    const $ = await cheerio.load(htmlResult);
    const title = $(".lyricsh").children("h2").text();
    const songTitle = $(".ringtone").next().text();
    const songLyrics = $(".ringtone").next().next().next().next().text();
    return json(res, {
        title,
        songTitle,
        songLyrics
    });
}

exports.searchLyrics = async (req, res) => {
    const htmlResult = await request.get(
        `${process.env.BASE_URL_SEARCH}/search.php?q=kala+cinta+menggoda`
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
                    title
                })
            }
        });

    return json(res, resultLists);
}