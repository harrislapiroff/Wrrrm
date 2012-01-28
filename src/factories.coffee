@generate_snake = (radius, rotation_frames) ->
	ent = Crafty.e "2D, DOM, Tween, Solid, Collision, Snake"
	ent.snake radius, rotation_frames

@generate_scale = (snake, loc, altitude) ->
	ent = Crafty.e "2D, DOM, Scale, Tween, SnakePart"
	ent.attr {w: 20, h: 20}
	ent.snakepart snake, loc, altitude
	ent.css {'background-color': '#FFF'}

@generate_spike = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Tween, SnakePart, spike"
	ent.snakepart snake, loc, 32

@generate_snakehead = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Tween, SnakePart, snakehead"
	ent.snakepart snake, loc, 30
	
@generate_protagonist = () ->
	ent = Crafty.e "2D, DOM, person, Twoway, Gravity, Protagonist"
	ent.attr {x: (Crafty.viewport.width - 32) / 2, y: 20, w: 32, h:32}
	ent.twoway 0, 10
	ent.gravity "Solid"

@generate_death = (attrs) ->
	ent = Crafty.e "2D, DOM, Deadly"
	ent.attr attrs