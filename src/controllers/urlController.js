const urlModel = require("../models/urlModel")
const validator = require("../validator/validator")
const shortid = require('shortid');
const urlValidator = require('valid-url');

const redis = require('redis');

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    11516,
    "redis-11516.c305.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("jLnxy6ixkbMo1EX5ZjStkNMEPqmZUgXw", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


// To short a long URL
const shortUrl = async function (req, res) {
    try {
        // Taking data from request body
        let data = req.body;
        // Checking request body for empty
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, msg: "Bad request, Provide long URL" })
        }

        // longUrl is a mandatory field
        if (!validator.isValid(data.longUrl)) {
            return res.status(400).send({ status: false, msg: "Provide long URL" })
        }

        // Assignning the base URL
        const baseUrl = 'http://localhost:3000'

        // URL validation
        if (!urlValidator.isWebUri(data.longUrl)) {
            return res.status(400).send({ status: false, msg: "Not a valid URL" })
        }

        let cacheUrl = await GET_ASYNC(`${data.longUrl}`)
        let cacheUrlParse = JSON.parse(cacheUrl)

        if (cacheUrl) {
            return res.status(302).send({ message: "Cached URL", data: cacheUrlParse })
        } else {
            // Finding the inputted longUrl from db
            let findURL = await urlModel.findOne({ longUrl: data.longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 });

            // If the inputted longUrl finds in db, then it will return the match document
            if (findURL) {
                await SET_ASYNC(`${data.longUrl}`, JSON.stringify(findURL))
                return res.status(200).send({ data: findURL })
            } else {
                // Generating new short id
                let urlCode = shortid.generate();
                // Generating short URL
                let shortUrl = baseUrl + '/' + urlCode  // Example - http://localhost:3000/aUHd0r0-z

                data.urlCode = urlCode;
                data.shortUrl = shortUrl

                // Creating a new URL document
                let createShortURL = await urlModel.create(data)

                if (createShortURL) {
                    let responseData = await urlModel.findOne({ _id: createShortURL })
                        .select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 });

                    await SET_ASYNC(`${data.longUrl}`, JSON.stringify(responseData))
                    // Giving response
                    return res.status(201).send({ data: responseData })
                }

            }

        }

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}


// To redirect URL
const redirectURL = async function (req, res) {
    try {
        // Taking input from path params
        let data = req.params.urlCode
        let cacheUrl = await GET_ASYNC(`${data}`)
        let cacheUrlParse = JSON.parse(cacheUrl)

        if (cacheUrl) {
            return res.status(302).redirect(cacheUrlParse)
        } else {
            // Finding the URL document in db, with the inputted urlCode
            let findLongURL = await urlModel.findOne({urlCode: data })

            if (findLongURL) {
                await SET_ASYNC(`${data}`, JSON.stringify(findLongURL.longUrl))

                // Redirecting the longUrl in response
                return res.status(302).redirect(findLongURL.longUrl)

            } else {
                return res.status(404).send({status: false, message: "No URL Found" })
            }
        }

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.shortUrl = shortUrl
module.exports.redirectURL = redirectURL