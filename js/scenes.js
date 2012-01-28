(function() {
  Crafty.scene("loading", function() {
    var loading_text;
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
    return Crafty.load(["img/person.png"], function() {
      return Crafty.scene("ouroboros");
    });
  });
  Crafty.scene("ouroboros", function() {
    var KeyDownHandler, i, protagonist, snake;
    Crafty.background('#CCC');
    snake = generate_snake(8000, 5000);
    i = 100;
    while (i < WORLD_CIRCUMFERENCE) {
      i = Crafty.math.randomInt(i + 300, i + 900);
      generate_spike(snake, i);
    }
    KeyDownHandler = function() {
      var spike, spikes, _i, _len;
      snake.startspin();
      spikes = Crafty('spike');
      for (_i = 0, _len = spikes.length; _i < _len; _i++) {
        spike = spikes[_i];
        Crafty(spike).addComponent('Deadly');
      }
      return Crafty.unbind("KeyDown", KeyDownHandler);
    };
    Crafty.bind("KeyDown", KeyDownHandler);
    protagonist = generate_protagonist();
    return protagonist.bind("Died", function() {
      return Crafty.scene("ouroboros");
    });
  });
}).call(this);
