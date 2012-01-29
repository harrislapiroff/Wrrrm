@generate_snake = (radius) ->
	ent = Crafty.e "2D, DOM, Tween, Solid, Snake"
	ent.snake radius

@generate_spike = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Collision, Tween, PlanetWalker, spike, Deadly"
	ent.planetwalker snake, loc, -2
	ent.collision()

@generate_snakehead = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Collision, Tween, PlanetWalker, snakehead, Deadly"
	ent.planetwalker snake, loc, -5
	ent.collision()

@generate_protagonist = (snake) ->
	ent = Crafty.e "2D, DOM, Collision, person, TwowayPlanetWalker, PlanetGravity, Protagonist"
	ent.attr {x: (Crafty.viewport.width - 32) / 2, y: 20, w: 32, h: 32}
	ent.planetwalker snake
	ent.twowayOnPlanet snake, 10, 10
	ent.planetGravity "Platform"
	ent.collision()
	ent.onHit () ->
		console.log "hit something"
	
@generate_platform = (snake, loc, attrs, altitude=20) ->
	ent = Crafty.e "2D, DOM, Collision, Platform, PlanetWalker"
	ent.css 'background-color':'#000', 'border-radius': 3
	ent.attr attrs
	ent.planetwalker snake, loc, altitude
	ent.collision()
	
@generate_death = (attrs) ->
	ent = Crafty.e "2D, DOM, Collision, Deadly"
	ent.attr attrs
	ent.collision()