(function() {
  this.generate_snake = function(radius) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, Solid, Collision, Snake");
    return ent.snake(radius);
  };
  this.generate_spike = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, SnakePart, spike");
    return ent.snakepart(snake, loc, -2);
  };
  this.generate_snakehead = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, SnakePart, snakehead");
    return ent.snakepart(snake, loc, -5);
  };
  this.generate_protagonist = function(snake) {
    var ent;
    ent = Crafty.e("2D, DOM, person, TwowayPlanetWalker, PlanetGravity, Protagonist");
    ent.attr({
      x: (Crafty.viewport.width - 32) / 2,
      y: 20,
      w: 32,
      h: 32
    });
    ent.twowayOnPlanet(snake, 10, 10);
    return ent.planetGravity();
  };
  this.generate_death = function(attrs) {
    var ent;
    ent = Crafty.e("2D, DOM, Deadly");
    return ent.attr(attrs);
  };
}).call(this);
