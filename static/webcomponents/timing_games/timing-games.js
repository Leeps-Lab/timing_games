import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-decision/redwood-decision.js';
import '/static/otree-redwood/src/redwood-period/redwood-period.js';
import './polymer-bubbles/polymer-bubbles.js';
import './polymer-bubbles/payoff-graph.js';
import './polymer-bubbles/strategy-graph.js';
import './polymer-bubbles/bubbles-graph.js';
import './polymer-bubbles/paper-progress.js';

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

                #game {
                    display: block;
                    margin: 0 auto;
                }

                paper-progress {
					margin-bottom: 10px;
					--paper-progress-height: 30px;
				}

                .toprow, .bottomrow {
                    border: 1px solid black;
                    width: 600px;
                }

                .toprow {
                    height: 200px;
                }

                .bottomrow {
                    height: 300px;
                }

                #slider-container {
                    width: 600px;
                    height: 50px;
                    position: relative;
                }

                #slider {
                    position: absolute;
                    width: 94%;
                    left: 24px;
                    top: 20px;
                }
            </style>
                <!-- <polymer-bubbles
                    other-decisions='[[ otherDecisions ]]'
                    my-decision='{{ myDecision }}'
                    my-planned-decision='{{ myPlannedDecision }}'
                    payoff-function='[[ _payoffFunction ]]'
                    num-subperiods='[[ numSubperiods ]]'
                    sampled-decisions='[[ sampledDecisions ]]'
                    lambda='[[ lambda ]]'
                    gamma='[[ gamma ]]'
                    rho='[[ rho ]]'
                    constant-h='[[ constantH ]]'
                    purification='[[ purification ]]'
                    trembling='[[ trembling ]]'
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
                </polymer-bubbles> -->
            <div id="game">
                <template id="continuous" is="dom-if" if="[[ !numSubperiods ]]">
                    <table>
                        <tr>
                            <td>
                                <span>Decision Information</span>
                                <div class="toprow">
                                    <p>
                                        Your Current Payoff: [[ _payoffFunction(myPlannedDecision, otherDecisions) ]]
                                    </p>
                                    <p>
                                        Your Current Timing: [[ myPlannedDecision ]]
                                    </p>
                                </div>
                            </td>
                            <td>
                                <span>Strategy</span>
                                <div class="toprow">
                                    <strategy-graph
                                        my-decision='[[ myPlannedDecision ]]'
                                        other-decisions='[[ otherDecisions ]]'
                                        min-y='[[ xMin ]]'
                                        max-y='[[ xMax ]]'
                                        duration='[[ periodLength ]]'>
                                    </strategy-graph>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>Current decisions</span>
                                <div class="bottomrow">
                                    <bubbles-graph
                                        other-decisions='[[ otherDecisions ]]'
                                        sampled-decisions='[[ sampledDecisions ]]'
                                        min-payoff='[[ yMin ]]'
                                        max-payoff='[[ yMax ]]'
                                        payoff-function='[[ _payoffFunction ]]'
                                        update-rate='[[ updateRate ]]'
                                        num-players='[[ numPlayers ]]'
                                        lambda='[[ lambda ]]'
                                        gamma='[[ gamma ]]'
                                        rho='[[ rho ]]'
                                        constant-h='[[ constantH ]]'
                                        my-decision='[[ myPlannedDecision ]]'
                                        my-planned-decision='[[ myPlannedDecision ]]'
                                        others-bubbles='[[ othersBubbles ]]'
                                        smoothing='[[ smoothing ]]'
                                        enable-payoff-landscape='[[ enablePayoffLandscape ]]'
                                        min-x='[[ xMin ]]'
                                        max-x='[[ xMax ]]'
                                        bandwidth='[[ bandwidth ]]'
                                        pixel-values='{{ pixelValues }}'
                                        sample-size='[[ sampleSize ]]'
                                        purification='[[ purification ]]'
                                        >
                                    </bubbles-graph>
                                </div>
                            </td>
                            <td>
                                <span>Payoff History</span>
                                <div class="bottomrow">
                                    <payoff-graph
                                        max-payoff='[[ maxPayoff ]]'
                                        min-payoff='[[ yMin ]]'
                                        duration='[[ periodLength ]]'
                                        my-payoff='[[ _payoffFunction(myPlannedDecision, otherDecisions) ]]'>
                                    </payoff-graph>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div id="slider-container">
                                    <input
                                        id="slider"
                                        type="range"
                                        min='[[ xMin ]]'
                                        max='[[ xMax ]]'
                                        step="0.01"
                                        on-change="_sliderValueChanged">
                                </div>
                            </td>
                        </tr>
                    </table>
                </template>

                <template id="discrete" is="dom-if" if="[[ numSubperiods ]]">
                    <table>
                        <tr>
                            <td>
                                <span>Decision Information</span>
                                <div class="toprow">
                                    <p>
                                        Your Current Payoff: [[ _payoffFunction(myDecision, otherDecisions) ]]
                                    </p>
                                    <p>
                                        Your Current Timing: [[ myDecision ]]
                                    </p>
                                </div>
                            </td>
                            <td>
                                <span>Strategy</span>
                                <div class="toprow">
                                    <strategy-graph
                                        my-decision='[[ myDecision ]]'
                                        other-decisions='[[ otherDecisions ]]'
                                        min-y='[[ xMin ]]'
                                        max-y='[[ xMax ]]'
                                        duration='[[ periodLength ]]'>
                                    </strategy-graph>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>Current decisions</span>
                                <div class="bottomrow">
                                    <bubbles-graph
                                        other-decisions='[[ otherDecisions ]]'
                                        sampled-decisions='[[ sampledDecisions ]]'
                                        min-payoff='[[ yMin ]]'
                                        max-payoff='[[ yMax ]]'
                                        payoff-function='[[ _payoffFunction ]]'
                                        update-rate='[[ updateRate ]]'
                                        num-players='[[ numPlayers ]]'
                                        lambda='[[ lambda ]]'
                                        gamma='[[ gamma ]]'
                                        rho='[[ rho ]]'
                                        constant-h='[[ constantH ]]'
                                        my-decision='[[ myDecision ]]'
                                        my-planned-decision='[[ myPlannedDecision ]]'
                                        others-bubbles='[[ othersBubbles ]]'
                                        smoothing='[[ smoothing ]]'
                                        enable-payoff-landscape='[[ enablePayoffLandscape ]]'
                                        min-x='[[ xMin ]]'
                                        max-x='[[ xMax ]]'
                                        bandwidth='[[ bandwidth ]]'
                                        pixel-values='{{ pixelValues }}'
                                        sample-size='[[ sampleSize ]]'
                                        purification='[[ purification ]]'
                                        >
                                    </bubbles-graph>
                                </div>
                            </td>
                            <td>
                                <span>Payoff History</span>
                                <div class="bottomrow">
                                    <payoff-graph
                                        max-payoff='[[ maxPayoff ]]'
                                        min-payoff='[[ yMin ]]'
                                        duration='[[ periodLength ]]'
                                        my-payoff='[[ _payoffFunction(myDecision, otherDecisions) ]]'>
                                    </payoff-graph>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div id="slider-container">
                                    <input
                                        id="slider"
                                        type="range"
                                        min='[[ xMin ]]'
                                        max='[[ xMax ]]'
                                        step="0.01"
                                        on-change="_sliderValueChanged">
                                </div>
                            </td>
                        </tr>
                    </table>
                    <paper-progress
                        value="[[ _subperiodProgress ]]">
                    </paper-progress>
                </template>
            </div>

            <otree-constants id="constants"></otree-constants>

            <redwood-period
                running="{{ _isPeriodRunning }}"
                on-period-start="_onPeriodStart"
                on-period-end="_onPeriodEnd">
            </redwood-period>

            <redwood-decision
                initial-decision="[[ initialDecision ]]"
                my-decision="{{ myPlannedDecision }}"
				my-current-decision="{{ myDecision }}"
                group-decisions="{{ groupDecisions }}"
                on-group-decisions-changed="_onGroupDecisionsChanged"
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
            myPlannedDecision: {
              type: Number,
            },
            groupDecisions: {
              type: Object,
            },
            otherDecisions: {
              type: Array,
              computed: "_getOtherDecisions(groupDecisions)",
            },
            firstSubperiod: {
              type: Boolean,
              value: true,
            },
            numSubperiods: {
              type: Number,
              value: 0,
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
            maxPayoff: {
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
            trembling: {
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
      super.ready();
      this.$.discrete.render();
      this.$.continuous.render();

      const lambda = this.lambda;
      const gamma = this.gamma;
      const rho = this.rho;
      this.myPlannedDecision = this.initialDecision;
      this.myDecision = this.initialDecision;
      this.slider = this.shadowRoot.querySelector('#slider');
      this.bubbles_graph = this.shadowRoot.querySelector('bubbles-graph');
      this.payoff_graph = this.shadowRoot.querySelector('payoff-graph');
      this.strategy_graph = this.shadowRoot.querySelector('strategy-graph');

      this.maxPayoff = this.yMax - this.yMin;
      this.slider.value = this.myPlannedDecision;
      console.log(this.otherDecisions);
      // this is defined here to avoid errors
      if(this.numSubperiods) {
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
      else {
          this._payoffFunction = function(myPlannedDecision, otherDecisions) {
            var pos = 1;
            var tie = 0;
            var numPlayers = otherDecisions.length + 1;
            // calculate position in group and number of ties
            for(var i = 0; i < otherDecisions.length; i++) {
                if(otherDecisions[i] < myPlannedDecision) {
                    pos++;
                }
                if(otherDecisions[i] == myPlannedDecision) {
                    tie += 1;
                }
            }
            // if there are ties, average the payoffs over the positions tied players would occupy
            if(tie > 0) {
                var ux = 1 + (2 * lambda * myPlannedDecision) - (myPlannedDecision * myPlannedDecision);
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
                var ux = 1 + (2 * lambda * myPlannedDecision) - (myPlannedDecision * myPlannedDecision);
                var vy = (1 - ((pos - 0.5)/numPlayers)/gamma) * (1 + ((pos - 0.5)/numPlayers)/rho);
                return ux * vy;
            }
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
        if(this.firstSubperiod) {
            this.firstSubperiod = false;
            this.bubbles_graph.roundStart();
            this.payoff_graph.roundStart();
            this.strategy_graph.roundStart();
        }
		this._subperiodProgress = 0;
		this.lastT = performance.now();
		this._animID = window.requestAnimationFrame(
			this._updateSubperiodProgress.bind(this));
	}
	_onPeriodEnd() {
		window.cancelAnimationFrame(this._animID);
		this._subperiodProgress = 0;
        console.log("end");
	}
	_onGroupDecisionsChanged() {
		this.lastT = performance.now();
		this._subperiodProgress = 0;
	}
	_updateSubperiodProgress(t) {
		const deltaT = (t - this.lastT);
		const secondsPerSubperiod = this.periodLength / this.numSubperiods;
		this._subperiodProgress = 100 * ((deltaT / 1000) / secondsPerSubperiod);
		this._animID = window.requestAnimationFrame(
			this._updateSubperiodProgress.bind(this));
	}
    _sliderValueChanged(event) {
        this.myPlannedDecision = parseFloat(event.target.value) + (Math.random() * this.trembling * 2 - this.trembling);
    }
}

window.customElements.define('timing-games', TimingGames);
