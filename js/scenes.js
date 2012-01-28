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
    var protagonist, scale, snake;
    Crafty.background('#CCC');
    snake = generate_snake(8000, 5000);
    protagonist = generate_protagonist();
    scale = generate_scale(snake, 300, 10);
    snake.startspin();
    return protagonist.bind("Died", function() {
      return Crafty.scene("ouroboros");
    });
  });
}).call(this);
