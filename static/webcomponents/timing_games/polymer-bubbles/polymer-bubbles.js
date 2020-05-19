import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import '/static/otree-redwood/src/redwood-decision/redwood-decision.js';
import '/static/otree-redwood/src/redwood-period/redwood-period.js';
import '/static/otree-redwood/src/redwood-channel/redwood-channel.js';
import './bubbles-graph.js';
import './strategy-graph.js';
import './payoff-graph.js';

/*
    Wrapper component for timing-games. Should have been implemented in timing-games.js, but
    at the time this was started it was mistakenly used as its own component. It exists as
    an unnecessary layer of heirarchy.
*/

export class PolymerBubbles extends PolymerElement {
    constructor(){
        super();
    }
    static get template() {
        return html `
            <style>
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
            <table>
                <tr>
                    <td>
                        <span>Decision Information</span>
                        <div class="toprow">
                            <p>
                                Your Current Payoff: [[ payoffFunction(myDecision, otherDecisions) ]]
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
                                duration='[[ duration ]]'>
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
                                payoff-function='[[ payoffFunction ]]'
                                update-rate='[[ updateRate ]]'
                                num-players='[[ numPlayers ]]'
                                lambda='[[ lambda ]]'
                                gamma='[[ gamma ]]'
                                rho='[[ rho ]]'
                                constant-h='[[ constantH ]]'
                                my-decision='[[ myDecision ]]'
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
                                duration='[[ duration ]]'
                                my-payoff='[[ payoffFunction(myDecision, otherDecisions) ]]'>
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
            <div>
            </div>
        `
    }

    static get properties() {
        return {
            otherDecisions: {
                type: Array,
            },
            maxPayoff: {
                type: Number,
            },
            payoffFunction: {
                type: Object,
                value: function() {
                    return function() {
                        throw "payoff function not implemented";
                    };
                },
            },
            sampledDecisions: {
                type: Array,
            },
            updateRate: {
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
            purification: {
                type: Number,
            },
            trembling: {
                type: Number,
            },
            enablePayoffLandscape: {
                type: Boolean,
                value: false,
            },
            sampleSize: {
                type: Number,
            },
            numPlayers: {
                type: Number,
            },
            bandwidth: {
                type: Number,
            },
            myDecision: {
                type: Number,
                notify: true,
            },
            duration: {
                type: Number,
            },
            myCurrPayoff: {
                type: Number,
            },
            // configuration property for how others' bubbles are displayed
            // 3 options
            //     'none': no bubbles are shown for other players
            //     'strategy': just shows everyone's strategy, without showing their payoff
            //     'payoff': shows everyone else's payoffs as well as their strategy
            othersBubbles: {
                type: String,
            },
            // configuration for graph smoothing
            // options:
            //     'none': graph uses payoff function and nothing else
            //     'temporal': graph uses time smoothing algorithm with half life variable constantH
            //     'spatial': graph uses space smoothing algorithm with bandwidth variable bandwidth
            //     'both': graph uses both time and space smoothing algorithms
            smoothing: {
                type: String,
            },
            pixelValues: {
                type: Array,
                value: [],
                notify: true,
            },
        }
    }

    ready() {
        super.ready();
        this.slider = this.$.slider;
        this.bubbles_graph = this.shadowRoot.querySelector('bubbles-graph');
        this.payoff_graph = this.shadowRoot.querySelector('payoff-graph');
        this.strategy_graph = this.shadowRoot.querySelector('strategy-graph');

        this.maxPayoff = this.yMax - this.yMin;
        this.slider.value = this.myDecision;
    }

    roundStart() {
        this.bubbles_graph.roundStart();
        this.payoff_graph.roundStart();
        this.strategy_graph.roundStart();
    }

    _sliderValueChanged(event) {
        this.myDecision = parseFloat(event.target.value) + (Math.random() * this.trembling * 2 - this.trembling);
    }
}

window.customElements.define('polymer-bubbles', PolymerBubbles);
