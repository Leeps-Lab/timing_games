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

export class StrategyGraph extends PolymerElement {
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
            myDecision: {
                type: Number,
                observer: '_addDecisionToHistory',
            },
            otherDecisions: {
                type: Number,
            },
            minY: {
                type: Number,
            },
            maxY: {
                type: Number,
            },
            duration: {
                type: Number,
            },
            _decisionHistory: {
                type: Array,
                value: () => [],
            },
        }
    }

    static get observers() {
        return [
            '_addDecisionToHistory(otherDecisions.splices)',
        ]
    }

    ready() {
        super.ready();
        setTimeout(() => {
            this.canvas = this.$.canvas;
            this.width = this.canvas.clientWidth;
            this.height = this.canvas.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            this.yMin = this.get('minY');
            this.yMax = this.get('maxY');
            this.yRange = this.yMax - this.yMin;
            this.yScale = this.height / this.yRange;

            this.ctx = this.canvas.getContext('2d');
        });
    }

    roundStart() {
        setTimeout(() => {
            this.start_time = performance.now();

            this.xMin = this.start_time;
            this.xMax = this.xMin + this.duration * 1000;
            this.xRange = this.xMax - this.xMin;
            this.xScale = this.width / this.xRange;

            this.last_time = this.start_time;

            requestAnimationFrame(this._tick.bind(this));
        });
    }

    _tick(now) {
        const decisionHistory = this.get('_decisionHistory');
        if (decisionHistory.length) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this._drawOtherDecisions(decisionHistory, now);
            this._drawMyDecisions(decisionHistory, now);
        }

        if (now > this.start_time + this.duration * 1000) {
            return;
        }
        requestAnimationFrame(this._tick.bind(this));
    }

    _transformContext() {
        // changes bounds and scale of context so that x goes from xmin to xmax
        // and y goes from ymin to ymax
        this.ctx.scale(this.xScale, -this.yScale);
        this.ctx.translate(-this.xMin, -this.yMax)
    }

    _drawOtherDecisions(decisionHistory, now) {

        const ctx = this.ctx;
        ctx.save();

        // get max length of otherDecisions arrays
        const numOtherDecisions = Math.max.apply(null, decisionHistory.map(e => e.otherDecisions.length));

        // for each decision in otherDecisions
        for (let i = 0; i < numOtherDecisions; i++) {
            // there may be some empty otherDecisions at the start of decision history, skip past those
            let start = 0;
            while (decisionHistory[start].otherDecisions.length - 1 < i) start++;

            ctx.save();
            this._transformContext();

            ctx.beginPath();
            // move to the first point in decision history
            ctx.moveTo(decisionHistory[start].time, decisionHistory[start].otherDecisions[i]);

            for (let j = start; j < decisionHistory.length - 1; j++) {
                let nextTime = decisionHistory[j + 1].time;
                let currentDecision = decisionHistory[j].otherDecisions[i];
                let nextDecision = decisionHistory[j + 1].otherDecisions[i];
                // draw horizontal segment
                ctx.lineTo(nextTime, currentDecision);
                // draw vertical connection and move to next decision value in history
                ctx.lineTo(nextTime, nextDecision);
            }

            // draw final segment to current time
            ctx.lineTo(now, decisionHistory[decisionHistory.length - 1].otherDecisions[i]);

            ctx.restore();

            ctx.lineWidth = 3;
            ctx.strokeStyle = OTHER_COLORS[i];
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawMyDecisions(decisionHistory, now) {
        const ctx = this.ctx;

        ctx.save();
        ctx.save();
        this._transformContext();
        ctx.beginPath();
        ctx.moveTo(decisionHistory[0].time, decisionHistory[0].myDecision);

        for (let j = 0; j < decisionHistory.length - 1; j++) {
            let nextTime = decisionHistory[j + 1].time;
            let currentDecision = decisionHistory[j].myDecision;
            let nextDecision = decisionHistory[j + 1].myDecision;
            ctx.lineTo(nextTime, currentDecision);
            ctx.lineTo(nextTime, nextDecision);
        }

        ctx.lineTo(now, decisionHistory[decisionHistory.length - 1].myDecision);

        ctx.restore();

        ctx.lineWidth = 3;
        ctx.strokeStyle = MY_COLOR;
        ctx.stroke();

        ctx.restore();
    }

    _addSegment(nextTime, currentDecision, nextDecision) {
            const nextX = (nextTime - this.xMin) * this.xScale;
            const curY = (this.yMax - currentDecision) * this.yScale;
            const nextY = (this.yMax - nextDecision) * this.yScale;
            this.ctx.lineTo(nextX, curY);
            this.ctx.lineTo(nextX, nextY);
    }

    _addDecisionToHistory() {
        let otherDecisions = this.get('otherDecisions');
        if (this.myDecision && otherDecisions) {
            this.push('_decisionHistory', {
                myDecision: this.myDecision,
                otherDecisions: otherDecisions,
                time: performance.now()
            });
        }
    }
}

window.customElements.define('strategy-graph', StrategyGraph);
