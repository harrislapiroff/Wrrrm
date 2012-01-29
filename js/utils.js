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
  this.get_query_variable = function(variable) {
    var bit, pair, query, vars, _i, _len;
    query = window.location.search.substring(1);
    vars = query.split("&");
    for (_i = 0, _len = vars.length; _i < _len; _i++) {
      bit = vars[_i];
      pair = bit.split("=");
      if (pair[0] === variable) {
        return pair[1];
      }
    }
    return false;
  };
}).call(this);
