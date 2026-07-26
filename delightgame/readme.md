# DeLight

A two-player circuit strategy game with three computer-opponent difficulty
levels, physics-based bulb brightness, player score recording, and a shared
Firebase leaderboard.

Open `index.html` through the repository's GitHub Pages site to play.

Scores are stored in the `delight_scores` collection in the `h2-physics`
Firebase project. The included Firestore rules allow public reads and
validated score creation while blocking score updates and deletions.
