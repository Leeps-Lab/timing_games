import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-decision/redwood-decision.js';
import '/static/otree-redwood/src/redwood-period/redwood-period.js';
import './polymer-bubbles/polymer-bubbles.js';
import './polymer-bubbles/payoff-graph.js';
import './polymer-bubbles/strategy-graph.js';
import './polymer-bubbles/bubbles-graph.js';

/*
    This entire document's indentation is awful, as it has been frankensteined
    together from several different source files including an older version of
    itself. As it stands, it's not worth fixing, but I'm sorry if it's inconvenient.

    Likewise, var and let are used somewhat interchangeably due to the long period
    over which this was written.
*/

export class TimingGames extends PolymerElement {
    constructor(){
        super();
    }

    static get template() {
        return html `
            <style>
                .wrapper {
                    width: 1000px;
                    position: absolute;
                    left: 50%;
                    top: 0;
                    margin-left: -500px;
                }

                .wrapper polymer-bubbles {
                    display: block;
                    margin: 0 auto;
                }
            </style>
            <div>
                <polymer-bubbles
                    other-decisions='[[ otherDecisions ]]'
                    my-decision='{{ myDecision }}'
                    payoff-function='[[ _payoffFunction ]]'
                    sampled-decisions='[[ sampledDecisions ]]'
                    lambda='[[ lambda ]]'
                    gamma='[[ gamma ]]'
                    rho='[[ rho ]]'
                    constant-h='[[ constantH ]]'
                    purification='[[ purification ]]'
                    duration='[[ periodLength ]]'
                    enable-payoff-landscape='[[ enablePayoffLandscape ]]'
                    others-bubbles='[[ othersBubbles ]]'
                    smoothing='[[ smoothing ]]'
                    update-rate='[[ updateRate ]]'
                    num-players='[[ playersPerGroup ]]'
                    x-min='[[ xMin ]]'
                    x-max='[[ xMax ]]'
                    y-min='[[ yMin ]]'
                    y-max='[[ yMax ]]'
                    bandwidth='[[ bandwidth ]]'
                    pixel-values='{{ pixelValues }}'
                    sample-size='[[ samepleSize ]]'
                    >
                </polymer-bubbles>
            </div>

            <otree-constants id="constants"></otree-constants>

            <redwood-period
                running="{{ _isPeriodRunning }}"
                on-period-start="_onPeriodStart"
                on-period-end="_onPeriodEnd">
            </redwood-period>

            <redwood-decision
                initial-decision="[[ initialDecision ]]"
                my-decision="{{ myDecision }}"
                group-decisions="{{ groupDecisions }}"
                max-per-second="10">
            </redwood-decision>
        `
    }

    static get properties() {
        return {
            initialDecision: {
              type: Number,
            },
            myDecision: {
              type: Number,
            },
            groupDecisions: {
              type: Object,
            },
            otherDecisions: {
              type: Array,
              computed: "_getOtherDecisions(groupDecisions)",
            },
            sampledDecisions: {
              type: Array,
            },
            enablePayoffLandscape: {
              type: Boolean,
              value: false,
            },
            othersBubbles: {
              type: String,
            },
            smoothing: {
              type: String,
            },
            updateRate: {
              type: Number,
            },
            pixelValues: {
              type: Array,
              value: [],
              notify: true,
            },
            playersPerGroup: {
              type: Number,
            },
            xMin: {
              type: Number,
            },
            xMax: {
              type: Number,
            },
            yMin: {
              type: Number,
            },
            yMax: {
              type: Number,
            },
            lambda: {
              type: Number,
            },
            gamma: {
              type: Number,
            },
            rho: {
              type: Number,
            },
            constantH: {
              type: Number,
            },
            bandwidth: {
              type: Number,
            },
            maxPayoff: {
              type: Number,
            },
            bots: {
              type: Boolean,
              value: false,
            },
            sampleSize: {
              type: Number,
            },
            toSample: {
              type: Object,
              value: null,
            },
            constantE: {
              type: Number,
            },
            purification: {
              type: Number,
            },
            periodLength: Number,
            // set by redwood-period
            _isPeriodRunning: {
              type: Boolean
            },
            _subperiodProgress: {
              type: Number,
              value: 0,
            },
            _payoffFunction: {
              type: Object,
              value: function() {
                  return () => {};
              },
            },
        }
    }

    ready() {
      super.ready()
      const lambda = this.lambda;
      const gamma = this.gamma;
      const rho = this.rho;
      // this is defined here to avoid errors
      this._payoffFunction = function(myDecision, otherDecisions) {
        var pos = 1;
        var tie = 0;
        var numPlayers = otherDecisions.length + 1;
        // calculate position in group and number of ties
        for(var i = 0; i < otherDecisions.length; i++) {
            if(otherDecisions[i] < myDecision) {
                pos++;
            }
            if(otherDecisions[i] == myDecision) {
                tie += 1;
            }
        }
        // if there are ties, average the payoffs over the positions tied players would occupy
        if(tie > 0) {
            var ux = 1 + (2 * lambda * myDecision) - (myDecision * myDecision);
            var vy = 0;
            for(var i = 0; i <= tie; i++) {
                //max (1 - ((numPlayers - 0.5)/numPlayers)/gamma) * (1 + ((numPlayers - 0.5)/numPlayers)/rho)
                vy += ((1 - ((pos - 0.5 + i)/numPlayers)/gamma) * (1 + ((pos - 0.5 + i)/numPlayers)/rho));
            }
            vy = vy/(tie + 1);
            return ux * vy;
        }
        // this is the payoff function from the specs, but 0.5 is subtracted from the position
        // in group to better approximate a continuous range of players
        else {
            var ux = 1 + (2 * lambda * myDecision) - (myDecision * myDecision);
            var vy = (1 - ((pos - 0.5)/numPlayers)/gamma) * (1 + ((pos - 0.5)/numPlayers)/rho);
            return ux * vy;
        }
      }
    }

    // fetches other players' decisions whenever a decision changes
    _getOtherDecisions(groupDecisions) {
      let codes = Object.keys(groupDecisions);
      // if no sampling array has been created and the round has started, create one
      // randomly
      if(this.toSample == null && codes.length > 0) {
          let sampleIndices = []
          while(sampleIndices.length < this.sampleSize) {
              let val = Math.floor(Math.random() * Math.floor(codes.length));
              if(sampleIndices.includes(val)) {
                  continue;
              }
              sampleIndices.push(val);
          }
          this.toSample = sampleIndices;
      }
      // codes are sorted to maintain consistency
      codes.sort();
      let sampled = []
      var dec = [];
      let puriVal = 0;
      // loop over codes and add other players' decisions to dec
      for (let pcode of codes) {
          if(this.$.constants.participantCode != pcode) {
              dec.push(groupDecisions[pcode]);
          }
          else {
              // calculate purification
              this.purification = 1 - (this.constantE * puriVal/codes.length);
          }
          puriVal++;
      }
      // if a sampling array exists, sample based on that array
      if(this.toSample != null) {
          for(let i = 0; i < this.toSample.length; i++) {
              sampled.push(groupDecisions[codes[this.toSample[i]]]);
          }
      }
      // if constantE is -1, set purification to 1
      if(this.constantE < 0) {
          this.purification = 1;
      }
      this.sampledDecisions = sampled;
      if(this.sampleSize == -1) {
          this.sampledDecisions = dec;
      }
      return dec;
    }
    _onPeriodStart() {
      this.shadowRoot.querySelector('polymer-bubbles').roundStart();
      this.myDecision = this.initialDecision;
    }
}

window.customElements.define('timing-games', TimingGames);
