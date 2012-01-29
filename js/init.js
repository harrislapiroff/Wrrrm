(function() {
  var VIEW_HEIGHT, VIEW_WIDTH, main;
  this.GAME_TITLE = "WRRRM";
  this.FANCY = true;
  this.WORLD_RADIUS = 1000;
  this.WORLD_CIRCUMFERENCE = WORLD_RADIUS * 3.145;
  VIEW_WIDTH = Crafty.DOM.window.width;
  VIEW_HEIGHT = Crafty.DOM.window.height;
  main = function() {
    if (FANCY) {
      document.getElementById("overlayer").setAttribute("class", "fancy");
    }
    Crafty.init(VIEW_WIDTH, VIEW_HEIGHT);
    Crafty.canvas.init();
    return Crafty.scene("loading");
  };
  window.onload = main;
}).call(this);
