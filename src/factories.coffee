@generate_snake = (radius) ->
	ent = Crafty.e "2D, DOM, Tween, Solid, Collision, Snake"
	ent.snake radius

@generate_spike = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Tween, SnakePart, spike"
	ent.snakepart snake, loc, -2

@generate_snakehead = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Tween, SnakePart, snakehead"
	ent.snakepart snake, loc, -5
	
@generate_protagonist = (snake) ->
	ent = Crafty.e "2D, DOM, person, TwowayPlanetWalker, PlanetGravity, Protagonist"
	ent.attr {x: (Crafty.viewport.width - 32) / 2, y: 20, w: 32, h:32}
	ent.twowayOnPlanet snake, 10, 10
	ent.planetGravity()

@generate_death = (attrs) ->
	ent = Crafty.e "2D, DOM, Deadly"
	ent.attr attrs