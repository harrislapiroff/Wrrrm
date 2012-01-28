(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Crafty.c("Protagonist", {
    init: function() {
      this.requires("2D, DOM, Collision");
      this.onHit("Deadly", this.die);
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
    snake: function(radius, rotation_frames, stroke) {
      this.radius = radius;
      this.rotation_frames = rotation_frames;
      this.stroke = stroke != null ? stroke : 40;
      this.attr({
        x: Crafty.viewport.width / 2 - this.radius,
        y: Crafty.viewport.height - 200,
        w: (this.radius - this.stroke) * 2,
        h: (this.radius - this.stroke) * 2
      });
      this.css({
        'border-radius': this.radius,
        'border': "" + this.stroke + "px solid #000"
      });
      return this.origin(this.radius, this.radius);
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
      var pos, snake_d, snake_pos, snake_r;
      this.snake = snake;
      this.circumference_location = circumference_location;
      this.altitude = altitude != null ? altitude : 0;
      this.initial_rotation = this.circumference_location * 360 / this.snake.circumference();
      snake_pos = this.snake.pos();
      snake_r = this.snake.radius;
      snake_d = snake_r * 2;
      pos = this.pos();
      this.attr({
        rotation: this.initial_rotation,
        y: snake_pos._y - this.altitude,
        x: (Crafty.viewport.width - pos._w) / 2
      });
      this.origin(pos._w / 2, snake_d / 2 + this.altitude);
      this.snake.bind("StartSpin", __bind(function() {
        return this._startspin();
      }, this));
      return this.snake.bind("StopSpin", __bind(function() {
        return this._stopspin();
      }, this));
    },
    _startspin: function(e) {
      this.attr({
        rotation: this.initial_rotation
      });
      return this.tween({
        rotation: this.initial_rotation - 360
      }, this.snake.rotation_frames);
    },
    _stopspin: function() {}
  });
}).call(this);
