@generate_snake = (radius) ->
	ent = Crafty.e "2D, DOM, Tween, Solid, Snake, Collision, Platform"
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
	ent.planetGravity "Platform"

@generate_platform = (snake, loc, attrs, altitude=20) ->
	ent = Crafty.e "2D, DOM, Platform, PlanetWalker, Collision"
	ent.css 'background-color':'#000', 'border-radius': 3
	ent.attr attrs
	ent.collision()
	ent.planetwalker snake, loc, altitude

@generate_death = (attrs) ->
	ent = Crafty.e "2D, DOM, Deadly, Collision"
	ent.attr attrs
	ent.collision()