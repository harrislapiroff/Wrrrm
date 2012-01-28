TESTING = false

Crafty.scene "loading", () ->
	title_text = Crafty.e "2D, DOM, Text, Persist"
	title_text.attr w: Crafty.viewport.width, h: 128, x: 0, y: 40
	title_text.text GAME_TITLE
	title_text.css "text-align": "center", "color": "#000", "font-family": "Medula One", "font-size": 128, "text-transform": "uppercase"
	
	loading_text = Crafty.e "2D, DOM, Text"
	loading_text.attr w: Crafty.viewport.width, h: 20, x: 0, y: (Crafty.viewport.width - 20) / 2
	loading_text.text "Loading..."
	loading_text.css "text-align": "center", "color": "#000"
	
	Crafty.load ["img/person.png", "img/noise.png","img/spike.png"], () ->
		Crafty.scene("ouroboros")


Crafty.scene "ouroboros", () ->
	snake = generate_snake WORLD_RADIUS
	snakehead = generate_snakehead snake, 100
	death_floor = generate_death x: -1000, y: Crafty.viewport.height - 1, w: Crafty.viewport.width + 2000, h: 1
	platform = generate_platform snake, 800, {w: 100, h: 3}, 80
	
	i = 100
	while (i + 900) < WORLD_CIRCUMFERENCE
		i = Crafty.math.randomInt i+300, i + 900
		generate_spike snake, i
		
	KeyDownHandler = () ->
		# keypress triggers the world to start spinning
		unless TESTING
			snake.startSpin -.25
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