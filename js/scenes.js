(function() {
  var TESTING;
  TESTING = false;
  Crafty.scene("loading", function() {
    var loading_text, title_text;
    title_text = Crafty.e("2D, DOM, Text, Persist");
    title_text.attr({
      w: Crafty.viewport.width,
      h: 128,
      x: 0,
      y: 40
    });
    title_text.text(GAME_TITLE);
    title_text.css({
      "text-align": "center",
      "color": "#000",
      "font-family": "Medula One",
      "font-size": 128,
      "text-transform": "uppercase"
    });
    loading_text = Crafty.e("2D, DOM, Text");
    loading_text.attr({
      w: Crafty.viewport.width,
      h: 20,
      x: 0,
      y: (Crafty.viewport.width - 20) / 2
    });
    loading_text.text("Loading...");
    loading_text.css({
      "text-align": "center",
      "color": "#000"
    });
    return Crafty.load(["img/person.png", "img/noise.png", "img/spike.png"], function() {
      return Crafty.scene("ouroboros");
    });
  });
  Crafty.scene("ouroboros", function() {
    var KeyDownHandler, death_floor, i, platform, protagonist, snake, snakehead;
    snake = generate_snake(WORLD_RADIUS);
    snakehead = generate_snakehead(snake, 100);
    death_floor = generate_death({
      x: 0,
      y: Crafty.viewport.height - 1,
      w: Crafty.viewport.width,
      h: 1
    });
    platform = generate_platform(snake, 200, {
      w: 100,
      h: 3
    });
    i = 100;
    while ((i + 900) < WORLD_CIRCUMFERENCE) {
      i = Crafty.math.randomInt(i + 300, i + 900);
      generate_spike(snake, i);
    }
    KeyDownHandler = function() {
      var spike, spikes, _i, _len;
      if (!TESTING) {
        snake.startSpin(-.25);
        spikes = Crafty('spike');
        for (_i = 0, _len = spikes.length; _i < _len; _i++) {
          spike = spikes[_i];
          Crafty(spike).addComponent('Deadly');
        }
        return Crafty.unbind("KeyDown", KeyDownHandler);
      }
    };
    Crafty.bind("KeyDown", KeyDownHandler);
    protagonist = generate_protagonist(snake);
    return protagonist.bind("Died", function() {
      return Crafty.scene("ouroboros");
    });
  });
}).call(this);
