(function() {
  this.generate_snake = function(radius, rotation_frames) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, Solid, Collision, Snake");
    return ent.snake(radius, rotation_frames);
  };
  this.generate_scale = function(snake, loc, altitude) {
    var ent;
    ent = Crafty.e("2D, DOM, Scale, Tween, SnakePart");
    ent.attr({
      w: 20,
      h: 20
    });
    ent.snakepart(snake, loc, altitude);
    return ent.css({
      'background-color': '#FFF'
    });
  };
  this.generate_spike = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, SnakePart, spike");
    return ent.snakepart(snake, loc, 32);
  };
  this.generate_snakehead = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, SnakePart, snakehead");
    return ent.snakepart(snake, loc, 30);
  };
  this.generate_protagonist = function(snake) {
    var ent;
    ent = Crafty.e("2D, DOM, person, TwowayPlanetWalker, Gravity, Protagonist");
    ent.attr({
      x: (Crafty.viewport.width - 32) / 2,
      y: 20,
      w: 32,
      h: 32
    });
    ent.twowayOnPlanet(snake, 3, 10);
    return ent.gravity("Solid");
  };
  this.generate_death = function(attrs) {
    var ent;
    ent = Crafty.e("2D, DOM, Deadly");
    return ent.attr(attrs);
  };
}).call(this);
