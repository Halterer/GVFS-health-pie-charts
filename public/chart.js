// Radius of the interactive pie chart
const DEFAULT_RADIUS = 200;
// The angular displacement of the hovered chart slice
const DISTORTION = 8;
// The extra width of chart slices which are parents of the current chart
const TRAIL_WIDTH = 30;

const animationEngine = new AnimationEngine();

function PieChart(chartSlices, visible) {
    this.chartSlices = chartSlices;
    this.focused = -1;
    this.lastFocused = -1;
    this.visible = visible;
    this.chartSlices.forEach(slice => {
        slice.parentChart = this;
    });

    this.draw = function () {
        animationEngine.stepAnimations();
        this.chartSlices.forEach(slice => {
            slice.draw();
        });
        if (this.lastFocused != -1) {
            this.chartSlices[this.lastFocused].draw();
        }
        if (this.focused != -1) {
            textGraphics.clear();
            this.chartSlices[this.focused].draw();

            // Draw the child chart on top for the animate out effect to be visible
            if (this.chartSlices[this.focused].childChart != null) {
                this.chartSlices[this.focused].childChart.draw();
            }
        }
    };

    this.hoverSlice = function (x, y) {
        for (var i = 0; i < this.chartSlices.length; i++) {
            var slice = this.chartSlices[i];
            var mouseAngle = normalizeAngle(atan2(y - (height / 2), x - (width / 2)));

            slice.distortion = 0;
            if (this.focused == -1 && mouseAngle > slice.startAngle && mouseAngle < slice.endAngle && dist(x, y, width / 2, height / 2) <= slice.radius) {
                slice.distortion = DISTORTION;
            }
        }
    };

    this.handleClick = function (x, y) {
        var slice;
        if (this.focused != -1) {
            slice = this.chartSlices[this.focused];

            if (slice.childChart != null && dist(x, y, width / 2, height / 2) <= slice.radius) {
                addBackgroundSlice(slice);
                slice.childChart.animateIn();
                this.lastFocused = -1;
                return slice.childChart;
            } else if (dist(x, y, width / 2, height / 2) > slice.radius) {
                slice.compress();
                this.lastFocused = this.focused;
                this.focused = -1;
            }
        } else if (dist(x, y, width / 2, height / 2) <= this.chartSlices[0].radius) {
            for (var i = 0; i < this.chartSlices.length; i++) {
                slice = this.chartSlices[i];
                var mouseAngle = normalizeAngle(atan2(y - (height / 2), x - (width / 2)));

                if (mouseAngle > slice.startAngle && mouseAngle < slice.endAngle) {
                    slice.expand();
                    this.focused = i;
                }
            }
        } else if (this.parentSlice != null) {
            this.animateOut();
            removeBackgroundSlice();
            this.focused = -1;
            this.lastFocused = -1;
            return this.parentSlice.parentChart;
        }
        return this;
    };

    this.animateIn = function () {
        this.chartSlices.forEach(slice => {
            slice.radius = 0;
            animationEngine.addAnimation(slice, "radius", DEFAULT_RADIUS, 40, EASE_IN_OUT);
        });
    };

    this.animateOut = function () {
        this.chartSlices.forEach(slice => {
            animationEngine.addAnimation(slice, "radius", 0, 40, EASE_IN_OUT);
        });
    };
}

function ChartSlice(startAngle, endAngle, radius, label) {
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.radius = radius;
    this.label = label;
    // The angle difference in radians when animating
    this.offset = 0;
    // When hovered, piece of pie comes out a bit
    this.distortion = 0;
    this.childChart = null;
    // The chart containing this slice
    this.parentChart = null;

    this.draw = function () {
        noStroke();
        fill(this.color);

        var xmod = this.distortion * cos((this.startAngle + this.endAngle) / 2) + (width / 2);
        var ymod = this.distortion * sin((this.startAngle + this.endAngle) / 2) + (height / 2);

        if (this.offset == ((2 * Math.PI) - (this.endAngle - this.startAngle)) / 2) {
            ellipse(xmod, ymod, this.radius * 2, this.radius * 2);
        } else {
            arc(xmod, ymod, this.radius * 2, this.radius * 2, this.startAngle - this.offset, this.endAngle + this.offset);
        }

        fill(0);
        textGraphics.textAlign(CENTER, CENTER);
        var labelX = 0.75 * this.radius * cos((this.startAngle + this.endAngle) / 2) + xmod;
        var labelY = 0.75 * this.radius * sin((this.startAngle + this.endAngle) / 2) + ymod;

        if (this.radius > DEFAULT_RADIUS / 2) {
            textGraphics.text(this.label, labelX, labelY);
        }
    };

    this.expand = function () {
        animationEngine.addAnimation(this, "offset", ((2 * Math.PI) - (this.endAngle - this.startAngle)) / 2, 40, EASE_IN_OUT);
    };

    this.compress = function () {
        animationEngine.addAnimation(this, "offset", 0, 40, EASE_IN_OUT);
    };

    this.zoomIn = function () {
        animationEngine.addAnimation(this, "radius", this.radius + TRAIL_WIDTH, 40, EASE_IN_OUT);
    };

    this.zoomOut = function () {
        animationEngine.addAnimation(this, "radius", this.radius - TRAIL_WIDTH, 40, EASE_IN_OUT);
    };
}

function BreadCrumbs() {

}

function normalizeAngle(angle) {
    while (angle > 2 * Math.PI) {
        angle -= 2 * Math.PI;
    }
    while (angle < 0) {
        angle += 2 * Math.PI;
    }
    return angle;
}
