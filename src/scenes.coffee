Crafty.scene "loading", () ->
	loading_text = Crafty.e "2D, DOM, Text"
	loading_text.attr w: Crafty.viewport.width, h: 20, x: 0, y: (Crafty.viewport.width - 20) / 2
	loading_text.text "Loading..."
	loading_text.css "text-align": "center", "color": "#000"
	
	Crafty.load ["img/person.png"], () ->
		Crafty.scene("ouroboros")


Crafty.scene "ouroboros", () ->
	Crafty.background('#CCC')
	snake = generate_snake 8000, 5000
	generate_spike snake, 400
		
	KeyDownHandler = () ->
		# keypress triggers the world to start spinning
		snake.startspin()
		# make spikes deadly
		spikes = Crafty('spike')
		for spike in spikes
			Crafty(spike).addComponent 'Deadly'
		# unbind the keypress
		Crafty.unbind "KeyDown", KeyDownHandler
	
	Crafty.bind "KeyDown", KeyDownHandler
	
	protagonist = generate_protagonist()
	protagonist.bind "Died", () ->
		Crafty.scene "ouroboros"