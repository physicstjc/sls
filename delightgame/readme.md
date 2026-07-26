# DeLight

A two-player circuit strategy game with three computer-opponent difficulty
levels, physics-based bulb brightness, player score recording, and a shared
Firebase leaderboard.

Open `index.html` through the repository's GitHub Pages site to play.

The in-game Physics Lab explains the power calculation, series and parallel
bulbs, junction equations, and short circuits with equations rendered by
KaTeX. The interface uses a playful, rounded visual system designed for
younger learners.

Scores are stored in the `delight_scores` collection in the `h2-physics`
Firebase project. The included Firestore rules allow public reads and
validated score creation while blocking score updates and deletions.
