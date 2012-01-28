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
      return this.requires("2D, DOM, Tween, Planet");
    },
    snake: function(radius, rotation_frames, stroke) {
      this.radius = radius;
      this.rotation_frames = rotation_frames;
      this.stroke = stroke != null ? stroke : 40;
      this.planet(this.radius, this.stroke);
      return this.origin(this.radius, this.radius);
    }
  });
  Crafty.c("SnakePart", {
    init: function() {
      return this.requires("2D, DOM, Tween, PlanetWalker");
    },
    snakepart: function(snake, circumference_location, altitude) {
      this.snake = snake;
      this.circumference_location = circumference_location;
      this.altitude = altitude != null ? altitude : 0;
      this.planetwalker(this.snake, 0, this.altitude + this.snake.radius);
      return this.setCircumferenceLocation(this.circumference_location);
    }
  });
  Crafty.c("Planet", {
    init: function() {
      return this.requires("2D, DOM");
    },
    planet: function(radius, stroke) {
      this.radius = radius;
      this.stroke = stroke;
      this.attr({
        x: Crafty.viewport.width / 2 - this.radius,
        y: Crafty.viewport.height - 200,
        w: (this.radius - this.stroke) * 2,
        h: (this.radius - this.stroke) * 2
      });
      return this.css({
        'border-radius': this.radius,
        'border': "" + this.stroke + "px solid #000"
      });
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
    getCartesianCoords: function() {
      return this.pos();
    },
    circumference: function() {
      return this.radius * 6.28;
    }
  });
  Crafty.c("PlanetWalker", {
    init: function() {
      return this.requires("2D, DOM");
    },
    planetwalker: function(planet, theta, r) {
      this.planet = planet;
      this.theta = theta;
      this.r = r;
      this.position(this.theta, this.r);
      this.planet.bind("StartSpin", __bind(function() {
        return this._startspin();
      }, this));
      return this.planet.bind("StopSpin", __bind(function() {
        return this._stopspin();
      }, this));
    },
    _startspin: function(e) {
      return this.tween({
        rotation: this.theta - 360
      }, this.snake.rotation_frames);
    },
    _stopspin: function() {},
    position: function(theta, r) {
      this.theta = theta;
      this.r = r;
      this.altitude = this.r - this.planet.radius;
      this.origin(this.pos()._w / 2, this.planet.radius + this.altitude);
      return this.attr({
        rotation: this.theta,
        y: this.planet.pos()._y - this.altitude,
        x: (Crafty.viewport.width - this.pos()._w) / 2
      });
    },
    setCircumferenceLocation: function(circumference_location) {
      var theta;
      theta = circumference_location * 360 / this.planet.circumference();
      return this.position(theta, this.r);
    }
  });
}).call(this);
