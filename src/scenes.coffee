TESTING = true

Crafty.scene "loading", () ->
	loading_text = Crafty.e "2D, DOM, Text"
	loading_text.attr w: Crafty.viewport.width, h: 20, x: 0, y: (Crafty.viewport.width - 20) / 2
	loading_text.text "Loading..."
	loading_text.css "text-align": "center", "color": "#000"
	
	Crafty.load ["img/person.png"], () ->
		Crafty.scene("ouroboros")


Crafty.scene "ouroboros", () ->
	snake = generate_snake WORLD_RADIUS, 500
	snakehead = generate_snakehead snake, 100
	
	i = 100
	while (i + 900) < WORLD_CIRCUMFERENCE
		i = Crafty.math.randomInt i+300, i + 900
		generate_spike snake, i
		
	KeyDownHandler = () ->
		# keypress triggers the world to start spinning
		unless TESTING
			snake.startspin()
			# make spikes deadly
			spikes = Crafty('spike')
			for spike in spikes
				Crafty(spike).addComponent 'Deadly'
			# unbind the keypress
			Crafty.unbind "KeyDown", KeyDownHandler
	
	Crafty.bind "KeyDown", KeyDownHandler
	
	protagonist = generate_protagonist snake
	protagonist.bind "Died", () ->
		Crafty.scene "ouroboros"