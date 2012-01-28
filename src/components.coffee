Crafty.c "Protagonist",
	init: () ->
		@requires "2D, DOM, Collision"
		@onHit "Deadly", @die
		@onHit "Scale", () ->
			console.log "Hit a scale."
	die: () ->
		@trigger("Died")


Crafty.c "Snake"
	init: () ->
		@requires "2D, DOM, Tween, Planet"
		
	snake: (@radius, @rotation_frames, @stroke=40) ->
		@planet @radius, @stroke
		# set the radius and number of frames for a complete rotation for the snake.
		@origin @radius, @radius


Crafty.c "SnakePart",
	init: () ->
		@requires "2D, DOM, Tween, PlanetWalker"
		
	snakepart: (@snake, @circumference_location, @altitude=0) ->
		# set which snake the part is attached to and where on the circumference of the snake the part is located
		# please call this *after* setting a width and height on the entity and its snake parent
		
		# initialize the planetwalkerness
		@planetwalker @snake, 0, @altitude + @snake.radius
		@setCircumferenceLocation @circumference_location

Crafty.c "Planet",
	init: () ->
		@requires "2D, DOM"
	
	planet: (@radius, @stroke) ->
		@attr {x: Crafty.viewport.width/2 - @radius, y: Crafty.viewport.height - 200, w: (@radius-@stroke)*2, h: (@radius-@stroke)*2}
		@css
			'border-radius': @radius
			'border': "#{@stroke}px solid #000"
	
	startspin: () ->
		# start the snake spinning
		@attr {rotation: 0}
		@tween {rotation: -360}, @rotation_frames
		@trigger "StartSpin"

	stopspin: () ->
		# unimplemented, because there's currently no method to stop the tween
		@trigger "StopSpin"
	
	getCartesianCoords: () ->
		return @pos()
	
	circumference: () ->
		# returns the circumference of the snake
		@radius * 6.28

Crafty.c "PlanetWalker",
	init: () ->
		@requires "2D, DOM"
	
	planetwalker: (@planet, @theta, @r) ->
		# set default position
		@position @theta, @r
		
		# bind the spinning to the snake spinning
		@planet.bind "StartSpin", () => @_startspin()
		@planet.bind "StopSpin", () => @_stopspin()
	
	_startspin: (e) ->
		@tween {rotation: @theta - 360}, @snake.rotation_frames
	
	_stopspin: () ->
		# unimplemented, because there's currently no method to stop the tween
	
	position: (@theta, @r) ->
		# provide theta in degrees
		@altitude = @r - @planet.radius
		
		# set the origin to the center of the planet
		@origin @pos()._w/2, @planet.radius + @altitude
		
		# rotate the entity to be at the correct location on the snake
		@attr {rotation: @theta, y: @planet.pos()._y - @altitude, x: (Crafty.viewport.width - @pos()._w)/2}
	
	setCircumferenceLocation: (circumference_location) ->
		theta = circumference_location * 360 / @planet.circumference()
		@position theta, @r