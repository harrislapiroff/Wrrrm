(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Crafty.c("Protagonist", {
    init: function() {
      return this.requires("2D, DOM, Collision");
    },
    protagonist: function() {
      return this.onHit("Deadly", this.die);
    },
    mortality: function() {
      return this._mortality = true;
    },
    immortality: function() {
      return this._mortality = false;
    },
    die: function() {
      if (this._mortality) {
        return this.trigger("Died");
      }
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
        this._theta = this._theta % 360;
        return this.attr({
          rotation: this._theta
        });
      });
    },
    rotate: function() {
      var old_theta;
      old_theta = this._theta;
      this._theta = this._theta + this._rotation_speed;
      this.trigger("Rotated", this._theta - old_theta);
      if ((this._theta >= 360) || (this._theta <= -360)) {
        return this.trigger("CompleteRotation");
      }
    },
    rotateTo: function(theta) {
      var old_theta;
      old_theta = this._theta;
      this._theta = 0;
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
        this.setAltitude(altitude);
      }
      if (surface_location) {
        this.setSurfaceLocation(surface_location);
      }
      this.attr({
        x: (Crafty.viewport.width - this.pos()._w) / 2
      });
      this.attachToPlanet();
      this.planet.bind("Rotated", __bind(function(tdelta) {
        if (this._attached_to_planet) {
          return this.rotateBy(tdelta);
        }
      }, this));
      return this.bind("EnterFrame", function() {
        var x, y;
        this._theta = this._theta % 360;
        this.attr({
          rotation: this._theta,
          y: this.planet.pos()._y - this._altitude - this.pos()._h
        });
        this.origin(this.pos()._w / 2, this.planet.radius + this._altitude + this.pos()._h);
        if (this.map) {
          x = (this.planet.radius + altitude) * Math.cos((90 - this._theta) * Math.PI / 180) + Crafty.viewport.width / 2 - this.pos()._w / 2;
          y = Crafty.viewport.height / 2 - (this.planet.radius + altitude) * Math.sin((90 - this._theta) * Math.PI / 180) + this.planet.radius - this.pos()._h / 2;
          this.map.shift(-this.map.points[0].x, -this.map.points[0].y);
          return this.map.shift(x, y);
        }
      });
    },
    attachToPlanet: function() {
      return this._attached_to_planet = true;
    },
    detachFromPlanet: function() {
      return this._attached_to_planet = false;
    },
    rotateBy: function(tdelta) {
      this._theta = this._theta + tdelta;
      return this.trigger("RotationChange");
    },
    getAltitude: function() {
      return this._altitude;
    },
    setAltitude: function(a) {
      this._altitude = a;
      return this.trigger("AltitudeChange");
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
      this.bind("KeyDown", function(e) {
        var move;
        if (e.key === Crafty.keys.LEFT_ARROW) {
          this._moveL = true;
          move = true;
        }
        if (e.key === Crafty.keys.RIGHT_ARROW) {
          this._moveR = true;
          move = true;
        }
        if (e.key === Crafty.keys.UP_ARROW && !this.isFalling()) {
          this._jump = true;
          move = true;
        }
        if (move) {
          return this.trigger("NewDirection");
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
        var moved;
        if (this._moveL) {
          this._moveC(-this._speed);
          moved = true;
        }
        if (this._moveR) {
          this._moveC(this._speed);
          moved = true;
        }
        if (this._jump) {
          this._moveA(this._upspeed);
          moved = true;
        }
        if (moved) {
          return this.trigger("Moved");
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
          if (this.getAltitude() > collision_entity.getAltitude() - 10) {
            this._falling = false;
            this._fall_speed = this._initial_fall_speed;
          }
        }
        if (this._falling === true) {
          this._fall_speed = this._fall_speed * this._accelleration;
          return this.setAltitude(Math.max(altitude - this._fall_speed, 0));
        }
      });
    },
    isFalling: function() {
      return this._falling;
    }
  });
  Crafty.c("VisibleCollisionPolygon", {
    init: function() {
      this.ctx = Crafty.canvas.context;
      return this.bind("EnterFrame", function() {
        return this.makePoly();
      });
    },
    makePoly: function() {
      var point, _i, _len, _ref;
      if (this.map) {
        this.ctx.beginPath();
        _ref = this.map.points;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          point = _ref[_i];
          this.ctx.moveTo(point[0], point[1]);
        }
        return this.ctx.stroke();
      }
    }
  });
}).call(this);
