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
    var audio_element, audio_end, audio_playing;
    if (FANCY) {
      document.body.setAttribute("class", "fancy");
    }
    audio_end = function() {
      var aud;
      aud = this.cloneNode(true);
      aud.play();
      return aud.addEventListener("ended", audio_end);
    };
    Crafty.audio.play("music");
    audio_element = Crafty.audio._elems["music"][0];
    audio_element.addEventListener("ended", audio_end);
    audio_playing = true;
    Crafty.init(VIEW_WIDTH, VIEW_HEIGHT);
    Crafty.canvas.init();
    return Crafty.scene("loading");
  };
  window.onload = main;
}).call(this);
