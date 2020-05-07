import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';

let MY_COLOR = 'rgb(9, 153, 18)';

let OTHER_COLORS = [
    'rgb(0,0,0)',
    'rgb(255,0,86)',
    'rgb(158,0,142)',
    'rgb(14,76,161)',
    'rgb(255,229,2)',
    'rgb(0,95,57)',
    'rgb(0,255,0)',
    'rgb(1,0,103)',
    'rgb(149,0,58)',
    'rgb(255,147,126)',
    'rgb(164,36,0)',
    'rgb(0,21,68)',
    'rgb(145,208,203)',
    'rgb(98,14,0)',
    'rgb(107,104,130)',
    'rgb(0,0,255)',
    'rgb(0,125,181)',
    'rgb(106,130,108)',
    'rgb(0,174,126)',
    'rgb(194,140,159)',
    'rgb(190,153,112)',
    'rgb(0,143,156)',
    'rgb(95,173,78)',
    'rgb(255,0,0)',
    'rgb(255,0,246)',
    'rgb(255,2,157)',
    'rgb(104,61,59)',
    'rgb(255,116,163)',
    'rgb(150,138,232)',
    'rgb(152,255,82)',
    'rgb(167,87,64)',
    'rgb(1,255,254)',
    'rgb(255,238,232)',
    'rgb(254,137,0)',
    'rgb(189,198,255)',
    'rgb(1,208,255)',
    'rgb(187,136,0)',
    'rgb(117,68,177)',
    'rgb(165,255,210)',
    'rgb(255,166,254)',
    'rgb(119,77,0)',
    'rgb(122,71,130)',
    'rgb(38,52,0)',
    'rgb(0,71,84)',
    'rgb(67,0,44)',
    'rgb(181,0,255)',
    'rgb(255,177,103)',
    'rgb(255,219,102)',
    'rgb(144,251,146)',
    'rgb(126,45,210)',
    'rgb(189,211,147)',
    'rgb(229,111,254)',
    'rgb(222,255,116)',
    'rgb(0,255,120)',
    'rgb(0,155,255)',
    'rgb(0,100,1)',
    'rgb(0,118,255)',
    'rgb(133,169,0)',
    'rgb(0,185,23)',
    'rgb(120,130,49)',
    'rgb(0,255,198)',
    'rgb(255,110,65)',
    'rgb(232,94,190)',
];

/*
    this.get(property) and this.property are used interchangeably
*/

export class BubblesGraph extends PolymerElement {
    constructor(){
        super();
    }
    static get template() {
        return html `
            <style>
                canvas {
                    width: 100%;
                    height: 100%;
                }
            </style>
            <canvas id='canvas'></canvas>
        `
    }

