(function() {
  this.color_shift = function(h, s, l, a) {
    var overlayer;
    if (a == null) {
      a = .3;
    }
    overlayer = document.getElementById("overlayer");
    return overlayer.style.backgroundColor = "hsla(" + h + ", " + s + "%, " + l + "%, " + a + ")";
  };
}).call(this);
