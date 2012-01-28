@generate_snake = (radius, rotation_frames) ->
	ent = Crafty.e "2D, DOM, Tween, Solid, Collision, Snake"
	ent.attr {x: (Crafty.viewport.width - 8000)/2, y: Crafty.viewport.height - 200, w: 8000, h: 8000}
	ent.css {'background-color':'#000', 'border-radius': 4000}
	ent.snake(radius, rotation_frames)

@generate_scale = (snake, loc, altitude) ->
	ent = Crafty.e "2D, DOM, Scale, Tween, SnakePart"
	ent.attr {w: 20, h: 20}
	ent.snakepart snake, loc, altitude
	ent.css {'background-color': '#FFF'}

@generate_protagonist = () ->
	ent = Crafty.e "2D, DOM, person, Twoway, Gravity, Protagonist"
	ent.attr {x: (Crafty.viewport.width - 32) / 2, y: 20, w: 32, h:32}
	ent.twoway 0, 6
	ent.gravity "Solid"

@generate_death = (attrs) ->
	ent = Crafty.e "2D, DOM, Death"
	ent.attr attrs