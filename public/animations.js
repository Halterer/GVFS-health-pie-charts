const ANIMATION_COMPLETE = false;
const ANIMATION_RUNNING = true;

const EASE_LINEAR = 1;
const EASE_IN = 2;
const EASE_OUT = 3;
const EASE_IN_OUT = 4;

var Animation = function (object, property, finalValue, frames, easingFunction) {
    this.object = object;
    this.property = property;
    this.finalValue = finalValue;
    this.totalFrames = frames;
    this.frame = 0;
    this.startValue = Object.getOwnPropertyDescriptor(this.object, this.property).value;

    this.step = function () {
        this.frame++;
        Object.defineProperty(this.object, this.property, {
            value: this.startValue + (this.easingFunction(this.frame / this.totalFrames) * (this.finalValue - this.startValue))
        });
        if (this.frame == this.totalFrames) {
            return ANIMATION_COMPLETE;
        }
        return ANIMATION_RUNNING;
    };

    this.getEasingFunction = function (easingFunction) {
        switch (easingFunction) {
            case EASE_LINEAR:
                return this.easeLinear;
            case EASE_IN:
                return this.easeIn;
            case EASE_OUT:
                return this.easeOut;
            default:
                return this.easeInOut;
        }
    };

    this.easeLinear = function (x) {
        return x;
    };

    this.easeIn = function (x) {
        return pow(x, 3);
    };

    this.easeOut = function (x) {
        return 1 - this.easeIn(1 - x);
    };

    this.easeInOut = function (x) {
        if (x < 0.5) {
            return this.easeIn(x * 2) / 2;
        } else {
            return 1 - this.easeIn((1 - x) * 2) / 2;
        }
    };

    this.easingFunction = this.getEasingFunction(easingFunction);
};

var AnimationEngine = function () {
    this.animations = [];

    this.addAnimation = function (object, property, finalValue, frames, easingFunction) {
        this.animations.push(new Animation(object, property, finalValue, frames, easingFunction));
    };

    this.stepAnimations = function () {
        for (var i = 0; i < this.animations.length; i++) {
            var animationStatus = this.animations[i].step();
            if (animationStatus == ANIMATION_COMPLETE) {
                this.animations.splice(i, 1);
                i--;
            }
        }
    };
};