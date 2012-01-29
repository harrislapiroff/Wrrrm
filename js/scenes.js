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
      return Crafty.scene("Setup");
    });
  });
  Crafty.scene("Setup", function() {
    var KeyDownHandler, death_floor, platform, platform_2, protagonist, snake, snakehead;
    snake = generate_snake(WORLD_RADIUS);
    protagonist = generate_protagonist(snake);
    snakehead = generate_snakehead(snake, 125);
    death_floor = generate_death({
      x: -1000,
      y: Crafty.viewport.height + 30,
      w: Crafty.viewport.width + 2000,
      h: 1
    });
    platform = generate_platform(snake, 800, {
      w: 100,
      h: 3
    }, 80);
    platform_2 = generate_platform(snake, 900, {
      w: 100,
      h: 3
    }, 120);
    snake.addComponent("Persist");
    protagonist.addComponent("Persist");
    snakehead.addComponent("Persist");
    death_floor.addComponent("Persist");
    protagonist.setSurfaceLocation(-100);
    KeyDownHandler = function() {
      Crafty.unbind("KeyDown", KeyDownHandler);
      snake.startSpin(-.25);
      protagonist.mortality();
      return Crafty.scene("Scene 1");
    };
    return Crafty.bind("KeyDown", KeyDownHandler);
  });
  Crafty.scene("Scene 1", function() {
    var i, protagonist, snake;
    snake = Crafty(Crafty("Snake")[0]);
    protagonist = Crafty(Crafty("Protagonist")[0]);
    i = 100;
    while ((i + 900) < WORLD_CIRCUMFERENCE) {
      i = Crafty.math.randomInt(i + 300, i + 900);
      generate_spike(snake, i);
    }
    return protagonist.bind("Died", function() {
      protagonist.immortality();
      snake.rotateTo(0);
      protagonist.mortality();
      protagonist.setSurfaceLocation(-100);
      return Crafty.scene("Scene 1");
    });
  });
}).call(this);
