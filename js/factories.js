(function() {
  this.generate_snake = function(radius) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, Solid, Snake");
    return ent.snake(radius);
  };
  this.generate_spike = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, Tween, PlanetWalker, spike, Deadly");
    ent.planetwalker(snake, loc, -2);
    return ent.collision();
  };
  this.generate_snakehead = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, Tween, PlanetWalker, snakehead, Deadly");
    ent.planetwalker(snake, loc, -5);
    return ent.collision();
  };
  this.generate_protagonist = function(snake) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, person, TwowayPlanetWalker, PlanetGravity, Protagonist");
    ent.attr({
      x: (Crafty.viewport.width - 32) / 2,
      y: 20,
      w: 32,
      h: 32
    });
    ent.protagonist();
    ent.planetwalker(snake);
    ent.twowayOnPlanet(snake, 10, 10);
    ent.planetGravity("Platform");
    ent.collision();
    return ent.onHit(function() {
      return console.log("hit something");
    });
  };
  this.generate_platform = function(snake, loc, attrs, altitude) {
    var ent;
    if (altitude == null) {
      altitude = 20;
    }
    ent = Crafty.e("2D, DOM, Collision, Platform, PlanetWalker");
    ent.css({
      'background-color': '#000',
      'border-radius': 3
    });
    ent.attr(attrs);
    ent.planetwalker(snake, loc, altitude);
    return ent.collision();
  };
  this.generate_death = function(attrs) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, Deadly");
    ent.attr(attrs);
    return ent.collision();
  };
  this.generate_box = function(snake, loc, attrs, altitude) {
    var ent;
    if (altitude == null) {
      altitude = 0;
    }
    ent = Crafty.e("2D, DOM, Collision, Pushable, PlanetWalker, Platform");
    ent.attr(attrs);
    ent.css({
      backroundColor: '#000'
    });
    return ent.planetwalker(snake, loc, altitude);
  };
}).call(this);
