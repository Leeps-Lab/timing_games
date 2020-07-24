# timing_games
Timing Games project for oTree

Session Config:

```
dict(
    name='timing_games',
    display_name="Timing Games",
    num_demo_participants=4,
    app_sequence=['timing_games'],
    config_file='demo.csv',
)
```

Config fields (default otree-redwood functionality fields excluded):

* players_per_group: Sets the number of players per group (if the number of players is not divisible, the remainder forms a group)
* enablePayoffLandscape: Toggles whether the payoff landscape is visible
* others_bubbles: Determines behavior of other bubbles' payoff display
    * payoff: Show strategy and observed payoffs
    * strategy: Show only strategy
    * none: Other bubbles are not shown
* updateRate: Tick rate for time smoothing (in milliseconds)
* xMin/xMax: x-axis bounds
* yMin/yMax: y-axis bounds
* lambda/gamma/rho: Parameters for payoff function
* constantH: Half-life constant for time smoothing
* bandwidth: Range of landscape around players to average for spatial smoothing
* smoothing: Determines landscape behavior
    * none: Default behavior
    * temporal: Enables time smoothing
    * spatial: Enables spatial smoothing
    * both: Enables both types of smoothing
* sample_size: Determines the number of players to sample from for landscape calculation (-1 for no sampling)
* constantE: Constant for calculating purification (-1 for no purification)
* trembling: Constant for trembling (-1 for no trembling)

Easy access link for Jupyter-Notebook binder:
https://mybinder.org/v2/gh/Leeps-Lab/timing_games/master
