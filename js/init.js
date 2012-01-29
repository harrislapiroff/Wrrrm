(function() {
  var VIEW_HEIGHT, VIEW_WIDTH, main;
  this.GAME_TITLE = "WRRRM";
  if (get_query_variable('fancy') === "true") {
    this.FANCY = true;
  } else {
    this.FANCY = false;
  }
  this.WORLD_RADIUS = 1000;
  this.WORLD_CIRCUMFERENCE = WORLD_RADIUS * 3.145;
  VIEW_WIDTH = Crafty.DOM.window.width;
  VIEW_HEIGHT = Crafty.DOM.window.height;
  main = function() {
    if (FANCY) {
      document.body.setAttribute("class", "fancy");
    }
    Crafty.init(VIEW_WIDTH, VIEW_HEIGHT);
    Crafty.canvas.init();
    return Crafty.scene("loading");
  };
  window.onload = main;
}).call(this);
