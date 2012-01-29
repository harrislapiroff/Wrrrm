@color_shift = (h, s, l, a=.3) ->
	if FANCY
		overlayer = document.getElementById "overlayer"
		overlayer.style.backgroundColor = "hsla(#{h}, #{s}%, #{l}%, #{a})"
	else
		document.body.style.backgroundColor = "hsl(#{h},#{s}%,#{l}%)"