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
      return this.requires("2D, DOM, Tween");
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
      return this.requires("2D, DOM, Tween");
    },
    planetwalker: function(planet, theta, r) {
      this.planet = planet;
      this.theta = theta != null ? theta : 0;
      this.r = r != null ? r : false;
      if (!this.r) {
        this.r = this.planet.radius + this.pos()._h;
      }
      this.position(this.theta, this.r);
      this.planet.bind("StartSpin", __bind(function() {
        return this._startspin();
      }, this));
      return this.planet.bind("StopSpin", __bind(function() {
        return this._stopspin();
      }, this));
    },
    getRadius: function() {
      return this.r;
    },
    getAltitude: function() {
      return this.r - this.planet.radius - this.pos()._h;
    },
    setRadius: function(r) {
      return this.position(this.theta, r);
    },
    setAltitude: function(a) {
      return this.position(this.theta, a + this.planet.radius + this.pos()._h);
    },
    _startspin: function(e) {
      return this.tween({
        rotation: this.theta - 360
      }, this.planet.rotation_frames);
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
    },
    getCircumferenceLocation: function() {
      return this.theta * this.planet.circumference() / 360;
    }
  });
  Crafty.c("TwowayPlanetWalker", {
    _speed: 3,
    _upspeed: 0,
    init: function() {
      return this.requires("PlanetWalker");
    },
    twowayOnPlanet: function(planet, _speed, _upspeed) {
      this.planet = planet;
      this._speed = _speed;
      this._upspeed = _upspeed;
      this.planetwalker(this.planet);
      this.bind("KeyDown", function(e) {
        if (e.key === Crafty.keys.LEFT_ARROW) {
          this._moveL = true;
        }
        if (e.key === Crafty.keys.RIGHT_ARROW) {
          this._moveR = true;
        }
        if (e.key === Crafty.keys.UP_ARROW) {
          return this._jump = true;
        }
      });
      this.bind("KeyUp", function(e) {
        if (e.key === Crafty.keys.LEFT_ARROW) {
          this._moveL = false;
        }
        if (e.key === Crafty.keys.RIGHT_ARROW) {
          this._moveR = false;
        }
        if (e.key === Crafty.keys.UP_ARROW) {
          return this._jump = false;
        }
      });
      return this.bind("EnterFrame", function() {
        if (this._moveL) {
          this._moveC(-this._speed);
        }
        if (this._moveR) {
          this._moveC(this._speed);
        }
        if (this._jump) {
          return this._moveA(this._upspeed);
        }
      });
    },
    _moveA: function(px) {
      return this.setRadius(this.getRadius() + px);
    },
    _moveC: function(px) {
      return this.setCircumferenceLocation(this.getCircumferenceLocation() + px);
    }
  });
  Crafty.c("PlanetGravity", {
    init: function() {
      return this.requires("PlanetWalker");
    },
    planetGravity: function(_initial_fall_speed, _accelleration) {
      this._initial_fall_speed = _initial_fall_speed != null ? _initial_fall_speed : 3;
      this._accelleration = _accelleration != null ? _accelleration : 1.05;
      this._fall_speed = this._initial_fall_speed;
      return this.bind("EnterFrame", function() {
        var altitude;
        altitude = this.getAltitude();
        if (altitude > 0) {
          this._falling = true;
          console.log(this._fall_speed);
          this._fall_speed = this._fall_speed * this._accelleration;
          return this.setAltitude(Math.max(altitude - this._fall_speed, 0));
        } else {
          this._falling = false;
          return this._fall_speed = this._initial_fall_speed;
        }
      });
    }
  });
}).call(this);
