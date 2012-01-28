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
		@requires "2D, DOM, Tween"
	
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
		@requires "2D, DOM, Tween"
	
	planetwalker: (@planet, @theta=0, @r=false) ->
		unless @r
			@r = @planet.radius + @pos()._h
		# set default position
		@position @theta, @r
		
		# bind the spinning to the snake spinning
		@planet.bind "StartSpin", () => @_startspin()
		@planet.bind "StopSpin", () => @_stopspin()
	
	getRadius: () ->
		@r
	
	getAltitude: () ->
		@r - @planet.radius - @pos()._h
		
	setRadius: (r) ->
		@position @theta, r
	
	setAltitude: (a) ->
		@position @theta, a + @planet.radius + @pos()._h
	
	_startspin: (e) ->
		@tween {rotation: @theta - 360}, @planet.rotation_frames
	
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
	
	getCircumferenceLocation: () ->
		@theta * @planet.circumference() / 360

Crafty.c "TwowayPlanetWalker",
	_speed: 3
	_upspeed: 0

	init: () ->
		@requires "PlanetWalker"
	
	twowayOnPlanet: (@planet, @_speed, @_upspeed) ->
		@planetwalker @planet
		
		@bind "KeyDown", (e) ->
			if e.key == Crafty.keys.LEFT_ARROW
				@_moveL = true
			if e.key == Crafty.keys.RIGHT_ARROW
				@_moveR = true
			if e.key == Crafty.keys.UP_ARROW
				@_jump = true
				
		@bind "KeyUp", (e) ->
			if e.key == Crafty.keys.LEFT_ARROW
				@_moveL = false
			if e.key == Crafty.keys.RIGHT_ARROW
				@_moveR = false
			if e.key == Crafty.keys.UP_ARROW
				@_jump = false
		
		@bind "EnterFrame", () ->
			if @_moveL
				@_moveC(-@_speed)
			if @_moveR
				@_moveC(@_speed)
			if @_jump
				@_moveA(@_upspeed)
	
	_moveA: (px) ->
		@setRadius @getRadius() + px
	
	_moveC: (px) ->
		@setCircumferenceLocation @getCircumferenceLocation() + px

Crafty.c "PlanetGravity",
	
	init: () ->
		@requires "PlanetWalker"
	
	planetGravity: (@_initial_fall_speed=3, @_accelleration=1.05) ->
		@_fall_speed = @_initial_fall_speed
		@bind "EnterFrame", () ->
			altitude = @getAltitude()
			if altitude > 0
				@_falling = true
				console.log @_fall_speed
				@_fall_speed = @_fall_speed * @_accelleration
				@setAltitude Math.max(altitude - @_fall_speed, 0)
			else
				@_falling = false
				@_fall_speed = @_initial_fall_speed