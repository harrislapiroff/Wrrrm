(function() {
  this.color_shift = function(h, s, l, a) {
    var overlayer;
    if (a == null) {
      a = .3;
    }
    if (FANCY) {
      overlayer = document.getElementById("overlayer");
      return overlayer.style.backgroundColor = "hsla(" + h + ", " + s + "%, " + l + "%, " + a + ")";
    } else {
      return document.body.style.backgroundColor = "hsl(" + h + "," + s + "%," + l + "%)";
    }
  };
}).call(this);
