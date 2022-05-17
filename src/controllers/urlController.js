const urlModel = require("../models/urlModel")
const validator = require("../validator/validator")
const shortid = require('shortid');
const urlValidator = require('valid-url');

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
        if (!urlValidator.isUri(data.longUrl)) {
            return res.status(400).send({ status: false, msg: "Not a valid URL" })
        }

        // Finding the inputted longUrl from db
        let findURL = await urlModel.findOne({ longUrl: data.longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 });

        // If the inputted longUrl finds in db, then it will return the match document
        if (findURL) {
            return res.status(200).send({ data: findURL })
        } else {
            // Generating new short id
            let urlCode = shortid.generate();
            let shortUrl = baseUrl + '/' + urlCode  // Example - http://localhost:3000/aUHd0r0-z

            data.urlCode = urlCode;
            data.shortUrl = shortUrl

            // Creating a new URL document
            let createShortURL = await urlModel.create(data)

            if (createShortURL) {
                let responseData = await urlModel.findOne({ _id: createShortURL })
                    .select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 });

                // Giving response
                return res.status(201).send({ data: responseData })
            }

        }

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}


const redirectURL = async function (req, res) {
    try {
        // Taking input from path params
        let data = req.params.urlCode

        // Finding the URL document in db, with the inputted urlCode
        let findLongURL = await urlModel.findOne({ urlCode: data })//.select({ _id: 0, longUrl: 1 })

        if (findLongURL) {
            // res.status(302).send({ data: findLongURL })

            // Redirecting the longUrl in response
            return res.redirect(findLongURL.longUrl)
        } else {
            return res.status(404).send({ message: "No URL Found" })
        }

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.shortUrl = shortUrl
module.exports.redirectURL = redirectURL