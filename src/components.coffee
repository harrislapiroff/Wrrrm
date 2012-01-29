Crafty.c "Protagonist",
	init: () ->
		@requires "2D, DOM, Collision"
	
	protagonist: () ->
		@onHit "Deadly", @die
		
	mortality: () ->
		@_mortality = true
		
	immortality: () ->
		@_mortality = false
		
	die: () ->
		if @_mortality
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
				
			# theta should be mod 360
			@_theta = @_theta % 360
			
			# update the DOM attributes to reflect the changes this frame
			@attr {rotation: @_theta}
	
	rotate: () ->
		old_theta = @_theta
		@_theta = @_theta + @_rotation_speed
		
		# trigger the Rotated event and pass the tdelta
		@trigger "Rotated",  @_theta - old_theta
		
		# trigger complete rotation if we go from near 360 to near 0
		if (@_theta >= 360) or (@_theta <= -360)
			@trigger "CompleteRotation"
	
	rotateTo: (theta) ->
		old_theta = @_theta
		@_theta = 0

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
			@setAltitude altitude
		
		if surface_location
			@setSurfaceLocation surface_location
		
		# set the origin to the center of the planet
		@attr {x: (Crafty.viewport.width - @pos()._w)/2}
		
		@attachToPlanet()
		
		# bind the spinning to the snake spinning
		@planet.bind "Rotated", (tdelta) =>
			if @_attached_to_planet
				@rotateBy(tdelta)
				
		# Rerender on frame
		@bind "EnterFrame", () ->
			# theta should be mod 360
			@_theta = @_theta % 360
			
			# Refresh the altitude, rotation, and origin location
			@attr
				rotation: @_theta
				y: @planet.pos()._y - @_altitude - @pos()._h
			
			@origin @pos()._w/2, @planet.radius + @_altitude + @pos()._h
			
			# change the hit map
			if @map
				x = (@planet.radius + altitude) * Math.cos((90-@_theta)*Math.PI/180) + Crafty.viewport.width/2 - @pos()._w/2
				y = Crafty.viewport.height/2 - (@planet.radius + altitude) * Math.sin((90-@_theta)*Math.PI/180) + @planet.radius - @pos()._h/2
				# shift the map back to 0, 0
				@map.shift -@map.points[0].x, -@map.points[0].y
				# shift the map to the newly calculated rectangular coords
				@map.shift x, y
	
	attachToPlanet: () ->
		@_attached_to_planet = true
	
	detachFromPlanet: () ->
		@_attached_to_planet = false
	
	rotateBy: (tdelta) ->
		@_theta = @_theta + tdelta
		@trigger "RotationChange"
	
	getAltitude: () ->
		@_altitude
		
	setAltitude: (a) ->
		@_altitude = a
		@trigger "AltitudeChange"
			
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
		
		@bind "KeyDown", (e) ->
			if e.key == Crafty.keys.LEFT_ARROW
				@_moveL = true
			if e.key == Crafty.keys.RIGHT_ARROW
				@_moveR = true
			if e.key == Crafty.keys.UP_ARROW and not @isFalling()
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
			
			# falling is true if you're above 0 altitde
			if altitude > 0
				@_falling = true
			else
				@_falling = false
				@_fall_speed = @_initial_fall_speed
			
			# unless you hit a platform
			if @hit(@_collision_selector)
				collision = @hit(@_collision_selector)[0]
				collision_entity = collision.obj
				collision_normal = collision.normal
				if @getAltitude() > collision_entity.getAltitude() - 3
					@_falling = false
			
			if @_falling == true
				@_fall_speed = @_fall_speed * @_accelleration
				@setAltitude Math.max(altitude - @_fall_speed, 0)
	
	isFalling: () ->
		return @_falling

Crafty.c "VisibleCollisionPolygon",
	init: () ->
		@ctx = Crafty.canvas.context
		@bind "EnterFrame", () -> @makePoly()
	
	makePoly: () ->
		if @map
			@ctx.beginPath()
			for point in @map.points
				@ctx.moveTo(point[0], point[1])
			@ctx.stroke()