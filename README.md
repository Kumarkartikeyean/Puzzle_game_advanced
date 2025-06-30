Made a simple puzzle project with node.js and express as backend to store the leaderboard (json file)
Used Render to make the backend hosting since git does not support it .
GitHub Pages only hosts static files (HTML, CSS, JS) and cannot run backend/server code like Node.js.

Render is being used to host your backend (server.js), which handles leaderboard data and API requests.
Your frontend (on GitHub Pages) communicates with this backend via HTTP requests to the Render URL.

Summary:

Frontend: Hosted on GitHub Pages (static site)
Backend: Hosted on Render (Node.js server for leaderboard API)
