(function() {
  this.generate_snake = function(radius) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, Solid, Snake");
    return ent.snake(radius);
  };
  this.generate_spike = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, Tween, PlanetWalker, spike, Deadly");
    return ent.planetwalker(snake, loc, -2);
  };
  this.generate_snakehead = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, Tween, PlanetWalker, snakehead, Deadly");
    return ent.planetwalker(snake, loc, -5);
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
    ent.planetwalker(snake);
    ent.twowayOnPlanet(snake, 10, 10);
    ent.planetGravity("Platform");
    return ent.collision();
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
}).call(this);
