(function() {
  this.generate_snake = function(radius, rotation_frames) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, Solid, Collision, Snake");
    ent.attr({
      x: (Crafty.viewport.width - 8000) / 2,
      y: Crafty.viewport.height - 200,
      w: 8000,
      h: 8000
    });
    ent.css({
      'background-color': '#000',
      'border-radius': 4000
    });
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
  this.generate_protagonist = function() {
    var ent;
    ent = Crafty.e("2D, DOM, person, Twoway, Gravity, Protagonist");
    ent.attr({
      x: (Crafty.viewport.width - 32) / 2,
      y: 20,
      w: 32,
      h: 32
    });
    ent.twoway(0, 10);
    return ent.gravity("Solid");
  };
  this.generate_death = function(attrs) {
    var ent;
    ent = Crafty.e("2D, DOM, Deadly");
    return ent.attr(attrs);
  };
}).call(this);
