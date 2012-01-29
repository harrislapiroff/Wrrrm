(function() {
  this.generate_snake = function(radius) {
    var ent;
    ent = Crafty.e("2D, DOM, Tween, Solid, Snake");
    return ent.snake(radius);
  };
  this.generate_spike = function(snake, loc) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, Tween, PlanetWalker, spike, Deadly");
    ent.planetwalker(snake, loc, -2);
    return ent.collision();
  };
  this.generate_snakehead = function(snake, loc) {
    var death, ent;
    death = Crafty.e("2D, DOM, Collision, PlanetWalker, Deadly, Persist");
    death.attr({
      w: 20,
      h: 20
    });
    death.planetwalker(snake, loc);
    death.collision();
    ent = Crafty.e("2D, DOM, Tween, PlanetWalker, snakehead");
    return ent.planetwalker(snake, loc, -55);
  };
  this.generate_protagonist = function(snake) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, person, TwowayPlanetWalker, PlanetGravity, Protagonist, SpriteAnimation");
    ent.attr({
      x: (Crafty.viewport.width - 32) / 2,
      y: 20,
      w: 32,
      h: 32
    });
    ent.protagonist();
    ent.planetwalker(snake);
    ent.twowayOnPlanet(snake, 10, 10);
    ent.planetGravity("Platform");
    ent.collision();
    ent.animate("standingl", 0, 0, 0);
    ent.animate("standingr", 1, 0, 1);
    ent.animate("walkingr", 2, 0, 3);
    ent.animate("walkingl", 4, 0, 5);
    ent.animate("jumpl", 6, 0, 6);
    ent.animate("jumpr", 7, 0, 7);
    ent.bind("NewDirection", function(direction) {
      if (direction === "left") {
        this.animate("walkingl", 20, -1);
      }
      if (direction === "right") {
        this.animate("walkingr", 20, -1);
      }
      if (direction === "upleft") {
        this.animate("jumpl", 20, -1);
      }
      if (direction === "upright") {
        this.animate("jumpr", 20, -1);
      }
      if (direction === "none") {
        return this.animate("standingl", 20, -1);
      }
    });
    return ent.onHit(function() {
      return console.log("hit something");
    });
  };
  this.generate_platform = function(snake, loc, altitude) {
    var cloud, ent;
    if (altitude == null) {
      altitude = 20;
    }
    cloud = Crafty.e("2D, DOM, cloud, PlanetWalker");
    cloud.planetwalker(snake, loc - 5, altitude - 10);
    ent = Crafty.e("2D, DOM, Collision, Platform, PlanetWalker");
    ent.attr({
      w: 100,
      h: 3
    });
    ent.planetwalker(snake, loc, altitude);
    return ent.collision();
  };
  this.generate_death = function(attrs) {
    var ent;
    ent = Crafty.e("2D, DOM, Collision, Deadly");
    ent.attr(attrs);
    return ent.collision();
  };
  this.generate_box = function(snake, loc, attrs, altitude) {
    var ent;
    if (altitude == null) {
      altitude = 0;
    }
    ent = Crafty.e("2D, DOM, Collision, Pushable, PlanetWalker, Platform");
    ent.attr(attrs);
    ent.css({
      backroundColor: '#000'
    });
    return ent.planetwalker(snake, loc, altitude);
  };
}).call(this);
