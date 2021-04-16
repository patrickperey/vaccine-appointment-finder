/***
 * Copyright © 2021 @patrickperey
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 ***/

/***
 * # Supported websites:
 * - https://www.cvs.com/vaccine/intake/store/cvd-store-select/first-dose-select
 * - https://mhealthcheckin.com/covidappt
 * - https://myturn.ca.gov/location-select
 *
 * # Instructions
 * Copy the text in this file into a text editor
 *
 * ## Instructions for each URLs listed above
 * 1. Update ZIP_CODE and CITY_NAME with your zipcode and city name
 * 2. Select one of the URLs above
 * 3. Open separate browser tab/window for the URLs above (Fill out forms if needed until the URL is correct)
 * 4. Open the browser's Javascript Console (ALT-CMD-j). Reference: https://tinyurl.com/chrome-js-console
 * 5. Select all text in this file
 * 6. Paste inside the Javascript Console
 * 7. Wait for an alarm notifying you of a vaccine appointment availability
 * 8. Check appointments by searching on the website again OR visit the provided URL
 ***/

/* UPDATE ZIP AND CITY */
var ZIP_CODE = 94107;
var CITY_NAME = 'san francisco';



// ------ DO NOT MODIFY AFTER HERE ------



var POLLING_INTERVAL_IN_SECONDS = 5 // seconds
var search = undefined;
var previouslyFound = {
    'cvs': null,
    'safeway': null,
    'myturn': null
};

clear();
console.log('Looking for vaccine🦠💉🔎...')

search = setInterval(() => {
    switch (window.location.host) {
        case "mhealthcheckin.com":
            safeway();
            return;
        case "myturn.ca.gov":
            myTurnCAGov()
            return;
        case "www.cvs.com":
            cvs(); 
            return;       
    }
}, 1000 * POLLING_INTERVAL_IN_SECONDS)

function cvs() {
    return fetch("https://www.cvs.com/Services/ICEAGPV1/immunization/1.0.0/getIMZStores", {
        "headers": {
            "content-type": "application/json",
        },
        "referrer": "https://www.cvs.com/vaccine/intake/store/cvd-store-select/first-dose-select",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": `{"requestMetaData":{"appName":"CVS_WEB","lineOfBusiness":"RETAIL","channelName":"WEB","deviceType":"DESKTOP","deviceToken":"7777","apiKey":"a2ff75c6-2da7-4299-929d-d670d827ab4a","source":"ICE_WEB","securityType":"apiKey","responseFormat":"JSON","type":"cn-dep"},"requestPayloadData":{"selectedImmunization":["CVD"],"distanceInMiles":35,"imzData":[{"imzType":"CVD","ndc":["59267100002","59267100003","59676058015","80777027399"],"allocationType":"1"}],"searchCriteria":{"addressLine":"${ZIP_CODE}"}}}`,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.responseMetaData.statusCode === "0000") {
                checkIfSameData("cvs", data, () => {
                    alarm()
                    console.log("found vaccine🦠💉🎉", "CVS", data)
                    if (data && data.responsePayloadData && data.responsePayloadData.locations) {
                        zip = data.responsePayloadData.locations[0].addressZipCode
                        console.log("Zip Code:", zip)
                    }
    
                    // If on the CVS page with search
                    var button = document.querySelector('#generic > div > div > div.flex-container > button')
                    if (button && button.click) {
                        button.click();
                    }
                })
            }
        })
}

function myTurnCAGov() {
    return fetch("https://api.myturn.ca.gov/public/locations/search", {
        "headers": {
            "content-type": "application/json;charset=UTF-8",
        },
        "referrer": "https://myturn.ca.gov/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": `{"location": {"lat":37.7792355,"lng":-122.4193257}, "fromDate":"${(new Date()).toISOString().slice(0, 10)}","vaccineData":"WyJhM3F0MDAwMDAwMDFBZExBQVUiLCJhM3F0MDAwMDAwMDFBZE1BQVUiLCJhM3F0MDAwMDAwMDFBZ1VBQVUiLCJhM3F0MDAwMDAwMDFBZ1ZBQVUiLCJhM3F0MDAwMDAwMDFBc2FBQUUiXQ==","locationQuery":{"includePools":["${CITY_NAME}","default"]},"doseNumber":1,"url":"https://myturn.ca.gov/location-select"}`,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    })
        .then((res) => res.json())
        .then((data) => {
            return data.locations.filter(datum => datum.openHours.length)
        })
        .then((data) => {
            if (data.length) {
                checkIfSameData("myturn", data, () => {
                    console.log("found vaccine🦠💉🎉", "myturn.ca.gov", data)
                    data.forEach(d => console.log("Address:", d.displayAddress, "URL:", d.externalURL));
                    alarm()
                })
            }
        })
}

function safeway() {
    return fetch(`https://s3-us-west-2.amazonaws.com/mhc.cdn.content/vaccineAvailability.json?v=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
            return data.filter(datum => datum.availability === "yes")
                .filter(f => (f.address.toLowerCase().includes(CITY_NAME.toLowerCase())))
                .filter(f => f.region.toLowerCase().includes('cal'))
        })
        .then((data) => {
            if (data.length) {
                checkIfSameData("safeway", data, () => {
                    console.log("found vaccine🦠💉🎉", "myturn.ca.gov", data)
                    data.forEach(d => console.log("Address:", d.address, "URL:", d.coach_url));
                    alarm()                
                })
            }
        })
}

function alarm() {
    Array(10).fill(1).forEach((e, i) => {
        setTimeout(() => {
            var mp3_url = 'https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3';
            (new Audio(mp3_url)).play();
        }, i * 500);
    })
}

function checkIfSameData(website, data, foundCallback) {
    if (previouslyFound[website] === btoa(data)) {
        return
    }
    previouslyFound[website] = btoa(data);
    foundCallback();
}
