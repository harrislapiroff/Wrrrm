(function() {
  var PLAYER_ORIGIN, SNAKEHEAD_ORIGIN;
  SNAKEHEAD_ORIGIN = 500;
  PLAYER_ORIGIN = -100;
  Crafty.scene("loading", function() {
    var loading_text, title_text;
    title_text = Crafty.e("2D, DOM, Text, Tween, Persist, Title");
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
      var audio_element, audio_end;
      audio_end = function() {
        var aud;
        aud = this.cloneNode(true);
        aud.play();
        return aud.addEventListener("ended", audio_end);
      };
      Crafty.audio.play("music");
      audio_element = Crafty.audio._elems["music"][0];
      audio_element.addEventListener("ended", audio_end);
      return Crafty.scene("Setup");
    });
  });
  Crafty.scene("Setup", function() {
    var MovedHandler, death_floor, platform, platform_2, protagonist, snake, snakehead, title_text;
    title_text = Crafty(Crafty("Title")[0]);
    snake = generate_snake(WORLD_RADIUS);
    protagonist = generate_protagonist(snake);
    snakehead = generate_snakehead(snake, SNAKEHEAD_ORIGIN);
    death_floor = generate_death({
      x: -1000,
      y: Crafty.viewport.height + 30,
      w: Crafty.viewport.width + 2000,
      h: 1
    });
    platform = generate_platform(snake, 800, 80);
    platform_2 = generate_platform(snake, 900, 120);
    snake.addComponent("Persist");
    protagonist.addComponent("Persist");
    snakehead.addComponent("Persist");
    death_floor.addComponent("Persist");
    protagonist.setSurfaceLocation(PLAYER_ORIGIN);
    protagonist.bind("Died", function() {
      protagonist.immortality();
      snake.stopSpin();
      snake.rotateTo(0);
      protagonist.mortality();
      protagonist.setSurfaceLocation(PLAYER_ORIGIN);
      return Crafty.scene(Crafty._current);
    });
    MovedHandler = function() {
      var level;
      protagonist.unbind("Moved", MovedHandler);
      title_text.tween({
        alpha: 0
      }, 100);
      protagonist.mortality();
      level = get_query_variable("level");
      if (level) {
        return Crafty.scene("Scene " + level);
      } else {
        return Crafty.scene("Scene 1");
      }
    };
    return protagonist.bind("Moved", MovedHandler);
  });
  Crafty.scene("Scene 1", function() {
    var i, protagonist, snake, _i, _len, _ref;
    snake = Crafty(Crafty("Snake")[0]);
    protagonist = Crafty(Crafty("Protagonist")[0]);
    color_shift(0, 0, 80);
    snake.delay((function() {
      return this.startSpin(-.05);
    }), 2000);
    snake.delay((function() {
      return this.startSpin(-.1);
    }), 4000);
    snake.delay((function() {
      return this.startSpin(-.15);
    }), 6000);
    snake.delay((function() {
      return this.startSpin(-.2);
    }), 8000);
    snake.delay((function() {
      return this.startSpin(-.25);
    }), 10000);
    snake.delay((function() {
      return this.startSpin(-.3);
    }), 12000);
    snake.delay((function() {
      return this.startSpin(-.35);
    }), 14000);
    _ref = [900, 1800, 2400, 2450, 2500];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      generate_spike(snake, i);
    }
    generate_platform(snake, 3000, 40);
    generate_platform(snake, 3250, 80);
    generate_platform(snake, 3500, 120);
    generate_platform(snake, 3750, 160);
    return snake.bind("CompleteRotation", function() {
      return Crafty.scene("Scene 2");
    });
  });
  Crafty.scene("Scene 2", function() {
    var i, protagonist, snake, _i, _len, _ref;
    snake = Crafty(Crafty("Snake")[0]);
    protagonist = Crafty(Crafty("Protagonist")[0]);
    color_shift(60, 70, 50);
    snake.startSpin(-.35);
    _ref = [900, 1300, 1700, 2100, 2150, 2200, 2600, 3000, 3400, 3800, 3850, 3900, 4300, 4700, 5100, 5500];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      generate_spike(snake, i);
    }
    return snake.bind("CompleteRotation", function() {
      return Crafty.scene("Scene 3");
    });
  });
  Crafty.scene("Scene 3", function() {
    var i, protagonist, snake, _i, _len, _ref;
    snake = Crafty(Crafty("Snake")[0]);
    protagonist = Crafty(Crafty("Protagonist")[0]);
    color_shift(190, 20, 30);
    snake.startSpin(-.25);
    _ref = [900, 950, 1000, 1050, 1100, 1800, 1850, 1900, 1950, 2000, 2050, 2100, 2150, 4700, 5100, 5500];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      generate_spike(snake, i);
    }
    generate_platform(snake, 2000, 50);
    generate_platform(snake, 2300, 80);
    return snake.bind("CompleteRotation", function() {
      return Crafty.scene("Scene 4");
    });
  });
  Crafty.scene("Scene 4", function() {
    var i, protagonist, snake, _i, _len, _ref;
    snake = Crafty(Crafty("Snake")[0]);
    protagonist = Crafty(Crafty("Protagonist")[0]);
    color_shift(0, 90, 30);
    snake.startSpin(-.5);
    _ref = [900, 1300, 1700, 2100, 2150, 2200, 2600, 3000, 3400, 3800, 3850, 3900, 4300, 4700, 5100, 5500];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      generate_spike(snake, i);
    }
    return snake.bind("CompleteRotation", function() {
      return Crafty.scene("Scene 5");
    });
  });
  Crafty.scene("Scene 5", function() {
    var protagonist, snake;
    snake = Crafty(Crafty("Snake")[0]);
    protagonist = Crafty(Crafty("Protagonist")[0]);
    color_shift(340, 80, 20);
    snake.startSpin(-.62);
    return snake.bind("CompleteRotation", function() {
      return Crafty.scene("Scene 6");
    });
  });
  Crafty.scene("Scene 6", function() {
    var i, protagonist, snake, _i, _len, _ref;
    snake = Crafty(Crafty("Snake")[0]);
    protagonist = Crafty(Crafty("Protagonist")[0]);
    color_shift(25, 90, 60);
    snake.startSpin(-.1);
    snake.delay((function() {
      return this.startSpin(-.2);
    }), 200);
    snake.delay((function() {
      return this.startSpin(-.3);
    }), 400);
    snake.delay((function() {
      return this.startSpin(-.45);
    }), 600);
    snake.delay((function() {
      return this.startSpin(-.6);
    }), 1000);
    _ref = [825, 850, 900, 1500, 1600, 2200, 2250, 2300, 2600, 3800, 3850, 3900, 4300, 4700, 5100, 5500];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      generate_spike(snake, i);
    }
    return snake.bind("CompleteRotation", function() {
      return Crafty.scene("Scene 7");
    });
  });
}).call(this);
