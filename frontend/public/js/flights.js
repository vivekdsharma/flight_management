// public/js/flights.js
async function searchFlights(from, to) {
    const res = await fetch(`/api/flights/search?from=${from}&to=${to}`);
    const flights = await res.json();
    console.log(flights);
    // Ab tu flights ko DOM mein render kar sakta hai
  }
  