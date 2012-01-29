@color_shift = (h, s, l, a=.3) ->
	overlayer = document.getElementById "overlayer"
	overlayer.style.backgroundColor = "hsla(#{h}, #{s}%, #{l}%, #{a})"