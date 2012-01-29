@generate_snake = (radius) ->
	ent = Crafty.e "2D, DOM, Tween, Solid, Snake"
	ent.snake radius

@generate_spike = (snake, loc) ->
	ent = Crafty.e "2D, DOM, Collision, Tween, PlanetWalker, spike, Deadly"
	ent.planetwalker snake, loc, -2
	ent.collision()

@generate_snakehead = (snake, loc) ->
	# create the snake separate from death
	death = Crafty.e "2D, DOM, Collision, PlanetWalker, Deadly, Persist"
	death.attr {w: 20, h: 20}
	death.planetwalker snake, loc
	death.collision()
	# now the snake
	ent = Crafty.e "2D, DOM, Tween, PlanetWalker, snakehead"
	ent.planetwalker snake, loc, -55

@generate_protagonist = (snake) ->
	ent = Crafty.e "2D, DOM, Collision, person, TwowayPlanetWalker, PlanetGravity, Protagonist, SpriteAnimation"
	ent.attr {x: (Crafty.viewport.width - 32) / 2, y: 20, w: 32, h: 32}
	ent.protagonist()
	ent.planetwalker snake
	ent.twowayOnPlanet snake, 10, 10
	ent.planetGravity "Platform"
	ent.collision()
	ent.animate("standingl", 0, 0, 0)
	ent.animate("standingr", 1, 0, 1)
	ent.animate("walkingr", 2, 0, 3)
	ent.animate("walkingl", 4, 0, 5)
	ent.animate("jumpl", 6, 0, 6)
	ent.animate("jumpr", 7, 0, 7)
	
	ent.bind "NewDirection", (direction) ->
		if direction == "left"
			@animate "walkingl", 1, -1
		if direction == "right"
			@animate "walkingr", 1, -1
		if direction == "upleft"
			@animate "jumpl", 1, -1
		if direction == "upright"
			@animate "jumpr", 1, -1
		if direction == "none"
			@animate "standingl", 1, -1
	
	ent.onHit () ->
		console.log "hit something"
	
@generate_platform = (snake, loc, altitude=20) ->
	cloud = Crafty.e "2D, DOM, cloud, PlanetWalker"
	cloud.planetwalker snake, loc - 5, altitude - 10
	ent = Crafty.e "2D, DOM, Collision, Platform, PlanetWalker"
	ent.attr {w: 100, h: 3}
	ent.planetwalker snake, loc, altitude
	ent.collision()

	
@generate_death = (attrs) ->
	ent = Crafty.e "2D, DOM, Collision, Deadly"
	ent.attr attrs
	ent.collision()

@generate_box = (snake, loc, attrs, altitude=0) ->
	ent = Crafty.e "2D, DOM, Collision, Pushable, PlanetWalker, Platform"
	ent.attr attrs
	ent.css {backroundColor: '#000'}
	ent.planetwalker snake, loc, altitude