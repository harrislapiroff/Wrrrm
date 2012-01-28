(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Crafty.c("Protagonist", {
    init: function() {
      this.requires("2D, DOM, Collision");
      this.onHit("Death", this.die);
      return this.onHit("Scale", function() {
        return console.log("Hit a scale.");
      });
    },
    die: function() {
      return this.trigger("Died");
    }
  });
  Crafty.c("Snake", {
    init: function() {
      return this.requires("2D, DOM, Tween");
    },
    snake: function(radius, rotation_frames) {
      this.radius = radius;
      this.rotation_frames = rotation_frames;
      return this.origin("center center");
    },
    startspin: function() {
      this.attr({
        rotation: 0
      });
      this.tween({
        rotation: -360
      }, this.rotation_frames);
      return this.trigger("StartSpin");
    },
    stopspin: function() {
      return this.trigger("StopSpin");
    },
    circumference: function() {
      return this.radius * 6.28;
    }
  });
  Crafty.c("SnakePart", {
    init: function() {
      return this.requires("2D, DOM, Tween");
    },
    snakepart: function(snake, circumference_location, altitude) {
      this.snake = snake;
      this.circumference_location = circumference_location;
      this.altitude = altitude != null ? altitude : 0;
      this.attr({
        rotation: this.circumference_location * 360 / this.snake.circumference(),
        y: this.snake.pos()._y - this.altitude,
        x: this.snake.pos()._x + (this.snake.pos()._w + this.pos()._w) / 2
      });
      this.origin(this.pos()._w / 2, (this.snake.pos()._h) / 2 + this.altitude);
      this.snake.bind("StartSpin", __bind(function() {
        return this._startspin();
      }, this));
      return this.snake.bind("StopSpin", __bind(function() {
        return this._stopspin();
      }, this));
    },
    _startspin: function(e) {
      this.attr({
        rotation: 0
      });
      return this.tween({
        rotation: -360
      }, this.snake.rotation_frames);
    },
    _stopspin: function() {}
  });
}).call(this);
