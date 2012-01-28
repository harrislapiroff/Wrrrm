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
		@requires "2D, DOM, Tween"
		
	snake: (@radius, @rotation_frames, @stroke=40) ->
		@attr {x: Crafty.viewport.width/2 - @radius, y: Crafty.viewport.height - 200, w: (@radius-@stroke)*2, h: (@radius-@stroke)*2}
		@css {'border-radius': @radius, 'border': "#{@stroke}px solid #000"}
		# set the radius and number of frames for a complete rotation for the snake.
		@origin @radius, @radius
	
	startspin: () ->
		# start the snake spinning
		@attr {rotation: 0}
		@tween {rotation: -360}, @rotation_frames
		@trigger "StartSpin"
	
	stopspin: () ->
		# unimplemented, because there's currently no method to stop the tween
		@trigger "StopSpin"
	
	circumference: () ->
		# returns the circumference of the snake
		@radius*6.28


Crafty.c "SnakePart",
	init: () ->
		@requires "2D, DOM, Tween"
		
	snakepart: (@snake, @circumference_location, @altitude=0) ->
		# set which snake the part is attached to and where on the circumference of the snake the part is located
		# please call this *after* setting a width and height on the entity and its snake parent
		
		# calculate and save the inital rotation
		@initial_rotation = @circumference_location*360/@snake.circumference()
		
		# cache, briefly, the position variables
		snake_pos = @snake.pos()
		snake_r = @snake.radius
		snake_d = snake_r*2
		pos = @pos()
		
		# rotate the entity to be at the correct location on the snake
		@attr {rotation: @initial_rotation, y: snake_pos._y-@altitude, x: (Crafty.viewport.width - pos._w)/2}
		
		# set the origin to the center of the snake
		@origin pos._w/2, snake_d/2 + @altitude
		
		# bind the spinning to the snake spinning
		@snake.bind "StartSpin", () => @_startspin()
		@snake.bind "StopSpin", () => @_stopspin()
	
	_startspin: (e) ->
		@attr {rotation: @initial_rotation}
		@tween {rotation: @initial_rotation-360}, @snake.rotation_frames
	
	_stopspin: () ->
		# unimplemented, because there's currently no method to stop the tween