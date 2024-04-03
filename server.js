const express = require("express");
const axios = require("axios");
const app = express();

const WINDOW_SIZE = 10;
let numbers = [];

let fetchInterval;

// Fetch numbers from third-party server and update the numbers array
async function fetchNumbers(accessCode) {
    const options = {
        headers: {
            Authorization: `Bearer ${accessCode}`, // Corrected the string interpolation
        },
    };

    try {
        const res = await axios.get("http://20.244.56.144/test/primes", options);
        const data = res.data.numbers;
        const newNumbers = data.numbers.filter((num) => !numbers.includes(num));
        numbers = [...numbers, ...newNumbers].slice(-WINDOW_SIZE);
    } catch (error) {
        console.error("Error fetching numbers:", error.message);
    }
}

// Start fetching numbers at regular interval
function startFetching(accessCode) {
    fetchInterval = setInterval(() => fetchNumbers(accessCode), 1000); // Fetch every second
}

// Stop fetching numbers
function stopFetching() {
    clearInterval(fetchInterval);
}

// Middleware to calculate average and send response
function calculateAverage(req, res, next) {
    const { numberid } = req.params;
    const qualifiedNumbers = numbers.filter((num) => {
        if (numberid.includes("e")) {
            return num % 2 === 0;
        } else {
            return true; // Return all numbers if numberid doesn't include "e"
        }
    });

    const numbersBefore = numbers.slice();
    const numbersAfter = qualifiedNumbers.slice(-WINDOW_SIZE);

    let average;
    if (qualifiedNumbers.length < WINDOW_SIZE) {
        average =
            qualifiedNumbers.reduce((acc, curr) => acc + curr, 0) /
            qualifiedNumbers.length || 0;
    } else {
        average =
            qualifiedNumbers
                .slice(-WINDOW_SIZE)
                .reduce((acc, curr) => acc + curr, 0) / WINDOW_SIZE;
    }

    res.json({ numbersBefore, numbersAfter, average });
}

// API endpoint
app.get("/numbers/:numberid", calculateAverage);

// Start the server
const PORT = 3000;
const accessCode = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzEyMTU0NDczLCJpYXQiOjE3MTIxNTQxNzMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjUwZGE0MThiLTNjYzctNGU5My04NjVjLTFjYjYxMDZiYTY4ZiIsInN1YiI6ImFhMzM3N0Bzcm1pc3QuZWR1LmluIn0sImNvbXBhbnlOYW1lIjoiQWZmb3JkbWVkIiwiY2xpZW50SUQiOiI1MGRhNDE4Yi0zY2M3LTRlOTMtODY1Yy0xY2I2MTA2YmE2OGYiLCJjbGllbnRTZWNyZXQiOiJZd0xRWEhlQmtQTEFJTURHIiwib3duZXJOYW1lIjoiQXl1c2ggS3VtYXIgUmFpIiwib3duZXJFbWFpbCI6ImFhMzM3N0Bzcm1pc3QuZWR1LmluIiwicm9sbE5vIjoiUkEyMTExMDI5MDEwMDAzIn0.5cQLwvKf-39BVCsnQ1fWyeGBT-ZGFII9OaeM12C9DI4"; // Replace with your access code
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startFetching(accessCode);
});

// Gracefully handle shutdown
process.on("SIGINT", () => {

    clearInterval(fetchInterval);
    server.close(() => {
        console.log("Server stopped");
        process.exit(0);
    });
});
