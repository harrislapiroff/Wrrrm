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
		
	snake: (radius, stroke=40) ->
		@planet radius, stroke
		@css
			'border-style': 'solid'
			'border-color': '#000'
			'background': 'transparent'


Crafty.c "SnakePart",
	init: () ->
		@requires "2D, DOM, Tween, PlanetWalker"
		
	snakepart: (snake, surface_location, altitude) ->
		# initialize the planetwalkerness
		@planetwalker snake, surface_location, altitude

Crafty.c "Planet",
	_rotation_speed: 1
	_rotating: false
	_theta: 0
	
	init: () ->
		@requires "2D, DOM"
	
	planet: (@radius, @stroke) ->
		@attr {x: Crafty.viewport.width/2 - @radius, y: Crafty.viewport.height - 200, w: (@radius-@stroke)*2, h: (@radius-@stroke)*2}
		@css
			'border-radius': @radius
			'border-width': "#{@stroke}px"
		
		# set the origin
		@origin @radius, @radius
		
		@bind "EnterFrame", () ->
			if @_rotating
				@rotate()
			# update the DOM attributes to reflect the changes this frame
			@attr {rotation: @_theta}
	
	rotate: () ->
		old_theta = @_theta
		@_theta = (@_theta + @_rotation_speed) % 360
		
		# trigger the Rotated event and pass the tdelta
		@trigger "Rotated",  @_theta - old_theta
	
	startSpin: (@_rotation_speed = @_rotation_speed) ->
		@_rotating = true
		@trigger "StartRotation"

	stopSpin: () ->
		@_rotating = false
		@trigger "StopRotation"
	
	getCartesianCoords: () ->
		return @pos()
	
	circumference: () ->
		# returns the circumference of the snake
		@radius * 6.28

Crafty.c "PlanetWalker",
	_theta: 0
	_altitude: 0
	
	init: () ->
		@requires "2D, DOM, Tween"
	
	planetwalker: (@planet, surface_location=false, altitude=false) ->
		
		if altitude
			@_altitude = altitude
		
		if surface_location
			@setSurfaceLocation surface_location
		
		# set the origin to the center of the planet
		@attr {x: (Crafty.viewport.width - @pos()._w)/2}
		
		@origin @pos()._w/2, @planet.radius + @_altitude
		
		# bind the spinning to the snake spinning
		@planet.bind "Rotated", (tdelta) => @rotateBy(tdelta)
		
		@bind "EnterFrame", () ->
			@attr
				rotation: @_theta
				y: @planet.pos()._y - @_altitude - @pos()._h
	
	rotateBy: (tdelta) ->
		@_theta = @_theta + tdelta
	
	getAltitude: () ->
		@_altitude
		
	setAltitude: (a) ->
		@_altitude = a
	
	setSurfaceLocation: (surface_location) ->
		@_theta = surface_location * 360 / @planet.circumference()
	
	getCircumferenceLocation: () ->
		@_theta * @planet.circumference() / 360

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
		@setAltitude @getAltitude() + px
	
	_moveC: (px) ->
		@setSurfaceLocation @getCircumferenceLocation() + px

Crafty.c "PlanetGravity",
	
	init: () ->
		@requires "PlanetWalker"
	
	planetGravity: (@_collision_selector=false, @_initial_fall_speed=3, @_accelleration=1.05) ->
		@_fall_speed = @_initial_fall_speed
		@bind "EnterFrame", () ->
			altitude = @getAltitude()
			
			if altitude > 0 and not @hit(@_collision_selector)
				@_falling = true
				
			if altitude <= 0
				@_falling = false
				@_fall_speed = @_initial_fall_speed
			
			if @_falling == true
				@_falling = true
				@_fall_speed = @_fall_speed * @_accelleration
				@setAltitude Math.max(altitude - @_fall_speed, 0)