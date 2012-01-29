@color_shift = (h, s, l, a=.3) ->
	if FANCY
		overlayer = document.getElementById "overlayer"
		overlayer.style.backgroundColor = "hsla(#{h}, #{s}%, #{l}%, #{a})"
	else
		document.body.style.backgroundColor = "hsl(#{h},#{s}%,#{l}%)"
		
@get_query_variable = (variable) ->
	query = window.location.search.substring(1); 
	vars = query.split("&"); 
	for bit in vars
		pair = bit.split("="); 
		if pair[0] == variable
			return pair[1];
	return false