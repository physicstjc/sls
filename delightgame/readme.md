# DeLight

A two-player circuit strategy game with three computer-opponent difficulty
levels, physics-based bulb brightness, player score recording, and a shared
Firebase leaderboard.

Open `index.html` through the repository's GitHub Pages site to play.

The in-game Physics Lab explains the power calculation, series and parallel
bulbs, junction equations, and short circuits with equations rendered by
KaTeX. The interface uses a playful, rounded visual system designed for
younger learners.

Human player results are stored in the `delight_players` collection in the
`h2-physics` Firebase project. A player's points for a match are their total
brightness minus their opponent's total brightness. Points accumulate under
one case-insensitive, normalized name; computer opponents are never recorded.
The included Firestore rules allow public reads and validated transactional
updates while preventing arbitrary score replacement and deletion.
