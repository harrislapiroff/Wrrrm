(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Crafty.c("Protagonist", {
    init: function() {
      return this.requires("2D, DOM, Collision");
    },
    mortality: function() {
      return this.onHit("Deadly", this.die);
    },
    die: function() {
      return this.trigger("Died");
    }
  });
  Crafty.c("Snake", {
    init: function() {
      return this.requires("2D, DOM, Tween, Planet");
    },
    snake: function(radius, stroke) {
      if (stroke == null) {
        stroke = 40;
      }
      this.planet(radius, stroke);
      return this.css({
        'border-style': 'solid',
        'border-color': '#000',
        'background': 'transparent'
      });
    }
  });
  Crafty.c("SnakePart", {
    init: function() {
      return this.requires("2D, DOM, Tween, PlanetWalker");
    },
    snakepart: function(snake, surface_location, altitude) {
      return this.planetwalker(snake, surface_location, altitude);
    }
  });
  Crafty.c("Planet", {
    _rotation_speed: 1,
    _rotating: false,
    _theta: 0,
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
      this.css({
        'border-radius': this.radius,
        'border-width': "" + this.stroke + "px"
      });
      this.origin(this.radius, this.radius);
      return this.bind("EnterFrame", function() {
        if (this._rotating) {
          this.rotate();
        }
        return this.attr({
          rotation: this._theta
        });
      });
    },
    rotate: function() {
      var old_theta;
      old_theta = this._theta;
      this._theta = (this._theta + this._rotation_speed) % 360;
      return this.trigger("Rotated", this._theta - old_theta);
    },
    startSpin: function(_rotation_speed) {
      this._rotation_speed = _rotation_speed != null ? _rotation_speed : this._rotation_speed;
      this._rotating = true;
      return this.trigger("StartRotation");
    },
    stopSpin: function() {
      this._rotating = false;
      return this.trigger("StopRotation");
    },
    getCartesianCoords: function() {
      return this.pos();
    },
    circumference: function() {
      return this.radius * 6.28;
    }
  });
  Crafty.c("PlanetWalker", {
    _theta: 0,
    _altitude: 0,
    init: function() {
      return this.requires("2D, DOM, Tween");
    },
    planetwalker: function(planet, surface_location, altitude) {
      this.planet = planet;
      if (surface_location == null) {
        surface_location = false;
      }
      if (altitude == null) {
        altitude = false;
      }
      if (altitude) {
        this._altitude = altitude;
      }
      if (surface_location) {
        this.setSurfaceLocation(surface_location);
      }
      this.attr({
        x: (Crafty.viewport.width - this.pos()._w) / 2
      });
      this.planet.bind("Rotated", __bind(function(tdelta) {
        return this.rotateBy(tdelta);
      }, this));
      return this.bind("EnterFrame", function() {
        this.attr({
          rotation: this._theta,
          y: this.planet.pos()._y - this._altitude - this.pos()._h
        });
        this.origin(this.pos()._w / 2, this.planet.radius + this._altitude + this.pos()._h);
        if (this.collision) {
          return this.collision();
        }
      });
    },
    rotateBy: function(tdelta) {
      return this._theta = this._theta + tdelta % 360;
    },
    getAltitude: function() {
      return this._altitude;
    },
    setAltitude: function(a) {
      return this._altitude = a;
    },
    setSurfaceLocation: function(surface_location) {
      return this._theta = surface_location * 360 / this.planet.circumference();
    },
    getCircumferenceLocation: function() {
      return this._theta * this.planet.circumference() / 360;
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
      return this.setAltitude(this.getAltitude() + px);
    },
    _moveC: function(px) {
      return this.setSurfaceLocation(this.getCircumferenceLocation() + px);
    }
  });
  Crafty.c("PlanetGravity", {
    init: function() {
      return this.requires("PlanetWalker");
    },
    planetGravity: function(_collision_selector, _initial_fall_speed, _accelleration) {
      this._collision_selector = _collision_selector != null ? _collision_selector : false;
      this._initial_fall_speed = _initial_fall_speed != null ? _initial_fall_speed : 3;
      this._accelleration = _accelleration != null ? _accelleration : 1.05;
      this._fall_speed = this._initial_fall_speed;
      return this.bind("EnterFrame", function() {
        var altitude, collision, collision_entity, collision_normal;
        altitude = this.getAltitude();
        if (altitude > 0) {
          this._falling = true;
        } else {
          this._falling = false;
          this._fall_speed = this._initial_fall_speed;
        }
        if (this.hit(this._collision_selector)) {
          collision = this.hit(this._collision_selector)[0];
          collision_entity = collision.obj;
          collision_normal = collision.normal;
          if (collision.normal.y <= 0 && !this._jump) {
            this._falling = false;
            this.setAltitude(collision_entity.getAltitude() + collision_entity.pos()._h);
          }
          if (collision.normal.y > 0) {
            this._falling = true;
            this.setAltitude(collision_entity.getAltitude() - collision_entity.pos()._h - this.pos()._h);
          }
        }
        if (this._falling === true) {
          this._falling = true;
          this._fall_speed = this._fall_speed * this._accelleration;
          return this.setAltitude(Math.max(altitude - this._fall_speed, 0));
        }
      });
    }
  });
}).call(this);
