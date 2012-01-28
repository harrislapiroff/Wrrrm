@generate_snake = (radius) ->
	ent = Crafty.e "2D, DOM, Tween, Solid, Snake, Collision"
	ent.collision()
	ent.snake radius

@generate_spike = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Tween, SnakePart, spike, Collision"
	ent.collision()
	ent.snakepart snake, loc, -2

@generate_snakehead = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Tween, SnakePart, snakehead, Collision"
	ent.collision()
	ent.snakepart snake, loc, -5

@generate_protagonist = (snake) ->
	ent = Crafty.e "2D, DOM, person, TwowayPlanetWalker, PlanetGravity, Protagonist, Collision"
	ent.collision()
	ent.mortality()
	ent.attr {x: (Crafty.viewport.width - 32) / 2, y: 20, w: 32, h:32}
	ent.twowayOnPlanet snake, 10, 10
	ent.planetGravity()

@generate_platform = (snake, loc, attrs) ->
	ent = Crafty.e "2D, DOM, Platform, PlanetWalker, Collision"
	ent.css 'background-color':'#000', 'border-radius': 3
	ent.attr attrs
	ent.planetwalker snake, loc, 20

@generate_death = (attrs) ->
	ent = Crafty.e "2D, DOM, Deadly, Collision"
	ent.collision()
	ent.attr attrs
