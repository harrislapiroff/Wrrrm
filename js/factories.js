(function() {
  this.generate_snake = function(radius) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, Solid, Snake, Collision, Platform");
    ent.collision();
    return ent.snake(radius);
  };
  this.generate_spike = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, SnakePart, spike, Collision");
    ent.collision();
    return ent.snakepart(snake, loc, -2);
  };
  this.generate_snakehead = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, SnakePart, snakehead, Collision");
    ent.collision();
    return ent.snakepart(snake, loc, -5);
  };
  this.generate_protagonist = function(snake) {
    var ent;
    ent = Crafty.e("2D, DOM, person, TwowayPlanetWalker, PlanetGravity, Protagonist, Collision");
    ent.collision();
    ent.mortality();
    ent.attr({
      x: (Crafty.viewport.width - 32) / 2,
      y: 20,
      w: 32,
      h: 32
    });
    ent.twowayOnPlanet(snake, 10, 10);
    return ent.planetGravity("Platform");
  };
  this.generate_platform = function(snake, loc, attrs) {
    var ent;
    ent = Crafty.e("2D, DOM, Platform, PlanetWalker, Collision");
    ent.css({
      'background-color': '#000',
      'border-radius': 3
    });
    ent.attr(attrs);
    return ent.planetwalker(snake, loc, 20);
  };
  this.generate_death = function(attrs) {
    var ent;
    ent = Crafty.e("2D, DOM, Deadly, Collision");
    ent.collision();
    return ent.attr(attrs);
  };
}).call(this);