    static get properties() {
        return {
            minPayoff: {
                type: Number,
            },
            maxPayoff: {
                type: Number,
            },
            myDecision: {
                type: Number,
                observer: '_redrawGraph',
            },
            otherDecisions: {
                type: Array,
            },
            sampledDecisions: {
                type: Array,
            },
            payoffFunction: {
                type: Object,
            },
            updateRate: {
                type: Number,
            },
            minX: {
                type: Number,
            },
            maxX: {
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
            constantD: {
                type: Number,
            },
            constantH: {
                type: Number,
            },
            purification: {
                type: Number,
                value: 1,
            },
            bandwidth: {
                type: Number,
            },
            numPlayers: {
                type: Number,
            },
            pixelValues: {
                type: Array,
                value: [],
                notify: true,
            },
            sampleSize: {
                type: Number,
            },
            othersPixelValues: {
                type: Array,
                value: [],
            },
            updateLandscape: {
                type: Boolean,
                value: false,
            },
            enablePayoffLandscape: {
                type: Boolean,
                value: false,
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
            first: {
                type: Boolean,
                value: true,
            },
        }
    }

    static get observers() {
        return [
            '_redrawGraph(otherDecisions)',
        ]
    }

    ready() {
        super.ready();
        // constantD is used in time smoothing caluclations
        this.constantD = Math.exp(-0.6931/this.get("constantH"));
        const lambda = this.lambda;
        const gamma = this.gamma;
        const rho = this.rho;
        // payoffFunction is redefined here using purification
        // defining it with purification included in timing-games.js would cause
        // issues with the actual payoffs passed back to oTree
        this._payoffFunction = function(myDecision, otherDecisions) {
          var pos = 1;
          var tie = 0;
          var numPlayers = otherDecisions.length + 1;
          for(var i = 0; i < otherDecisions.length; i++) {
              if(otherDecisions[i] < myDecision) {
                  pos++;
              }
              if(otherDecisions[i] == myDecision) {
                  tie += 1;
              }
          }
          if(tie > 0) {
              //max 1 + (2 * lambda * (1 + 2 * lambda)/2) - ((1 + 2 * lambda/2)^2)
              var ux = 1 + (2 * lambda * myDecision) - (myDecision * myDecision);
              var vy = 0;
              for(var i = 0; i <= tie; i++) {
                  //max (1 - ((numPlayers - 0.5)/numPlayers)/gamma) * (1 + ((numPlayers - 0.5)/numPlayers)/rho)
                  vy += ((1 - (((pos - 0.5 + i) * this.purification)/numPlayers)/gamma) * (1 + (((pos - 0.5 + i) * this.purification)/numPlayers)/rho));
              }
              vy = vy/(tie + 1);
              return ux * vy;
          }
          else {
              var ux = 1 + (2 * lambda * myDecision) - (myDecision * myDecision);
              var vy = (1 - (((pos - 0.5) * this.purification)/numPlayers)/gamma) * (1 + (((pos - 0.5) * this.purification)/numPlayers)/rho);
              return ux * vy;
          }
        }
        setTimeout(() => {
            this.canvas = this.$.canvas;
            this.width = this.canvas.clientWidth;
            this.height = this.canvas.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            // axis bounds are modified by small amounts to produce a nicer looking graph
            this.xMin = this.get('minX') - ((this.get('maxX') - this.get('minX')) * 0.06);
            this.xMax = this.get('maxX') + ((this.get('maxX') - this.get('minX')) * 0.03);
            this.xRange = this.xMax - this.xMin;
            this.yMin = this.get('minPayoff') - ((this.get('maxPayoff') - this.get('minPayoff')) * 0.1);
            this.yMax = this.get('maxPayoff') + ((this.get('maxPayoff') - this.get('minPayoff')) * 0.03);
            this.yRange = this.yMax - this.yMin;

            this.xScale = this.width / this.xRange;
            this.yScale = this.height / this.yRange;

            this.ctx = this.canvas.getContext('2d');

            this._drawXAxis();
            this._drawYAxis();
        });

    }
    roundStart() {
        this._setPixelValues();
        setTimeout(this._redrawGraph.bind(this));
        let startTime = Date.now();
        // if using time smoothing, update graph on interval updateRate
        if(this.smoothing === 'temporal' || this.smoothing === 'both') {
            function tick() {
                this.updateLandscape = true;
                this._redrawGraph();
                const timeDiff = Date.now() - startTime;
                setTimeout(tick.bind(this), this.get('updateRate') - timeDiff % this.get('updateRate'));
            }
            tick.call(this);
        }
        else {
            setInterval(this._redrawGraph.bind(this));
        }
    }
    // pixelValues is used for time smoothing, and determines what values to show at each
    // point on the landscape
    _setPixelValues() {
        this.pixelValues = [];
        const interval = (this.xMax - this.get('minX')) / this.width;
        for(let i = this.get('minX') + interval; i < this.xMax; i += interval) {
            let val = i/this.xMax * (this.maxPayoff - this.minPayoff) + this.minPayoff;
            this.push('pixelValues', val);
        }
    }
    // redraws the graph
    _redrawGraph() {
        if (!this.ctx) {
            return;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);
        this._drawXAxis();
        this._drawYAxis();
        if (this.enablePayoffLandscape) {
            this._drawPayoffLandscape();
        }
        if (this.othersBubbles !== 'none') {
            this._drawOthersBubbles();
        }
        this._drawMyDecision();
        this.updateLandscape = false;
        // updateLandscape is set to false so the smoothing doesn't tick when a player
        // updates their decision
    }
    _transformContext() {
        // changes bounds and scale of context so that x goes from xmin to xmax
        // and y goes from ymin to ymax
        this.ctx.scale(this.xScale, -this.yScale);
        this.ctx.translate(-this.xMin, -this.yMax)
    }
    _drawPayoffLandscape() {
        const ctx = this.ctx;

        const payoffFunction = this.get('payoffFunction');
        const otherDecisions = this.get('otherDecisions');
        const sampledDecisions = this.get('sampledDecisions');

        ctx.save();
        ctx.save();
        this._transformContext();
        ctx.beginPath();

        const numSamples = this.width;
        const interval = (this.xMax - this.get('minX')) / numSamples;

        ctx.moveTo(this.get('minX'), payoffFunction(this.get('minX'), sampledDecisions));
        var count = 0;
        for(let x = this.get('minX') + interval; x < this.xMax; x += interval) {
            let y;
            if(this.smoothing === 'both') {
                if(this.get('updateLandscape')) {
                    // in all cases where this calculation occurs, 20 samples are taken
                    // in range [x - bandwidth, x + bandwidth] and averaged to get the decision
                    y = 0;
                    const interval = this.bandwidth/10;
                    let loops = 0;
                    for(let i = x - this.bandwidth; i <= x + this.bandwidth; i += interval) {
                        y += payoffFunction(i, sampledDecisions);
                        loops++;
                    }
                    if(loops == 20) {
                        y += payoffFunction(x + this.bandwidth, sampledDecisions);
                    }
                    y = y/21;
                    // this caluclation is for time smoothing, and determines the payoff based on the current payoff
                    // and a decayed version of the old payoff for each pixel
                    y = (1 - this.get("constantD")) * y + this.get("constantD") * this.get("pixelValues")[count];
                }
                else {
                    y = this.get('pixelValues')[count];
                }
            }
            else if(this.smoothing === 'temporal') {
                if(this.get('updateLandscape')) {
                    y = (1 - this.get("constantD")) * payoffFunction(x, sampledDecisions) + this.get("constantD") * this.get("pixelValues")[count];
                }
                else {
                    y = this.get('pixelValues')[count];
                }
            }
            else if(this.smoothing === 'spatial') {
                y = 0;
                const interval = this.bandwidth/10;
                let loops = 0;
                for(let i = x - this.bandwidth; i <= x + this.bandwidth; i += interval) {
                    y += payoffFunction(i, sampledDecisions);
                    loops++;
                }
                if(loops == 20) {
                    y += payoffFunction(x + this.bandwidth, sampledDecisions);
                }
                y = y/21;
            }
            else {
                y = payoffFunction(x, sampledDecisions);
            }
            //console.log(y);
            ctx.lineTo(x, y);
            //console.log(this.get("pixelValues"));
            this.pixelValues[count] = y;
            count++;
            //console.log(count);
        }
        //console.log(this.get('pixelValues'));
        this.updateLandscape = true;
        this.first = false;
        ctx.restore();
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
    _drawOthersBubbles() {
        const ctx = this.ctx;

        const payoffFunction = this.get('payoffFunction');
        const otherDecisions = this.get('otherDecisions');
        const sampledDecisions = this.get('sampledDecisions');

        ctx.save();

        const radius = 8;
        for(let i = 0; i < otherDecisions.length; i++) {
            let payoff = 0;
            if (this.othersBubbles === 'payoff') {
                let otherDecisionsForOpponent = otherDecisions.slice();
                otherDecisionsForOpponent.splice(i, 1, this.myDecision);
                //0.97 is necessary here due to the slider length not quite matching up with the length of the axis
                const otherSliderPosition = Math.round(((otherDecisions[i] - this.get('minX'))/(this.xMax - this.get('minX')) * 598));
                if(this.enablePayoffLandscape) {
                    if(this.smoothing === 'temporal' || this.smoothing === 'both') {
                        payoff = this.get("pixelValues")[otherSliderPosition];
                    }
                    else if(this.smoothing === 'spatial'){
                        let y = 0;
                        const interval = this.bandwidth/10;
                        let loops = 0;
                        for(let j = otherDecisions[i] - this.bandwidth; j <= otherDecisions[i] + this.bandwidth; j += interval) {
                            y += payoffFunction(j, otherDecisionsForOpponent);
                            loops++;
                        }
                        if(loops == 20) {
                            y += payoffFunction(otherDecisions[i] + this.bandwidth, otherDecisions)
                        }
                        y = y/21;
                        payoff = y;
                    }
                    else {
                        payoff = payoffFunction(otherDecisions[i], otherDecisionsForOpponent);
                    }
                }
                else {
                    payoff = payoffFunction(otherDecisions[i], otherDecisionsForOpponent);
                }
            }
            ctx.beginPath();
            const x = (otherDecisions[i] - this.xMin) * this.xScale;
            const y = (this.yMax - payoff) * this.yScale;
            ctx.arc(x, y, radius, 0, 2 * Math.PI);

            ctx.lineWidth = 2;
            ctx.strokeStyle = OTHER_COLORS[i];
            ctx.stroke();
        }

        ctx.restore();
    }
    _drawMyDecision() {
        const ctx = this.ctx;

        ctx.save();

        ctx.save();
        this._transformContext();
        ctx.beginPath();
        ctx.moveTo(this.myDecision, 0);
        ctx.lineTo(this.myDecision, this.yMax);
        ctx.restore();
        ctx.strokeStyle = MY_COLOR;
        ctx.lineWidth = 2;
        ctx.stroke();

        const payoffFunction = this.get('payoffFunction');
        const otherDecisions = this.get('otherDecisions');
        const sampledDecisions = this.get('sampledDecisions');

        const radius = 8;
        //0.97 is necessary here due to the slider length not quite matching up with the length of the axis
        const mySliderPosition = Math.round(((this.myDecision - this.get('minX'))/(this.xMax - this.get('minX')) * 598));
        let myPayoff;
        if(this.enablePayoffLandscape) {
            if(this.smoothing === 'temporal' || this.smoothing === 'both') {
                myPayoff = this.get("pixelValues")[mySliderPosition];
            }
            else if(this.smoothing === 'spatial'){
                let y = 0;
                const interval = this.bandwidth/10;
                let loops = 0;
                for(let i = this.myDecision - this.bandwidth; i <= this.myDecision + this.bandwidth; i += interval) {
                    y += payoffFunction(i, sampledDecisions);
                    loops++;
                }
                if(loops == 20) {
                    y += payoffFunction(this.myDecision + this.bandwidth, sampledDecisions);
                }
                y = y/21;
                myPayoff = y;
            }
            else {
                myPayoff = payoffFunction(this.myDecision, sampledDecisions);
            }
        }
        else {
            myPayoff = payoffFunction(this.myDecision, sampledDecisions);
        }
        const x = (this.myDecision - this.xMin) * this.xScale;
        const y = (this.yMax - myPayoff) * this.yScale;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
    _drawXAxis() {
        const ctx = this.ctx;
        ctx.save();

        ctx.save();
        ctx.beginPath();
        this._transformContext();
        ctx.moveTo(this.get('minX'), this.get('minPayoff'));
        ctx.lineTo(this.get('maxX'), this.get('minPayoff'));
        ctx.restore();
        ctx.stroke()

        const tickInterval = (this.get('maxX') - this.get('minX'))/10;
        const tickWidth = 10;
        const tickStartY = ((this.yMax - this.get('minPayoff')) * this.yScale);
        const tickEndY = tickStartY + tickWidth;

        ctx.beginPath();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        let curTick = this.get('minX');
        while (curTick <= this.xMax) {
            let x = (curTick - this.xMin) * this.xScale;
            ctx.moveTo(x, tickStartY);
            ctx.lineTo(x, tickEndY);
            ctx.fillText(curTick.toFixed(1), x, tickEndY + 3)
            curTick += tickInterval;
        }
        ctx.stroke();

        ctx.restore();
    }
    _drawYAxis() {
        const ctx = this.ctx;
        ctx.save();

        ctx.save();
        this._transformContext();
        ctx.beginPath();
        ctx.moveTo(this.get('minX'), this.get('minPayoff'));
        ctx.lineTo(this.get('minX'), this.get('maxPayoff'));
        ctx.restore();
        ctx.stroke();

        const tickInterval = this._getYTickInterval();
        const tickWidth = 10;
        const tickStartX = -(this.xMin - (this.get('minX'))) * this.xScale;
        const tickEndX = tickStartX - tickWidth;

        ctx.beginPath();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        let curTick = 0;
        while (curTick < this.yMax) {
            let y = (this.yMax - curTick) * this.yScale;
            ctx.moveTo(tickStartX, y);
            ctx.lineTo(tickEndX, y);
            ctx.fillText(curTick, tickEndX - 3, y + 2);
            curTick += tickInterval;
        }
        ctx.stroke();

        ctx.restore();
    }
    _getYTickInterval() {
        const maxNumTicks = 12;

        if (this.yMax <= maxNumTicks) {
            return 1;
        }
        if (this.yMax / 5 <= maxNumTicks) {
            return 5;
        }

        let interval = 10;
        while ((this.yMax - this.yMin) / interval > maxNumTicks) {
            interval += 10;
        }
        return interval;
    }
}

window.customElements.define('bubbles-graph', BubblesGraph);
