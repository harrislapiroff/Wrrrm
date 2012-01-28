(function() {
  var VIEW_HEIGHT, VIEW_WIDTH, main;
  this.WORLD_CIRCUMFERENCE = 8000 * 3.145;
  VIEW_WIDTH = 800;
  VIEW_HEIGHT = 600;
  main = function() {
    Crafty.init(VIEW_WIDTH, VIEW_HEIGHT);
    Crafty.canvas.init();
    return Crafty.scene("loading");
  };
  window.onload = main;
}).call(this);
