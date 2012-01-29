SNAKEHEAD_ORIGIN = 500
PLAYER_ORIGIN = -100

Crafty.scene "loading", () ->
	title_text = Crafty.e "2D, DOM, Text, Tween, Persist, Title"
	title_text.attr w: Crafty.viewport.width, h: 128, x: 0, y: 40
	title_text.text GAME_TITLE
	title_text.css "text-align": "center", "color": "#000", "font-family": "Medula One", "font-size": 128, "text-transform": "uppercase"
	
	loading_text = Crafty.e "2D, DOM, Text"
	loading_text.attr w: Crafty.viewport.width, h: 20, x: 0, y: (Crafty.viewport.width - 20) / 2
	loading_text.text "Loading..."
	loading_text.css "text-align": "center", "color": "#000"
	
	Crafty.load ["img/person.png", "img/noise.png","img/spike.png", "audio/SnakeSong.ogg"], () ->
		Crafty.audio.play "music"
		Crafty.scene("Setup")


Crafty.scene "Setup", () ->
	title_text = Crafty(Crafty("Title")[0])
	snake = generate_snake WORLD_RADIUS
	protagonist = generate_protagonist snake
	snakehead = generate_snakehead snake, SNAKEHEAD_ORIGIN
	death_floor = generate_death x: -1000, y: Crafty.viewport.height + 30, w: Crafty.viewport.width + 2000, h: 1
	platform = generate_platform snake, 800, {w: 100, h: 3}, 80
	platform_2 = generate_platform snake, 900, {w: 100, h: 3}, 120
	snake.addComponent "Persist"
	protagonist.addComponent "Persist"
	snakehead.addComponent "Persist"
	death_floor.addComponent "Persist"
	protagonist.setSurfaceLocation PLAYER_ORIGIN
	
	protagonist.bind "Died", () ->
		# temporary immortality, just in case
		protagonist.immortality()
		# stop the world spinning
		snake.stopSpin()
		# rotate world back to start
		snake.rotateTo 0
		# Make man mortal.
		protagonist.mortality()
		# Move protagonist back to origin
		protagonist.setSurfaceLocation PLAYER_ORIGIN
		# restart current scene (calling a private attribute? Bad bad!)
		Crafty.scene Crafty._current
	
	MovedHandler = () ->
		# unbind the keypress
		protagonist.unbind "Moved", MovedHandler
		# fade out title text
		title_text.tween {alpha: 0}, 100
		# make man mortal
		protagonist.mortality()
		# go to scene 1
		Crafty.scene "Scene 1"

	protagonist.bind "Moved", MovedHandler


Crafty.scene "Scene 1", () ->
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(60, 70, 50)
	snake.startSpin -.35
	
	for i in [900, 1300, 1700, 2100, 2150, 2200, 2600, 3000, 3400, 3800, 3850, 3900, 4300, 4700, 5100, 5500]
		generate_spike snake, i
	
	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 2"

Crafty.scene "Scene 2", () ->
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(190, 20, 30)
	snake.startSpin -.25
	
	for i in [900, 950, 1000, 1050, 1100, 1800, 1850, 1900, 1950, 2000, 2050, 2100, 2150, 4700, 5100, 5500]
		generate_spike snake, i
	
	generate_platform snake, 2000, {w: 100, h: 5}, 50
	generate_platform snake, 2300, {w: 100, h: 5}, 80

	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 3"


Crafty.scene "Scene 3", () ->
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(0, 90, 30)
	snake.startSpin -.5
	
	for i in [900, 1300, 1700, 2100, 2150, 2200, 2600, 3000, 3400, 3800, 3850, 3900, 4300, 4700, 5100, 5500]
		generate_spike snake, i
	
	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 4"

Crafty.scene "Scene 4", () ->
		snake = Crafty(Crafty("Snake")[0])
		protagonist = Crafty(Crafty("Protagonist")[0])
		color_shift(25, 90, 60)
		snake.startSpin -.6

		for i in [825, 850, 900, 1500, 1600, 2200, 2250, 2300, 2600, 3800, 3850, 3900, 4300, 4700, 5100, 5500]
			generate_spike snake, i

		snake.bind "CompleteRotation", () ->
			Crafty.scene "Scene 5"